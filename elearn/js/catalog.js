// catalog.js — course catalogue: search, facet filters (category / level / duration), sort, pagination
import { el, $, clear, initPage, stars, progressBar, thumb, levelClass, icon, meta } from './ui.js';
import { getCourses, getCategories, getSession, getProgress, percent, ratingOf, countLessons } from './store.js';

if (await initPage('courses')) {
  const all = getCourses();
  $('#search-ico').replaceWith(icon('search', 18));
  $('#facts').append(...[[all.length, 'courses'], [all.reduce((a, c) => a + countLessons(c), 0), 'lessons'], [all.reduce((a, c) => a + (c.students || 0), 0).toLocaleString('en-US'), 'enrolments']]
    .map(([n, l]) => el('li', {}, el('strong', { text: String(n) }), el('span', { text: l }))));

  const state = { q: '', cat: new Set(), level: new Set(), dur: new Set(), sort: 'popular', size: 3, page: 1 };
  const DUR = { short: ['Under 3 hours', (h) => h < 3], mid: ['3–5 hours', (h) => h >= 3 && h <= 5], long: ['Over 5 hours', (h) => h > 5] };
  const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

  const group = (legend, key, options, countOf) => el('fieldset', {}, el('legend', { text: legend }),
    options.map(([val, label]) => el('label', { class: 'check' }, el('input', { type: 'checkbox', name: key, value: val, 'data-key': key }), el('span', { text: label }), el('span', { class: 'n', text: String(countOf(val)) }))));
  $('#groups').append(
    group('Category', 'cat', getCategories().map((c) => [c, c]), (v) => all.filter((c) => c.category === v).length),
    group('Level', 'level', LEVELS.map((l) => [l, l]), (v) => all.filter((c) => c.level === v).length),
    group('Duration', 'dur', Object.entries(DUR).map(([k, [l]]) => [k, l]), (v) => all.filter((c) => DUR[v][1](c.hours)).length));

  $('#filters').addEventListener('change', (e) => {
    const k = e.target.dataset.key; if (!k) return;
    e.target.checked ? state[k].add(e.target.value) : state[k].delete(e.target.value); state.page = 1; render();
  });
  $('#clear-filters').addEventListener('click', () => {
    state.cat.clear(); state.level.clear(); state.dur.clear(); state.q = ''; state.page = 1;
    $('#filters').querySelectorAll('input').forEach((i) => (i.checked = false)); $('#f-q').value = ''; render();
  });
  let t;
  $('#f-q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); state.page = 1; render(); }, 200); });
  $('#f-sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $('#f-size').addEventListener('change', (e) => { state.size = +e.target.value; state.page = 1; render(); });

  function filtered() {
    const list = all.filter((c) =>
      (!state.cat.size || state.cat.has(c.category)) && (!state.level.size || state.level.has(c.level)) &&
      (!state.dur.size || [...state.dur].some((k) => DUR[k][1](c.hours))) &&
      (!state.q || [c.title, c.summary, c.instructor, c.category].join(' ').toLowerCase().includes(state.q)));
    const by = {
      popular: (a, b) => b.students - a.students, rating: (a, b) => ratingOf(b).avg - ratingOf(a).avg,
      newest: (a, b) => all.indexOf(b) - all.indexOf(a), title: (a, b) => a.title.localeCompare(b.title), hours: (a, b) => a.hours - b.hours
    };
    return list.sort(by[state.sort]);
  }

  function card(c) {
    const s = getSession(); const prog = s && getProgress(s.id, c.id); const r = ratingOf(c); const href = `course.html?id=${encodeURIComponent(c.id)}`;
    return el('article', { class: 'card course-card' }, thumb(c),
      el('div', { class: 'body' },
        el('div', { class: 'row', style: 'gap:.4rem' }, el('span', { class: 'chip', text: c.category }), el('span', { class: levelClass(c.level), text: c.level })),
        el('h3', {}, el('a', { href, text: c.title })),
        el('p', { class: 'muted', style: 'margin:0;font-size:.92rem', text: c.summary }),
        el('div', { class: 'meta' }, meta('user', c.instructor)),
        el('div', { class: 'meta' }, r.count ? [stars(r.avg), el('span', { text: `${r.avg.toFixed(1)} (${r.count})` })] : el('span', { text: 'No reviews yet' })),
        prog ? el('div', {}, progressBar(percent(s.id, c), `Progress in ${c.title}`), el('small', { class: 'muted', text: `${percent(s.id, c)}% complete` })) : null,
        el('div', { class: 'foot' }, el('span', { class: 'mi' }, icon('book-open', 15), `${countLessons(c)} lessons · ${c.hours}h`), el('a', { href, 'aria-label': `${prog ? 'Continue' : 'View'} ${c.title}`, text: prog ? 'Continue' : 'View course' }))));
  }

  function render() {
    const list = filtered(); const pages = Math.max(1, Math.ceil(list.length / state.size));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * state.size, state.page * state.size);
    const grid = clear($('#grid'));
    $('#result-count').textContent = `${list.length} course${list.length === 1 ? '' : 's'}`;
    if (!slice.length) grid.append(el('div', { class: 'empty card', style: 'grid-column:1/-1' }, el('h2', { text: 'No courses match your criteria' }), el('p', { text: 'Remove a filter or try a different keyword.' })));
    slice.forEach((c) => grid.append(card(c)));
    const pager = clear($('#pager'));
    if (pages > 1) {
      pager.append(el('button', { class: 'btn small', type: 'button', text: 'Previous', disabled: state.page === 1, onclick: () => { state.page--; render(); } }));
      for (let i = 1; i <= pages; i++) pager.append(el('button', { class: 'btn small', type: 'button', text: String(i), 'aria-label': `Page ${i}`, 'aria-current': i === state.page ? 'page' : null, onclick: () => { state.page = i; render(); } }));
      pager.append(el('button', { class: 'btn small', type: 'button', text: 'Next', disabled: state.page === pages, onclick: () => { state.page++; render(); } }));
    }
  }
  render();
}
