// lesson.js — lesson player: content, progress, notes, prev/next, resume
import { el, $, clear, initPage, param, progressBar, renderBlocks, toast, icon } from './ui.js';
import { getCourse, getSession, getProgress, enroll, toggleLesson, setLast, percent, completedCount, lessonsOf, getNote, setNote } from './store.js';

if (await initPage('courses')) {
  const course = getCourse(param('course')); const root = $('#root');
  const lessons = course ? lessonsOf(course) : [];
  const lesson = course && (lessons.find((l) => l.id === param('lesson')) || lessons[0]);
  if (!course || !lesson) {
    root.replaceChildren(el('div', { class: 'empty card' }, el('h1', { text: 'Lesson not found' }), el('a', { class: 'btn primary', href: 'index.html', text: 'Back to courses' })));
  } else render();

  function render() {
    const s = getSession(); const prog = s && getProgress(s.id, course.id); const idx = lessons.findIndex((l) => l.id === lesson.id);
    const prev = lessons[idx - 1]; const next = lessons[idx + 1]; const isPreview = idx === 0; const done = new Set(prog?.completed || []);
    document.title = `${lesson.title} · ${course.title}`; clear(root);
    const link = (l) => `lesson.html?course=${course.id}&lesson=${l.id}`;

    // sidebar
    const head = el('div', { class: 'head' }, el('h2', { style: 'font-size:1.02rem;margin-bottom:.5rem' }, el('a', { href: `course.html?id=${course.id}`, text: course.title })));
    if (prog) head.append(progressBar(percent(s.id, course), 'Course progress'), el('small', { class: 'muted', id: 'side-pct', text: `${completedCount(s.id, course)}/${lessons.length} lessons · ${percent(s.id, course)}%` }));
    const side = el('aside', { class: 'card side', 'aria-label': 'Course lessons' }, head);
    course.sections.forEach((sec, si) => {
      side.append(el('h3', { text: `${si + 1}. ${sec.title}` }));
      sec.lessons.forEach((l) => side.append(el('a', { class: `lesson-link${done.has(l.id) ? ' done' : ''}${l.id === lesson.id ? ' current' : ''}`, href: link(l), 'aria-current': l.id === lesson.id ? 'page' : null },
        el('span', { class: 'tick', 'aria-hidden': 'true' }, done.has(l.id) ? icon('check', 13) : null), el('span', { text: l.title }), el('span', { class: 'time', text: `${l.minutes}m` }))));
    });
    if (course.quiz) side.append(el('a', { class: 'btn block', style: 'margin:1rem;width:calc(100% - 2rem)', href: `quiz.html?course=${course.id}` }, icon('help', 16), 'Course quiz'));

    // main
    const article = el('article', { class: 'card' });
    if (!prog && !isPreview) {
      const nextUrl = encodeURIComponent(`lesson.html?course=${course.id}&lesson=${lesson.id}`);
      article.append(el('h1', { text: lesson.title }), el('div', { class: 'alert' }, icon('lock', 16), ' This lesson is for enrolled learners. The first lesson of each course is a free preview.'),
        el('div', { class: 'row', style: 'margin-top:1rem' }, s
          ? el('button', { class: 'btn primary', type: 'button', text: 'Enroll for free', onclick: () => { enroll(s.id, course.id); toast('You are enrolled', 'success'); render(); } })
          : el('a', { class: 'btn primary', href: `login.html?next=${nextUrl}`, text: 'Log in to enroll' }),
          el('a', { class: 'btn', href: link(lessons[0]), text: 'Open free preview' })));
    } else {
      if (prog) setLast(s.id, course.id, lesson.id);
      article.append(el('p', { class: 'muted', style: 'margin:0', text: `Lesson ${idx + 1} of ${lessons.length} · ${lesson.minutes} min${!prog ? ' · Free preview' : ''}` }), el('h1', { text: lesson.title }));
      if (lesson.video) article.append(el('div', { class: 'card', style: 'padding:0;overflow:hidden;margin:1rem 0' }, el('iframe', { src: lesson.video, title: `Video: ${lesson.title}`, loading: 'lazy', allowfullscreen: true, style: 'width:100%;aspect-ratio:16/9;border:0' })));
      article.append(renderBlocks(lesson.body));
      if (prog) {
        const isDone = done.has(lesson.id);
        const btn = el('button', { class: `btn ${isDone ? '' : 'primary'}`, type: 'button', 'aria-pressed': String(isDone), });
        btn.append(...(isDone ? [icon('check-circle', 18), 'Completed — click to undo'] : [icon('check', 18), 'Mark as complete']));
        btn.addEventListener('click', () => { const nowDone = toggleLesson(s.id, course, lesson.id); if (nowDone) toast('Lesson completed', 'success'); render(); $('#mark-btn')?.focus(); });
        btn.id = 'mark-btn'; article.append(el('div', { class: 'row', style: 'margin-top:1.5rem' }, btn));
        // notes
        const status = el('div', { class: 'status', 'aria-live': 'polite' }); let t;
        const ta = el('textarea', { id: 'note', placeholder: 'Write your own notes for this lesson… they are saved automatically.', 'aria-describedby': 'note-hint' }); ta.value = getNote(s.id, lesson.id);
        ta.addEventListener('input', () => { status.textContent = 'Saving…'; clearTimeout(t); t = setTimeout(() => { setNote(s.id, lesson.id, ta.value); status.textContent = 'Saved'; }, 400); });
        article.append(el('section', { style: 'margin-top:2rem' }, el('h2', { style: 'display:flex;gap:.5rem;align-items:center' }, icon('note', 22), 'My notes'), el('label', { class: 'sr-only', for: 'note', text: 'My notes' }), ta, el('small', { id: 'note-hint', class: 'muted', text: 'Notes are private and stored in this browser.' }), status));
      } else article.append(el('div', { class: 'alert', style: 'margin-top:1.5rem' }, 'Enroll to track progress and keep notes. ', el('a', { href: `course.html?id=${course.id}`, text: 'View course' })));
      const canNext = next && (prog || false);
      article.append(el('div', { class: 'pager' },
        prev ? el('a', { class: 'btn', href: link(prev) }, icon('arrow-left', 16), prev.title) : el('span'),
        next ? (canNext ? el('a', { class: 'btn primary', href: link(next) }, next.title, icon('arrow-right', 16)) : el('a', { class: 'btn', href: `course.html?id=${course.id}` }, 'Enroll to continue', icon('arrow-right', 16)))
             : (course.quiz && prog ? el('a', { class: 'btn primary', href: `quiz.html?course=${course.id}` }, 'Take the quiz', icon('arrow-right', 16)) : el('span'))));
    }
    root.append(el('div', { class: 'lesson-layout' }, side, article));
  }
}
