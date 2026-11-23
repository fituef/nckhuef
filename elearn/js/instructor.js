// instructor.js — instructor studio: CRUD for courses and lessons (stored in localStorage)
import { el, $, clear, initPage, requireRole, toast, confirmDialog, levelClass, icon, iconFor, ICON_NAMES } from './ui.js';
import { getCourses, getCategories, getCourse, saveCatalog, loadCatalog, resetDemoData, countLessons, uid } from './store.js';

if (await initPage('instructor')) {
  const session = requireRole(['instructor', 'admin']);
  if (session) main();

  function main() {
    const root = $('#root');
    const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'course';

    function render() {
      clear(root);
      root.append(el('div', { class: 'row between', style: 'margin-bottom:1rem' }, el('div', {}, el('h1', { style: 'margin:0', text: 'Instructor studio' }), el('p', { class: 'muted', style: 'margin:0', text: `Signed in as ${session.name} (${session.role}). Changes are saved in this browser.` })),
        el('div', { class: 'row' }, el('button', { class: 'btn primary', type: 'button', onclick: () => courseDialog(null) }, icon('plus', 16), 'New course'),
          el('button', { class: 'btn', type: 'button', text: 'Reset demo data', onclick: async () => { if (await confirmDialog('Reset all courses, progress, notes and accounts to the original demo data?', 'Reset')) { resetDemoData(); await loadCatalog(); toast('Demo data restored', 'success'); location.href = 'index.html'; } } }))));
      const rows = getCourses().map((c) => el('tr', {},
        el('td', {}, el('div', { class: 'row', style: 'flex-wrap:nowrap' }, el('span', { class: 'fi', style: 'width:38px;height:38px' }, icon(iconFor(c), 18)), el('div', {}, el('strong', { text: c.title }), el('div', { class: 'muted', style: 'font-size:.85rem', text: c.instructor })))),
        el('td', { text: c.category }), el('td', {}, el('span', { class: levelClass(c.level), text: c.level })), el('td', { text: String(countLessons(c)) }), el('td', { text: c.quiz ? `${c.quiz.questions.length} Qs` : '—' }),
        el('td', {}, el('div', { class: 'row' }, el('a', { class: 'btn small', href: `course.html?id=${c.id}`, text: 'View' }), el('button', { class: 'btn small', type: 'button', text: 'Edit', onclick: () => courseDialog(c) }),
          el('button', { class: 'btn small', type: 'button', text: 'Lessons', onclick: () => lessonsDialog(c) }),
          el('button', { class: 'btn small danger', type: 'button', text: 'Delete', 'aria-label': `Delete ${c.title}`, onclick: async () => { if (await confirmDialog(`Delete "${c.title}" and all its lessons?`, 'Delete')) { catalogRemove(c.id); toast('Course deleted', 'success'); render(); } } })))));
      root.append(el('div', { class: 'card table-wrap' }, el('table', {}, el('caption', { class: 'sr-only', text: 'Courses' }),
        el('thead', {}, el('tr', {}, ['Course', 'Category', 'Level', 'Lessons', 'Quiz', 'Actions'].map((h) => el('th', { scope: 'col', text: h })))), el('tbody', {}, rows))));
    }
    function catalogRemove(id) { const list = getCourses(); list.splice(list.findIndex((c) => c.id === id), 1); saveCatalog(); }

    /* ---------- course dialog ---------- */
    function courseDialog(course) {
      const isNew = !course; const c = course || { title: '', category: '', level: 'Beginner', instructor: session.name, hours: 4, summary: '', description: '', thumb: { icon: 'book-open', hue: Math.floor(Math.random() * 360) } };
      const mk = (id, label, input, hint) => { const err = el('div', { class: 'err', id: `${id}-e`, role: 'alert' }); input.id = id; input.setAttribute('aria-describedby', `${id}-e`); return { id, input, err, wrap: el('div', { class: 'field' }, el('label', { for: id, text: label }), input, err), hint }; };
      const f = {
        title: mk('f-title', 'Title *', el('input', { value: c.title, maxlength: '80' })),
        category: mk('f-cat', 'Category *', el('input', { value: c.category, list: 'cat-list', maxlength: '40' })),
        level: mk('f-level', 'Level', el('select', {}, ['Beginner', 'Intermediate', 'Advanced'].map((l) => el('option', { value: l, text: l, selected: l === c.level })))),
        instructor: mk('f-inst', 'Instructor name *', el('input', { value: c.instructor, maxlength: '60' })),
        hours: mk('f-hours', 'Estimated hours (1–100) *', el('input', { type: 'number', min: '1', max: '100', value: String(c.hours) })),
        emoji: mk('f-icon', 'Course icon', el('div', { class: 'icon-pick', role: 'radiogroup', 'aria-label': 'Course icon' }, ICON_NAMES.map((n) => el('label', { title: n }, el('input', { type: 'radio', name: 'cicon', value: n, checked: n === iconFor(c) }), el('span', {}, icon(n, 20)))))),
        summary: mk('f-sum', 'Short summary * (10–120 characters)', el('input', { value: c.summary, maxlength: '120' })),
        description: mk('f-desc', 'Description *', el('textarea', { maxlength: '800' }))
      };
      f.description.input.value = c.description;
      const dl = el('datalist', { id: 'cat-list' }, getCategories().map((x) => el('option', { value: x })));
      const form = el('form', { novalidate: true }, dl, f.title.wrap, el('div', { class: 'grid-2' }, f.category.wrap, f.level.wrap), el('div', { class: 'grid-2' }, f.instructor.wrap, f.hours.wrap), f.emoji.wrap, f.summary.wrap, f.description.wrap,
        el('div', { class: 'row end' }, el('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => dlg.close() }), el('button', { class: 'btn primary', type: 'submit', text: isNew ? 'Create course' : 'Save changes' })));
      const dlg = el('dialog', { class: 'dlg', 'aria-labelledby': 'cd-title' }, el('h2', { id: 'cd-title', text: isNew ? 'New course' : 'Edit course' }), form);
      form.addEventListener('submit', (e) => {
        e.preventDefault(); const v = (k) => f[k].input.value.trim(); const errs = {};
        if (v('title').length < 3) errs.title = 'Title must be at least 3 characters.';
        if (!v('category')) errs.category = 'Category is required.';
        if (!v('instructor')) errs.instructor = 'Instructor name is required.';
        const h = +f.hours.input.value; if (!(h >= 1 && h <= 100)) errs.hours = 'Enter a number from 1 to 100.';
        if (v('summary').length < 10) errs.summary = 'Summary must be at least 10 characters.';
        if (v('description').length < 20) errs.description = 'Description must be at least 20 characters.';
        Object.entries(f).forEach(([k, x]) => { x.err.textContent = errs[k] || ''; x.wrapEl = x.wrap.classList.toggle('invalid', !!errs[k]); });
        const first = Object.keys(errs)[0]; if (first) { f[first].input.focus(); return; }
        Object.assign(c, { title: v('title'), category: v('category'), level: f.level.input.value, instructor: v('instructor'), hours: h, summary: v('summary'), description: v('description') });
        c.thumb = { hue: c.thumb?.hue ?? 210, icon: form.querySelector('input[name=cicon]:checked')?.value || 'book-open' };
        if (!getCategories().includes(c.category)) getCategories().push(c.category);
        if (isNew) { let id = slug(c.title); let n = 2; while (getCourse(id)) id = `${slug(c.title)}-${n++}`; Object.assign(c, { id, rating: 0, students: 0, sections: [], quiz: null }); getCourses().push(c); }
        saveCatalog(); toast(isNew ? 'Course created' : 'Course updated', 'success'); dlg.close(); render(); if (isNew) lessonsDialog(c);
      });
      dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
    }

    /* ---------- lessons dialog ---------- */
    function parseBody(text) {
      const blocks = []; const t = text.replace(/\r/g, ''); const re = /```[^\n]*\n?([\s\S]*?)```/g; let last = 0, m;
      const plain = (chunk) => chunk.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean).forEach((part) => {
        const lines = part.split('\n'); if (lines.every((l) => /^[-*] /.test(l.trim()))) blocks.push({ t: 'ul', v: lines.map((l) => l.trim().slice(2)) }); else blocks.push({ t: 'p', v: lines.join(' ') });
      });
      while ((m = re.exec(t))) { plain(t.slice(last, m.index)); if (m[1].trim()) blocks.push({ t: 'code', v: m[1].replace(/\n$/, '') }); last = re.lastIndex; }
      plain(t.slice(last)); return blocks;
    }
    const isRich = (blocks) => (blocks || []).some((b) => !['p', 'h', 'ul', 'code'].includes(b.t));
    const bodyToText = (blocks) => (blocks || []).map((b) => (b.t === 'ul' ? b.v.map((x) => `- ${x}`).join('\n') : b.t === 'code' ? `\`\`\`\n${b.v}\n\`\`\`` : b.v)).join('\n\n');

    function lessonsDialog(course) {
      let editing = null; const dlg = el('dialog', { class: 'dlg', 'aria-labelledby': 'ld-title', style: 'width:min(760px,94vw)' });
      function draw() {
        clear(dlg); const secs = course.sections;
        const list = el('div', {}, !secs.length ? el('p', { class: 'muted', text: 'No lessons yet. Add the first one below.' }) : null);
        secs.forEach((sec, si) => {
          list.append(el('h3', { style: 'margin:1rem 0 .2rem', text: `Section ${si + 1}: ${sec.title}` }));
          sec.lessons.forEach((l) => list.append(el('div', { class: 'lesson-edit' }, el('span', { text: `${l.title} · ${l.minutes} min` }),
            el('button', { class: 'btn small', type: 'button', text: 'Edit', onclick: () => { editing = { si, id: l.id }; draw(); } }),
            el('button', { class: 'btn small danger', type: 'button', text: 'Delete', 'aria-label': `Delete lesson ${l.title}`, onclick: async () => { if (await confirmDialog(`Delete lesson "${l.title}"?`, 'Delete')) { sec.lessons = sec.lessons.filter((x) => x.id !== l.id); if (!sec.lessons.length) secs.splice(si, 1); saveCatalog(); toast('Lesson deleted', 'success'); draw(); render(); } } }))));
        });
        const cur = editing ? secs[editing.si].lessons.find((l) => l.id === editing.id) : null;
        const err = el('div', { class: 'alert error', role: 'alert', hidden: true });
        const secSel = el('select', { id: 'l-sec' }, secs.map((s, i) => el('option', { value: String(i), text: `${i + 1}. ${s.title}`, selected: editing ? i === editing.si : i === secs.length - 1 })), el('option', { value: 'new', text: '+ New section', selected: !secs.length }));
        const newSec = el('input', { id: 'l-newsec', placeholder: 'New section title', maxlength: '60' });
        const title = el('input', { id: 'l-title', value: cur?.title || '', maxlength: '80' }), mins = el('input', { id: 'l-min', type: 'number', min: '1', max: '180', value: String(cur?.minutes || 8) });
        const body = el('textarea', { id: 'l-body', placeholder: 'Separate paragraphs with a blank line.\n- Start lines with "- " for a bullet list.\n```\ncode goes between triple backticks\n```' }); body.value = cur ? (isRich(cur.body) ? 'This lesson contains tables, notes or exercises with solutions. Its content is kept as is; you can still edit the title and duration.' : bodyToText(cur.body)) : ''; if (cur && isRich(cur.body)) body.readOnly = true;
        const toggleNew = () => { newSec.parentElement.hidden = secSel.value !== 'new'; }; secSel.addEventListener('change', toggleNew);
        const form = el('form', { novalidate: true }, el('h3', { text: cur ? 'Edit lesson' : 'Add a lesson' }), err,
          el('div', { class: 'grid-2' }, el('div', { class: 'field' }, el('label', { for: 'l-sec', text: 'Section' }), secSel), el('div', { class: 'field' }, el('label', { for: 'l-newsec', text: 'New section title' }), newSec)),
          el('div', { class: 'grid-2' }, el('div', { class: 'field' }, el('label', { for: 'l-title', text: 'Lesson title *' }), title), el('div', { class: 'field' }, el('label', { for: 'l-min', text: 'Minutes (1–180) *' }), mins)),
          el('div', { class: 'field' }, el('label', { for: 'l-body', text: 'Content *' }), body),
          el('div', { class: 'row end' }, cur ? el('button', { class: 'btn', type: 'button', text: 'Cancel edit', onclick: () => { editing = null; draw(); } }) : null, el('button', { class: 'btn primary', type: 'submit', text: cur ? 'Save lesson' : 'Add lesson' })));
        form.addEventListener('submit', (e) => {
          e.preventDefault(); const problems = [];
          if (title.value.trim().length < 3) problems.push('Lesson title must be at least 3 characters.');
          const m = +mins.value; if (!(m >= 1 && m <= 180)) problems.push('Minutes must be between 1 and 180.');
          if (body.value.trim().length < 20) problems.push('Content must be at least 20 characters.');
          if (secSel.value === 'new' && newSec.value.trim().length < 2) problems.push('Enter a title for the new section.');
          if (problems.length) { err.hidden = false; err.textContent = problems.join(' '); return; }
          const lesson = { id: cur?.id || uid('l'), title: title.value.trim(), minutes: m, body: cur && isRich(cur.body) ? cur.body : parseBody(body.value), video: cur?.video || null };
          if (cur) secs[editing.si].lessons = secs[editing.si].lessons.filter((x) => x.id !== cur.id);
          if (secSel.value === 'new') secs.push({ title: newSec.value.trim(), lessons: [lesson] }); else secs[+secSel.value].lessons.push(lesson);
          course.sections = secs.filter((s) => s.lessons.length); saveCatalog(); toast(cur ? 'Lesson saved' : 'Lesson added', 'success'); editing = null; draw(); render();
        });
        dlg.append(el('div', { class: 'row between' }, el('h2', { id: 'ld-title', text: `Lessons — ${course.title}` }), el('button', { class: 'btn small', type: 'button', text: 'Close', onclick: () => dlg.close() })), list, el('hr'), form); toggleNew();
      }
      draw(); dlg.addEventListener('close', () => dlg.remove()); document.body.append(dlg); dlg.showModal();
    }
    render();
  }
}
