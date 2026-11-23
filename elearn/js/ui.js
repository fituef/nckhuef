// ui.js — shared UI helpers: safe DOM builder, header/footer, theme, toast, dialogs
import { getSession, logout, getPrefs, setPrefs, loadCatalog } from './store.js';


/* ---------- icon set (inline SVG, stroke icons) ---------- */
const ICONS = {
  'book-open': 'M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z',
  layout: 'M3 3h18v18H3z M3 9h18 M9 21V9', zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', code: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
  smartphone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01',
  'git-branch': 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  palette: 'M12 22a10 10 0 1 1 10-10c0 3-2 4-4 4h-2a2 2 0 0 0-1 3.7c.6.8.2 2.3-3 2.3z M7.5 11h.01 M12 7h.01 M16.5 10h.01',
  rocket: 'M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z M12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0 M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2', user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  check: 'M20 6L9 17l-5-5', 'check-circle': 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4L12 14l-3-3', x: 'M18 6L6 18 M6 6l12 12',
  'x-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M15 9l-6 6 M9 9l6 6', 'play-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M10 8l6 4-6 4z',
  award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.2 13.9L7 23l5-3 5 3-1.2-9.1',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3 0 1.4 1 2.5 2.5 2.5z',
  'bar-chart': 'M12 20V10 M18 20V4 M6 20v-4', note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4',
  menu: 'M3 12h18 M3 6h18 M3 18h18', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3', 'arrow-right': 'M5 12h14 M12 5l7 7-7 7', 'arrow-left': 'M19 12H5 M12 19l-7-7 7-7',
  graduation: 'M22 10L12 5 2 10l10 5z M6 12v5c3 2 9 2 12 0v-5 M22 10v6', sprout: 'M7 20h10 M10 20c5.5-2.5.8-6.4 3-10 M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.7V17c0 .6-.5 1-1.2 1.2C7.8 18.5 7 20 7 22 M14 14.7V17c0 .6.5 1 1.2 1.2 1 .3 1.8 1.8 1.8 3.8 M18 2H6v7a6 6 0 0 0 12 0z',
  layers: 'M12 2L2 7l10 5 10-5z M2 17l10 5 10-5 M2 12l10 5 10-5', printer: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  calendar: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
  'chevron-down': 'M6 9l6 6 6-6', plus: 'M12 5v14 M5 12h14', edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', trash: 'M3 6h18 M19 6l-1 14H6L5 6 M8 6V4h8v2 M10 11v6 M14 11v6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17h.01',
  lightbulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z', download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', infinity: 'M18.2 7.8a4.4 4.4 0 1 0 0 8.4c2-.1 3.4-2 6-4.2-2.6-2.2-4-4.1-6-4.2z M5.8 16.2a4.4 4.4 0 1 1 0-8.4c2 .1 3.4 2 6 4.2-2.6 2.2-4 4.1-6 4.2z', copy: 'M9 9h11v11H9z M5 15V5a2 2 0 0 1 2-2h10'
};
export function icon(name, size = 18, cls = '') {
  const NS = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `ico ${cls}`.trim());
  svg.setAttribute('fill', name === 'star-fill' ? 'currentColor' : 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS(NS, 'path'); path.setAttribute('d', ICONS[name === 'star-fill' ? 'star' : name] || ICONS['book-open']); svg.append(path); return svg;
}
export const iconFor = (c) => c?.thumb?.icon || ({ '🧱': 'layout', '⚡': 'zap', '📱': 'smartphone', '🌿': 'git-branch', '🎨': 'palette', '🚀': 'rocket' })[c?.thumb?.emoji] || 'book-open';
export const ICON_NAMES = ['book-open', 'layout', 'zap', 'code', 'smartphone', 'git-branch', 'palette', 'rocket', 'layers', 'target', 'bar-chart', 'shield'];

/** Safe element builder: text is always inserted as text nodes (no innerHTML → no XSS). */
export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; n.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return n;
}
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); return n; };
export const param = (k) => new URLSearchParams(location.search).get(k);

/* ---------- theme & font size ---------- */
export function applyPrefs() {
  const p = getPrefs();
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.style.setProperty('--fs', p.fs);
}
applyPrefs();

/* ---------- toast ---------- */
export function toast(message, type = 'info') {
  let box = $('#toasts');
  if (!box) { box = el('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = el('div', { class: `toast ${type}`, role: 'status' }, message);
  box.append(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100);
}

/* ---------- confirm dialog (native <dialog>) ---------- */
export function confirmDialog(message, okLabel = 'Confirm') {
  return new Promise((resolve) => {
    const dlg = el('dialog', { class: 'dlg', 'aria-labelledby': 'cf-title' },
      el('h2', { id: 'cf-title', text: 'Please confirm' }), el('p', { text: message }),
      el('div', { class: 'row end' },
        el('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => dlg.close('no') }),
        el('button', { class: 'btn danger', type: 'button', text: okLabel, onclick: () => dlg.close('yes') })));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'yes'); dlg.remove(); });
    document.body.append(dlg); dlg.showModal();
  });
}

/* ---------- header / footer ---------- */
const NAV = [
  { href: 'index.html', label: 'Courses', key: 'courses' },
  { href: 'dashboard.html', label: 'My learning', key: 'dashboard' },
  { href: 'instructor.html', label: 'Instructor studio', key: 'instructor', roles: ['instructor', 'admin'] }
];
function headerNode(active) {
  const s = getSession();
  const links = NAV.filter((n) => !n.roles || (s && n.roles.includes(s.role))).map((n) =>
    el('a', { href: n.href, class: n.key === active ? 'active' : '', 'aria-current': n.key === active ? 'page' : null, text: n.label }));
  const menu = el('nav', { id: 'main-nav', class: 'nav', 'aria-label': 'Main' }, links);
  const toggle = el('button', { class: 'icon-btn nav-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'main-nav', 'aria-label': 'Toggle menu' }, icon('menu', 20));
  toggle.addEventListener('click', () => { const open = menu.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
  const themeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Toggle dark mode', title: 'Dark / light mode' });
  const paintTheme = () => themeBtn.replaceChildren(icon(getPrefs().theme === 'dark' ? 'sun' : 'moon', 18)); paintTheme();
  themeBtn.addEventListener('click', () => { setPrefs({ theme: getPrefs().theme === 'dark' ? 'light' : 'dark' }); applyPrefs(); paintTheme(); });
  const fs = (d) => () => { const v = Math.min(1.4, Math.max(0.85, +(getPrefs().fs + d).toFixed(2))); setPrefs({ fs: v }); applyPrefs(); };
  const fontBtns = el('div', { class: 'font-ctl', role: 'group', 'aria-label': 'Text size' },
    el('button', { class: 'icon-btn txt', type: 'button', 'aria-label': 'Decrease text size', text: 'A−', onclick: fs(-0.1) }),
    el('button', { class: 'icon-btn txt', type: 'button', 'aria-label': 'Increase text size', text: 'A+', onclick: fs(0.1) }));
  const account = s
    ? el('div', { class: 'account' }, el('span', { class: 'avatar', 'aria-hidden': 'true', text: s.name.trim().charAt(0).toUpperCase() }),
        el('span', { class: 'who' }, el('strong', { text: s.name }), el('small', { text: s.role })),
        el('button', { class: 'btn small', type: 'button', text: 'Log out', onclick: () => { logout(); location.href = 'index.html'; } }))
    : el('a', { class: 'btn small primary', href: `login.html?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`, text: 'Log in' });
  return el('header', { class: 'site-header' }, el('div', { class: 'container bar' },
    el('a', { class: 'brand', href: 'index.html', 'aria-label': 'LearnHub home' }, el('span', { class: 'logo' }, icon('graduation', 20)), el('span', { text: 'LearnHub' })),
    toggle, menu, el('div', { class: 'tools' }, fontBtns, themeBtn, account)));
}
function footerNode() {
  const col = (title, links) => el('div', {}, el('h2', { class: 'ft-h', text: title }), el('ul', {}, links.map(([l, h]) => el('li', {}, el('a', { href: h, text: l })))));
  return el('footer', { class: 'site-footer' }, el('div', { class: 'container ft-grid' },
    el('div', {}, el('a', { class: 'brand', href: 'index.html' }, el('span', { class: 'logo' }, icon('graduation', 20)), el('span', { text: 'LearnHub' })),
      el('p', { class: 'muted', text: 'Self-paced courses in web development, design and developer tools.' })),
    col('Learn', [['All courses', 'index.html'], ['My learning', 'dashboard.html'], ['Certificates', 'dashboard.html']]),
    col('Teach', [['Instructor studio', 'instructor.html']]),
    col('Help', [['Log in', 'login.html'], ['Demo accounts', 'login.html']])),
    el('div', { class: 'container ft-bottom', text: '© 2026 LearnHub. Course data is stored locally in your browser.' }));
}
export async function initPage(active) {
  $('#site-header')?.replaceWith(headerNode(active));
  $('#site-footer')?.replaceWith(footerNode());
  try { await loadCatalog(); return true; }
  catch (e) {
    $('#main').replaceChildren(el('div', { class: 'container' }, el('div', { class: 'alert error', role: 'alert' },
      el('strong', { text: 'Could not load course data. ' }),
      'Open the site through a web server (for example: ', el('code', { text: 'python -m http.server 8080' }), ' or VS Code Live Server) — browsers block fetch() on file:// pages. ', el('small', { text: String(e.message) }))));
    return false;
  }
}

/* ---------- guards ---------- */
export function requireLogin() {
  const s = getSession();
  if (!s) { location.replace(`login.html?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`); return null; }
  return s;
}
export function requireRole(roles) {
  const s = requireLogin(); if (!s) return null;
  if (!roles.includes(s.role)) {
    $('#main').replaceChildren(el('div', { class: 'container' }, el('div', { class: 'alert error', role: 'alert' }, 'You do not have permission to view this page. Log in with an instructor or admin account.')));
    return null;
  }
  return s;
}

/* ---------- small shared components ---------- */
export function stars(value) {
  const full = Math.round(value); const w = el('span', { class: 'stars', role: 'img', 'aria-label': `${value} out of 5` });
  for (let i = 0; i < 5; i++) w.append(icon('star-fill', 14, i < full ? 'on' : 'off')); return w;
}
export function progressBar(pct, label = 'Progress') {
  return el('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, el('span', { style: `width:${pct}%` }));
}
export function thumb(c, big = false) {
  const h = c.thumb?.hue ?? 210;
  return el('div', { class: `thumb${big ? ' big' : ''}`, style: `--h:${h}`, 'aria-hidden': 'true' }, icon(iconFor(c), big ? 56 : 40));
}
export const meta = (name, text) => el('span', { class: 'mi' }, icon(name, 15), el('span', { text }));
export function shuffle(arr) {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}
export function renderBlocks(blocks) {
  const wrap = el('div', { class: 'prose' });
  for (const b of blocks || []) {
    if (b.t === 'p') wrap.append(el('p', { text: b.v }));
    else if (b.t === 'h') wrap.append(el('h3', { text: b.v }));
    else if (b.t === 'ul') wrap.append(el('ul', {}, b.v.map((x) => el('li', { text: x }))));
    else if (b.t === 'ol') wrap.append(el('ol', {}, b.v.map((x) => el('li', { text: x }))));
    else if (b.t === 'note') wrap.append(el('div', { class: `note ${b.k || 'info'}`, role: 'note' }, el('strong', { text: ({ tip: 'Mẹo', warn: 'Lưu ý', info: 'Ghi nhớ', key: 'Phím tắt' })[b.k || 'info'] }), el('span', { text: b.v })));
    else if (b.t === 'table') {
      const tb = el('table', { class: 'doc-table' }, b.cap ? el('caption', { text: b.cap }) : null, el('thead', {}, el('tr', {}, b.head.map((h) => el('th', { scope: 'col', text: h })))),
        el('tbody', {}, b.rows.map((r) => el('tr', {}, r.map((c, i) => (i === 0 && b.rowHead ? el('th', { scope: 'row', text: c }) : el('td', { text: c })))))));
      wrap.append(el('div', { class: 'tbl-wrap doc-table-wrap', tabindex: '0', role: 'region', 'aria-label': b.cap || 'Bảng' }, tb));
    } else if (b.t === 'ex') {
      const d = el('details', { class: 'solution' }, el('summary', {}, icon('lightbulb', 16), ' Xem lời giải chi tiết'),
        el('ol', { class: 'steps' }, b.steps.map((x) => el('li', { text: x }))), b.result ? el('p', { class: 'result' }, el('strong', { text: 'Kết quả: ' }), b.result) : null);
      wrap.append(el('section', { class: 'exercise', 'aria-label': `Bài tập: ${b.title}` }, el('div', { class: 'ex-head' }, el('span', { class: 'chip', text: b.lv || 'Cơ bản' }), el('strong', { text: `Bài tập: ${b.title}` })),
        el('p', { text: b.q }), b.data ? el('div', { class: 'tbl-wrap doc-table-wrap', tabindex: '0' }, el('table', { class: 'doc-table' }, el('thead', {}, el('tr', {}, b.data.head.map((h) => el('th', { scope: 'col', text: h })))), el('tbody', {}, b.data.rows.map((r) => el('tr', {}, r.map((c) => el('td', { text: c }))))))) : null, d));
    } else if (b.t === 'code') {
      const code = el('code', { text: b.v });
      const btn = el('button', { class: 'btn small copy', type: 'button', text: 'Copy', 'aria-label': 'Copy code' });
      btn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.v); btn.textContent = 'Copied'; } catch { btn.textContent = 'Press Ctrl+C'; } setTimeout(() => (btn.textContent = 'Copy'), 1500); });
      wrap.append(el('div', { class: 'codebox' }, btn, el('pre', { tabindex: '0' }, code)));
    }
  }
  return wrap;
}
export const levelClass = (l) => `chip lvl-${(l || '').toLowerCase()}`;
