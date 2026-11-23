// course.js — course detail: header, "what you'll learn", curriculum accordion, sticky enrollment card, reviews
import { el, $, clear, initPage, param, stars, progressBar, thumb, levelClass, toast, confirmDialog, icon, meta } from './ui.js';
import { getCourse, getSession, getProgress, enroll, unenroll, percent, completedCount, lessonsOf, countLessons, totalMinutes, getReviews, addReview, ratingOf, getAttempts, bestScore, isCompleted, PASS_PERCENT, dayKey } from './store.js';

if (await initPage('courses')) {
  const course = getCourse(param('id')); const root = $('#root');
  if (!course) {
    root.replaceChildren(el('div', { class: 'empty card' }, el('h1', { text: 'Course not found' }), el('a', { class: 'btn primary', href: 'index.html', text: 'Back to courses' })));
    document.title = 'Course not found · LearnHub';
  } else { document.title = `${course.title} · LearnHub`; render(); }

  function target(lessons, s) {
    const p = s && getProgress(s.id, course.id); const done = new Set(p?.completed || []);
    const t = (p?.last && lessons.find((l) => l.id === p.last)) || lessons.find((l) => !done.has(l.id)) || lessons[0];
    return t ? `lesson.html?course=${course.id}&lesson=${t.id}` : null;
  }

  function render() {
    const s = getSession(); const prog = s && getProgress(s.id, course.id); const lessons = lessonsOf(course); const r = ratingOf(course);
    const done = new Set(prog?.completed || []); const next = encodeURIComponent(`course.html?id=${course.id}`); clear(root);
    const nSec = course.sections.length;

    // dark header band
    const band = el('div', { class: 'course-band' }, el('div', { class: 'container' },
      el('nav', { 'aria-label': 'Breadcrumb', class: 'crumbs' }, el('a', { href: 'index.html', text: 'Courses' }), el('span', { 'aria-hidden': 'true', text: '/' }), el('span', { text: course.category }), el('span', { 'aria-hidden': 'true', text: '/' }), el('span', { 'aria-current': 'page', text: course.title })),
      el('div', { class: 'row', style: 'gap:.4rem;margin-bottom:.8rem' }, el('span', { class: 'chip', text: course.category }), el('span', { class: 'chip', text: course.level })),
      el('h1', { text: course.title, 'data-code': course.id }), el('p', { class: 'lead', text: course.summary }),
      el('div', { class: 'meta' },
        r.count ? el('span', { class: 'mi' }, stars(r.avg), el('span', { text: `${r.avg.toFixed(1)} (${r.count} review${r.count === 1 ? '' : 's'})` })) : el('span', { text: 'No reviews yet' }),
        meta('users', `${course.students.toLocaleString('en-US')} enrolled`), meta('user', course.instructor), meta('calendar', `Updated ${course.updated || '2026'}`))));

    // enrolment card
    const url = target(lessons, s); const actions = el('div', { style: 'display:grid;gap:.6rem' });
    if (!s) actions.append(el('a', { class: 'btn primary lg block', href: `login.html?next=${next}`, text: 'Log in to enrol' }));
    else if (!prog) actions.append(el('button', { class: 'btn primary lg block', type: 'button', text: 'Enrol for free', onclick: () => { enroll(s.id, course.id); toast('You are enrolled', 'success'); render(); } }));
    else {
      if (url) actions.append(el('a', { class: 'btn primary lg block', href: url }, percent(s.id, course) > 0 ? 'Continue learning' : 'Start learning'));
      if (course.quiz) actions.append(el('a', { class: 'btn block', href: `quiz.html?course=${course.id}` }, icon('help', 16), 'Take the quiz'));
      if (isCompleted(s.id, course)) actions.append(el('a', { class: 'btn block', href: `certificate.html?course=${course.id}` }, icon('award', 16), 'View certificate'));
    }
    const includes = el('ul', { class: 'includes' }, [['layers', `${lessons.length} lessons in ${nSec} section${nSec === 1 ? '' : 's'}`], ['clock', `${totalMinutes(course)} minutes of content`], ['help', course.quiz ? `${course.quiz.questions.length}-question quiz` : 'Practice exercises'], ['award', 'Certificate of completion']].map(([i, t]) => el('li', {}, icon(i, 17), t)));
    const card = el('aside', { class: 'card enroll-card', 'aria-label': 'Enrolment' }, thumb(course), el('div', { class: 'inner' },
      prog ? el('div', {}, el('div', { class: 'row between' }, el('strong', { text: 'Your progress' }), el('span', { text: `${percent(s.id, course)}%` })), progressBar(percent(s.id, course), 'Course progress'), el('small', { class: 'muted', text: `${completedCount(s.id, course)} of ${lessons.length} lessons completed` })) : el('div', { class: 'price', text: 'Free' }),
      actions, includes,
      prog ? el('button', { class: 'btn small ghost', type: 'button', text: 'Unenrol from this course', onclick: async () => { if (await confirmDialog('Unenrol from this course? Your progress will be removed.', 'Unenrol')) { unenroll(s.id, course.id); render(); } } }) : null));

    // in-page navigation + sections
    const main = el('div', { class: 'main-col' });
    const sections = [['overview', 'Overview'], ['syllabus', 'Syllabus'], ['instructor', 'Instructor'], ['reviews', 'Reviews']];
    const sub = el('nav', { class: 'subnav', 'aria-label': 'On this page' }, sections.map(([id, l]) => el('a', { href: `#${id}`, text: l })));
    main.append(sub);

    main.append(el('section', { class: 'block', id: 'overview', 'aria-labelledby': 'ov-h' }, el('h2', { id: 'ov-h', text: 'What you will learn' }),
      el('ul', { class: 'outcomes' }, (course.outcomes || lessons.slice(0, 6).map((l) => l.title)).map((o) => el('li', {}, icon('check', 16), el('span', { text: o })))),
      el('h2', { style: 'margin-top:1.6rem', text: 'Description' }), el('p', { text: course.description }),
      course.requirements?.length ? el('div', {}, el('h3', { text: 'Requirements' }), el('ul', { class: 'plain-list' }, course.requirements.map((x) => el('li', { text: x })))) : null,
      course.audience ? el('div', { style: 'margin-top:1rem' }, el('h3', { text: 'Who this course is for' }), el('p', { text: course.audience })) : null));

    const curr = el('section', { class: 'block', id: 'syllabus', 'aria-labelledby': 'curr-h' }, el('h2', { id: 'curr-h', text: 'Syllabus' }),
      el('p', { class: 'muted', text: `${nSec} section${nSec === 1 ? '' : 's'} · ${lessons.length} lessons · ${totalMinutes(course)} min total` }),
      !lessons.length ? el('p', { class: 'muted', text: 'The instructor has not added lessons yet.' }) : null);
    course.sections.forEach((sec, si) => {
      const pid = `sec-${si}`; const open = si === 0; const mins = sec.lessons.reduce((a, l) => a + (l.minutes || 0), 0);
      const btn = el('button', { class: 'acc-btn', type: 'button', 'aria-expanded': String(open), 'aria-controls': pid }, el('span', { text: `${si + 1}. ${sec.title}` }), el('span', { class: 'sec-meta', text: `${sec.lessons.length} lessons · ${mins} min` }), icon('chevron-down', 18));
      const panel = el('div', { class: 'acc-panel', id: pid, hidden: !open });
      sec.lessons.forEach((l) => {
        const isFirst = lessons[0]?.id === l.id;
        panel.append(el('a', { class: `lesson-link${done.has(l.id) ? ' done' : ''}`, href: `lesson.html?course=${course.id}&lesson=${l.id}` },
          el('span', { class: 'tick', 'aria-hidden': 'true' }, done.has(l.id) ? icon('check', 12) : null), el('span', { text: l.title }),
          !prog && isFirst ? el('span', { class: 'chip', text: 'Preview' }) : null,
          !prog && !isFirst ? el('span', { class: 'time' }, icon('lock', 14), el('span', { class: 'sr-only', text: 'Locked' })) : null,
          el('span', { class: 'time', text: `${l.minutes} min` })));
      });
      btn.addEventListener('click', () => { const ex = btn.getAttribute('aria-expanded') === 'true'; btn.setAttribute('aria-expanded', String(!ex)); panel.hidden = ex; });
      curr.append(el('div', { class: 'acc-item' }, el('h3', { style: 'margin:0' }, btn), panel));
    });
    if (course.quiz) {
      const best = s && prog ? bestScore(s.id, course.id) : -1; const n = s && prog ? getAttempts(s.id, course.id).length : 0;
      curr.append(el('div', { class: 'alert', style: 'margin-top:1rem' }, el('strong', { text: 'Final quiz: ' }), `${course.quiz.questions.length} questions, ${Math.round(course.quiz.timeLimit / 60)} minutes, pass mark ${PASS_PERCENT}%.`, n ? ` Best score: ${best}% (${n} attempt${n > 1 ? 's' : ''}).` : ''));
    }
    main.append(curr);

    main.append(el('section', { class: 'block', id: 'instructor', 'aria-labelledby': 'in-h' }, el('h2', { id: 'in-h', text: 'Instructor' }),
      el('div', { class: 'instructor' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: course.instructor.replace(/^(Dr\.|Prof\.)\s*/, '').charAt(0) }),
        el('div', {}, el('strong', { text: course.instructor }), el('div', { class: 'muted', text: course.instructorTitle || 'Course instructor' }), course.instructorBio ? el('p', { style: 'margin:.5rem 0 0', text: course.instructorBio }) : null))));
    main.append(reviewsSection(s, prog, r));
    root.append(band, el('div', { class: 'container course-layout' }, main, card));

    // highlight the section in view
    const links = [...sub.querySelectorAll('a')];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.hash === `#${e.target.id}`)); }), { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(([id]) => io.observe(document.getElementById(id)));
  }

  function reviewsSection(s, prog, r) {
    const sec = el('section', { class: 'block', id: 'reviews', 'aria-labelledby': 'rev-h' }, el('h2', { id: 'rev-h', text: 'Learner reviews' }));
    const list = getReviews(course.id);
    if (!list.length) sec.append(el('p', { class: 'muted', text: 'No reviews yet.' }));
    else {
      sec.append(el('div', { class: 'rating-sum' }, el('div', {}, el('div', { class: 'big', text: r.avg.toFixed(1) }), stars(r.avg), el('div', { class: 'muted', text: `${r.count} review${r.count === 1 ? '' : 's'}` })),
        el('div', { class: 'bars' }, [5, 4, 3, 2, 1].map((n, i) => el('div', { class: 'bar-row' }, el('span', { text: `${n} star` }), progressBar(Math.round((r.dist[i] / r.count) * 100), `${n}-star reviews`), el('span', { text: String(r.dist[i]) }))))));
    }
    list.forEach((x) => sec.append(el('div', { class: 'review' }, el('div', { class: 'row', style: 'gap:.6rem' }, el('strong', { text: x.user }), stars(x.rating), el('small', { class: 'muted', text: x.date })), el('p', { style: 'margin:.3rem 0 0', text: x.text }))));
    if (s && prog) {
      const err = el('div', { class: 'err', role: 'alert' });
      const sel = el('select', { id: 'rv-rating' }, [5, 4, 3, 2, 1].map((n) => el('option', { value: n, text: `${n} star${n > 1 ? 's' : ''}` })));
      const txt = el('textarea', { id: 'rv-text', maxlength: '400', placeholder: 'What did you find useful? (at least 10 characters)' });
      const form = el('form', { class: 'card', style: 'margin-top:1.2rem', novalidate: true },
        el('h3', { text: 'Write a review' }), el('div', { class: 'field' }, el('label', { for: 'rv-rating', text: 'Rating' }), sel),
        el('div', { class: 'field' }, el('label', { for: 'rv-text', text: 'Your review' }), txt, err), el('button', { class: 'btn primary', type: 'submit', text: 'Submit review' }));
      form.addEventListener('submit', (e) => {
        e.preventDefault(); const v = txt.value.trim();
        if (v.length < 10) { err.textContent = 'Please write at least 10 characters.'; txt.setAttribute('aria-invalid', 'true'); txt.focus(); return; }
        addReview(course.id, { userId: s.id, user: s.name, rating: +sel.value, text: v, date: dayKey() }); toast('Thanks for your review', 'success'); render();
      });
      sec.append(form);
    } else sec.append(el('p', { class: 'muted', style: 'margin:1rem 0 0', text: 'Enrol in this course to leave a review.' }));
    return sec;
  }
}
