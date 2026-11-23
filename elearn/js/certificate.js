// certificate.js — printable completion certificate
import { el, $, initPage, requireLogin, param, icon } from './ui.js';
import { getCourse, isCompleted, PASS_PERCENT, getAttempts } from './store.js';

if (await initPage('dashboard')) {
  const s = requireLogin(); const root = $('#root'); const c = getCourse(param('course'));
  if (s) {
    if (!c || !isCompleted(s.id, c)) {
      root.append(el('div', { class: 'card' }, el('h1', { text: 'Certificate not available yet' }), el('p', { text: `To earn a certificate, complete 100% of the lessons and pass the quiz with at least ${PASS_PERCENT}%.` }), el('a', { class: 'btn primary', href: c ? `course.html?id=${c.id}` : 'index.html', text: 'Back to course' })));
    } else {
      let h = 0; for (const ch of `${s.id}|${c.id}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const last = getAttempts(s.id, c.id).slice(-1)[0]; const date = new Date(last?.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      root.append(el('div', { class: 'row end no-print', style: 'margin-bottom:1rem' }, el('a', { class: 'btn', href: 'dashboard.html' }, icon('arrow-left', 16), 'Back'), el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, icon('printer', 16), 'Print / Save as PDF')),
        el('section', { class: 'cert', 'aria-label': 'Certificate of completion' }, el('p', { style: 'margin:0 0 1.5rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase', text: 'LearnHub' }), el('h1', { text: 'Certificate of Completion' }), el('p', { text: 'This certifies that' }), el('div', { class: 'name', text: s.name }),
          el('p', { text: 'has successfully completed the course' }), el('h2', { text: c.title }), el('p', { class: 'muted', text: `Instructor: ${c.instructor} · Best quiz score: ${last ? Math.max(...getAttempts(s.id, c.id).map((a) => a.percent)) : '—'}%` }),
          el('p', { text: `Issued on ${date}` }), el('small', { class: 'muted', text: `Certificate ID: LH-${h.toString(16).toUpperCase().padStart(8, '0')}` })));
    }
  }
}
