// dashboard.js — learner dashboard: stats, enrolled courses (resume), weekly chart, badges, certificates
import { el, $, clear, initPage, requireLogin, progressBar, thumb, icon, iconFor } from './ui.js';
import { getCourses, enrolledCourseIds, getCourse, percent, completedCount, countLessons, getProgress, lessonsOf, getActivity, streak, allAttempts, bestScore, isCompleted, dayKey } from './store.js';

if (await initPage('dashboard')) {
  const s = requireLogin(); const root = clear($('#root'));
  if (s) {
    const courses = enrolledCourseIds(s.id).map(getCourse).filter(Boolean);
    const lessonsDone = courses.reduce((a, c) => a + completedCount(s.id, c), 0);
    const attempts = allAttempts(s.id).flatMap(([, list]) => list);
    const avg = attempts.length ? Math.round(allAttempts(s.id).reduce((a, [cid]) => a + Math.max(0, bestScore(s.id, cid)), 0) / allAttempts(s.id).length) : null;
    const st = streak(s.id); const finished = courses.filter((c) => isCompleted(s.id, c));

    const stat = (n, label) => el('div', { class: 'stat' }, el('b', { text: String(n) }), el('span', { text: label }));
    root.append(el('div', { style: 'margin-bottom:1.5rem' }, el('h1', { style: 'margin-bottom:.2rem', text: 'My learning' }), el('p', { class: 'muted', style: 'margin:0', text: `Signed in as ${s.name}` })),
      el('div', { class: 'stats' }, stat(courses.length, 'Courses enrolled'), stat(lessonsDone, 'Lessons completed'), stat(avg === null ? '—' : `${avg}%`, 'Average best quiz score'), stat(st, 'Day streak')));

    const nextOf = (c) => { const p = getProgress(s.id, c.id); const ls = lessonsOf(c); const d = new Set(p.completed); return (p.last && ls.find((l) => l.id === p.last)) || ls.find((l) => !d.has(l.id)) || ls[0]; };
    // continue card: the in-progress course with the most recent activity
    const active = courses.filter((c) => percent(s.id, c) < 100)[0];
    if (active) { const t = nextOf(active); const pct = percent(s.id, active);
      root.append(el('section', { class: 'card continue', 'aria-label': 'Continue learning' }, thumb(active),
        el('div', {}, el('small', { text: 'Continue learning' }), el('h2', { style: 'margin:.1rem 0 .4rem;font-size:1.15rem', text: active.title }), progressBar(pct, `Progress in ${active.title}`), el('small', { class: 'muted', text: `${pct}% complete${t ? ` · Next: ${t.title}` : ''}` })),
        t ? el('a', { class: 'btn primary', href: `lesson.html?course=${active.id}&lesson=${t.id}`, text: pct > 0 ? 'Resume' : 'Start' }) : null)); }

    // enrolled courses table
    const list = el('section', { class: 'card flush', 'aria-labelledby': 'mc-h' }, el('div', { class: 'card-h' }, el('h2', { id: 'mc-h', text: 'Enrolled courses' })));
    if (!courses.length) list.append(el('div', { class: 'empty' }, el('p', { text: "You haven't enrolled in any course yet." }), el('a', { class: 'btn primary', href: 'index.html', text: 'Browse courses' })));
    else {
      const tbody = el('tbody', {});
      courses.forEach((c) => {
        const t = nextOf(c); const pct = percent(s.id, c); const best = bestScore(s.id, c.id);
        tbody.append(el('tr', {},
          el('td', {}, el('div', { class: 'cell-course' }, el('span', { class: 'tile', style: `--h:${c.thumb?.hue ?? 210}`, 'aria-hidden': 'true' }, icon(iconFor(c), 20)), el('div', {}, el('a', { href: `course.html?id=${c.id}`, text: c.title }), el('div', { class: 'muted', style: 'font-size:.82rem', text: `${completedCount(s.id, c)}/${countLessons(c)} lessons` })))),
          el('td', { style: 'min-width:120px' }, progressBar(pct, `Progress in ${c.title}`), el('small', { class: 'muted', text: `${pct}%` })),
          el('td', { text: best >= 0 ? `${best}%` : '—' }),
          el('td', {}, el('div', { class: 'row', style: 'gap:.4rem;flex-wrap:nowrap' },
            t ? el('a', { class: 'btn small primary', href: `lesson.html?course=${c.id}&lesson=${t.id}`, text: pct === 100 ? 'Review' : pct > 0 ? 'Resume' : 'Start' }) : null,
            c.quiz ? el('a', { class: 'btn small', href: `quiz.html?course=${c.id}`, text: 'Quiz' }) : null,
            isCompleted(s.id, c) ? el('a', { class: 'btn small', href: `certificate.html?course=${c.id}` }, icon('award', 14), 'Certificate') : null))));
      });
      list.append(el('div', { class: 'tbl-wrap' }, el('table', {}, el('caption', { class: 'sr-only', text: 'Enrolled courses' }),
        el('thead', {}, el('tr', {}, ['Course', 'Progress', 'Best quiz', 'Actions'].map((h) => el('th', { scope: 'col', text: h })))), tbody)));
    }

    // weekly chart
    const act = getActivity(s.id); const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { key: dayKey(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }), n: act[dayKey(d)] || 0 }; });
    const canvas = el('canvas', { width: '560', height: '260', role: 'img', 'aria-label': `Learning activity in the last 7 days: ${days.map((d) => `${d.label} ${d.n}`).join(', ')}` });
    const chart = el('section', { class: 'card flush', 'aria-labelledby': 'wk-h' }, el('div', { class: 'card-h' }, el('h2', { id: 'wk-h', text: 'Activity, last 7 days' })), el('div', { class: 'card-b' }, canvas, el('small', { class: 'muted', text: 'Lessons completed and quiz attempts per day.' })));

    // badges
    const defs = [
      { ic: 'sprout', name: 'First step', on: lessonsDone >= 1, how: 'Complete 1 lesson' }, { ic: 'layers', name: 'Dedicated', on: lessonsDone >= 5, how: 'Complete 5 lessons' },
      { ic: 'flame', name: '3-day streak', on: st >= 3, how: 'Learn 3 days in a row' }, { ic: 'target', name: 'Quiz ace', on: attempts.some((a) => a.percent === 100), how: 'Score 100% on a quiz' },
      { ic: 'trophy', name: 'Graduate', on: finished.length > 0, how: 'Finish a course (100% + pass quiz)' }];
    const badges = el('section', { class: 'card flush', 'aria-labelledby': 'bd-h' }, el('div', { class: 'card-h' }, el('h2', { id: 'bd-h', text: 'Achievements' })),
      el('ul', { class: 'achv card-b' }, defs.map((b) => el('li', { class: b.on ? 'on' : 'off' }, el('span', { class: 'bi' }, icon(b.ic, 17)), el('span', {}, b.name, el('small', { text: b.how })), el('span', { class: 'sr-only', text: b.on ? ' (earned)' : ' (not yet earned)' })))));
    root.append(el('div', { class: 'dash-grid' }, list, el('div', { style: 'display:grid;gap:1.25rem' }, chart, badges)));

    function draw() {
      const ctx = canvas.getContext('2d'); const css = getComputedStyle(document.documentElement); const W = canvas.width, H = canvas.height;
      const text = css.getPropertyValue('--muted').trim(), border = css.getPropertyValue('--border').trim(), prim = css.getPropertyValue('--accent').trim();
      ctx.clearRect(0, 0, W, H); ctx.font = '14px system-ui, sans-serif'; ctx.textAlign = 'center';
      const max = Math.max(4, ...days.map((d) => d.n)); const padL = 30, padB = 34, padT = 16, ch = H - padB - padT; const bw = (W - padL - 10) / days.length;
      ctx.strokeStyle = border; ctx.fillStyle = text;
      for (let i = 0; i <= 4; i++) { const y = padT + ch - (ch * i) / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - 10, y); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(Math.round((max * i) / 4)), padL - 6, y + 4); }
      ctx.textAlign = 'center';
      days.forEach((d, i) => { const h = (ch * d.n) / max; const x = padL + i * bw + bw * 0.2; ctx.fillStyle = prim; ctx.beginPath(); ctx.roundRect(x, padT + ch - h, bw * 0.6, Math.max(h, d.n ? 3 : 0), 3); ctx.fill();
        ctx.fillStyle = text; ctx.fillText(d.label, x + bw * 0.3, H - 12); if (d.n) ctx.fillText(String(d.n), x + bw * 0.3, padT + ch - h - 6); });
    }
    draw(); new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}
