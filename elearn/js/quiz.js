// quiz.js — timed quiz: shuffled questions/options, validation, scoring, answer review
import { el, $, clear, initPage, param, requireLogin, shuffle, toast, icon } from './ui.js';
import { getCourse, getProgress, addAttempt, getAttempts, bestScore, isCompleted, PASS_PERCENT } from './store.js';

if (await initPage('courses')) {
  const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const session = requireLogin(); const root = $('#root'); const course = getCourse(param('course'));
  if (session) {
    if (!course || !course.quiz?.questions?.length) {
      root.replaceChildren(el('div', { class: 'empty card' }, el('h1', { text: 'Quiz not available' }), el('a', { class: 'btn primary', href: 'index.html', text: 'Back to courses' })));
    } else if (!getProgress(session.id, course.id)) {
      root.replaceChildren(el('div', { class: 'card' }, el('h1', { text: course.title }), el('p', { text: 'You need to enroll in this course before taking the quiz.' }), el('a', { class: 'btn primary', href: `course.html?id=${course.id}`, text: 'Go to course' })));
    } else intro();
  }


  function intro() {
    document.title = `Quiz · ${course.title}`; const q = course.quiz; const n = getAttempts(session.id, course.id).length; const best = bestScore(session.id, course.id);
    clear(root).append(el('div', { class: 'card' }, el('p', { class: 'muted', style: 'margin:0' }, el('a', { href: `course.html?id=${course.id}`, text: course.title })), el('h1', { text: 'Course quiz' }),
      el('ul', {}, el('li', { text: `${q.questions.length} multiple-choice questions` }), el('li', { text: `Time limit: ${fmt(q.timeLimit)} minutes` }), el('li', { text: `Pass mark: ${PASS_PERCENT}%` }), el('li', { text: 'Questions and answers are shuffled every attempt.' })),
      n ? el('p', { class: 'muted', text: `Attempts: ${n} · Best score: ${best}%` }) : null,
      el('button', { class: 'btn primary', type: 'button', text: n ? 'Try again' : 'Start quiz', onclick: start })));
  }

  function start() {
    const questions = shuffle(course.quiz.questions).map((q) => ({ ...q, order: shuffle(q.options.map((_, i) => i)) }));
    let remaining = course.quiz.timeLimit; const startedAt = Date.now();
    const timer = el('span', { class: 'timer', role: 'timer', 'aria-live': 'off', text: fmt(remaining) });
    const summary = el('div', { class: 'alert error', role: 'alert', hidden: true });
    const answered = el('span', { class: 'muted', text: `0/${questions.length} answered` });
    const form = el('form', { novalidate: true });
    questions.forEach((q, qi) => {
      const fs = el('fieldset', { class: 'q', id: `q${qi}` }, el('legend', { text: `${qi + 1}. ${q.q}` }));
      q.order.forEach((orig, di) => fs.append(el('label', { class: 'opt' }, el('input', { type: 'radio', name: `q${qi}`, value: String(di), required: true }), el('span', { text: q.options[orig] }))));
      form.append(fs);
    });
    form.append(el('div', { class: 'row end' }, el('button', { class: 'btn primary', type: 'submit', text: 'Submit answers' })));
    form.addEventListener('change', () => { const c = questions.filter((_, i) => form.elements[`q${i}`].value !== '').length; answered.textContent = `${c}/${questions.length} answered`; $$unans(false); summary.hidden = true; });
    const $$unans = (mark) => questions.forEach((_, i) => { const f = $(`#q${i}`); f.classList.toggle('unanswered', mark && form.elements[`q${i}`].value === ''); });
    const tick = setInterval(() => { remaining--; timer.textContent = fmt(Math.max(0, remaining)); timer.classList.toggle('low', remaining <= 30); if (remaining <= 0) { clearInterval(tick); finish(true); } }, 1000);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const missing = questions.map((_, i) => i).filter((i) => form.elements[`q${i}`].value === '');
      if (missing.length) { $$unans(true); summary.hidden = false; summary.textContent = `Please answer question${missing.length > 1 ? 's' : ''} ${missing.map((i) => i + 1).join(', ')} before submitting.`; $(`#q${missing[0]} input`).focus(); return; }
      clearInterval(tick); finish(false);
    });
    function finish(timeUp) {
      const picks = questions.map((q, i) => { const v = form.elements[`q${i}`].value; return v === '' ? null : q.order[+v]; });
      const correct = picks.filter((p, i) => p === questions[i].answer).length; const pct = Math.round((correct / questions.length) * 100);
      addAttempt(session.id, course.id, { date: new Date().toISOString(), score: correct, total: questions.length, percent: pct, seconds: Math.round((Date.now() - startedAt) / 1000) });
      result(questions, picks, correct, pct, timeUp);
    }
    window.addEventListener('pagehide', () => clearInterval(tick), { once: true });
    clear(root).append(el('div', { class: 'sticky-bar row between' }, el('strong', { text: course.title }), answered, el('span', {}, 'Time left: ', timer)), summary, form);
  }

  function result(questions, picks, correct, pct, timeUp) {
    const pass = pct >= PASS_PERCENT; clear(root); window.scrollTo(0, 0);
    root.append(el('div', { class: 'card center' }, timeUp ? el('div', { class: 'alert', style: 'margin-bottom:1rem', text: "Time's up — unanswered questions count as incorrect." }) : null,
      el('div', { class: 'score', 'aria-label': `Score ${pct} percent`, text: `${pct}%` }), el('p', { text: `${correct} of ${questions.length} correct` }),
      el('p', { class: pass ? 'alert ok' : 'alert error', role: 'status', text: pass ? 'Congratulations — you passed!' : `You need ${PASS_PERCENT}% to pass. Review the answers below and try again.` }),
      el('div', { class: 'row', style: 'justify-content:center' }, el('button', { class: 'btn primary', type: 'button', text: 'Try again', onclick: start }), el('a', { class: 'btn', href: `course.html?id=${course.id}`, text: 'Back to course' }),
        el('a', { class: 'btn', href: 'dashboard.html', text: 'My learning' }), isCompleted(session.id, course) ? el('a', { class: 'btn', href: `certificate.html?course=${course.id}` }, icon('award', 16), 'Get certificate') : null)));
    root.append(el('h2', { style: 'margin-top:2rem', text: 'Review your answers' }));
    questions.forEach((q, i) => {
      const ok = picks[i] === q.answer;
      root.append(el('div', { class: 'q' }, el('p', { style: 'font-weight:700;display:flex;gap:.5rem;align-items:flex-start' }, el('span', { style: `color:var(--${ok ? 'success' : 'danger'});margin-top:.2rem` }, icon(ok ? 'check-circle' : 'x-circle', 20)), el('span', { text: `${i + 1}. ${q.q}` })),
        q.order.map((orig) => el('div', { class: `opt${orig === q.answer ? ' correct' : orig === picks[i] ? ' wrong' : ''}` }, orig === q.answer ? icon('check', 16) : orig === picks[i] ? icon('x', 16) : el('span', { style: 'width:16px', 'aria-hidden': 'true' }), el('span', { text: q.options[orig] }),
          orig === q.answer ? el('span', { class: 'sr-only', text: '(correct answer)' }) : null,
          orig === picks[i] ? el('small', { class: 'muted', text: '(your answer)' }) : null)),
        picks[i] === null ? el('small', { class: 'muted', text: 'Not answered.' }) : null, el('p', { class: 'muted', style: 'margin:.6rem 0 0;display:flex;gap:.5rem;align-items:flex-start' }, icon('lightbulb', 17), el('span', { text: q.explain }))));
    });
    toast(pass ? 'Quiz passed' : 'Quiz submitted', pass ? 'success' : 'info');
  }
}
