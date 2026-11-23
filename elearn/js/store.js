// store.js — data layer: seed data (JSON via Fetch) + browser storage (localStorage)
const K = {
  courses: 'learnhub.courses', session: 'learnhub.session', users: 'learnhub.users',
  progress: 'learnhub.progress', notes: 'learnhub.notes', attempts: 'learnhub.attempts',
  reviews: 'learnhub.reviews', activity: 'learnhub.activity', prefs: 'learnhub.prefs'
};
const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('Storage unavailable', e); } };

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------- catalog ---------- */
let catalog = null;
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot load ${url} (HTTP ${res.status})`);
  return res.json();
}
const DATA_VERSION = '2026-11-23-office';
export async function loadCatalog() {
  if (catalog) return catalog;
  const stored = read(K.courses, null);
  if (stored && Array.isArray(stored.courses) && stored.version === DATA_VERSION) { catalog = stored; return catalog; }
  // first visit, or the bundled course data is newer than what this browser saved:
  // take the bundled courses and keep any courses created in the instructor studio
  const data = await fetchJson('data/courses.json');
  const seedIds = new Set(data.courses.map((c) => c.id));
  const custom = stored && Array.isArray(stored.courses) ? stored.courses.filter((c) => !seedIds.has(c.id)) : [];
  catalog = { version: DATA_VERSION, categories: [...new Set([...(data.categories || []), ...custom.map((c) => c.category).filter(Boolean)])], courses: [...data.courses, ...custom] };
  write(K.courses, catalog);
  const rev = read(K.reviews, {}); let changed = false;
  for (const [id, list] of Object.entries(data.reviews || {})) if (!(id in rev)) { rev[id] = list; changed = true; }
  if (changed || !localStorage.getItem(K.reviews)) write(K.reviews, rev);
  return catalog;
}
export const getCourses = () => catalog.courses;
export const getCategories = () => catalog.categories;
export const getCourse = (id) => catalog.courses.find((c) => c.id === id);
export function saveCatalog() { write(K.courses, catalog); }
export function resetDemoData() {
  Object.values(K).forEach((k) => { if (k !== K.prefs) localStorage.removeItem(k); });
  catalog = null;
}
export const lessonsOf = (course) =>
  course.sections.flatMap((s, si) => s.lessons.map((l) => ({ ...l, sectionIndex: si, sectionTitle: s.title })));
export const countLessons = (course) => lessonsOf(course).length;
export const totalMinutes = (course) => lessonsOf(course).reduce((a, l) => a + (l.minutes || 0), 0);

/* ---------- users & session ---------- */
let seedUsers = null;
async function allUsers() {
  if (!seedUsers) seedUsers = await fetchJson('data/users.json');
  return [...seedUsers, ...read(K.users, [])];
}
export async function login(email, password) {
  const u = (await allUsers()).find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
  if (!u) return null;
  const session = { id: u.id, name: u.name, email: u.email, role: u.role };
  write(K.session, session);
  return session;
}
export async function register(name, email, password) {
  const users = await allUsers();
  if (users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) return { error: 'This email is already registered.' };
  const user = { id: uid('u'), name: name.trim(), email: email.trim(), password, role: 'learner' };
  write(K.users, [...read(K.users, []), user]);
  return { user: await login(email, password) };
}
export const getSession = () => read(K.session, null);
export const logout = () => localStorage.removeItem(K.session);

/* ---------- progress ---------- */
const allProgress = () => read(K.progress, {});
export function getProgress(userId, courseId) { return (allProgress()[userId] || {})[courseId] || null; }
function setProgress(userId, courseId, value) {
  const all = allProgress(); all[userId] = all[userId] || {}; all[userId][courseId] = value; write(K.progress, all);
}
export const enrolledCourseIds = (userId) => Object.keys(allProgress()[userId] || {});
export function enroll(userId, courseId) {
  if (!getProgress(userId, courseId)) setProgress(userId, courseId, { enrolledAt: dayKey(), completed: [], last: null });
}
export function unenroll(userId, courseId) {
  const all = allProgress(); if (all[userId]) { delete all[userId][courseId]; write(K.progress, all); }
}
export function toggleLesson(userId, course, lessonId) {
  const p = getProgress(userId, course.id); if (!p) return null;
  const set = new Set(p.completed);
  const nowDone = !set.has(lessonId);
  nowDone ? set.add(lessonId) : set.delete(lessonId);
  p.completed = [...set]; setProgress(userId, course.id, p);
  if (nowDone) logActivity(userId);
  return nowDone;
}
export function setLast(userId, courseId, lessonId) {
  const p = getProgress(userId, courseId); if (!p) return; p.last = lessonId; setProgress(userId, courseId, p);
}
export function percent(userId, course) {
  const p = getProgress(userId, course.id); const ids = new Set(lessonsOf(course).map((l) => l.id));
  if (!p || ids.size === 0) return 0;
  return Math.round((p.completed.filter((id) => ids.has(id)).length / ids.size) * 100);
}
export function completedCount(userId, course) {
  const p = getProgress(userId, course.id); const ids = new Set(lessonsOf(course).map((l) => l.id));
  return p ? p.completed.filter((id) => ids.has(id)).length : 0;
}

/* ---------- notes ---------- */
export const getNote = (userId, lessonId) => (read(K.notes, {})[userId] || {})[lessonId] || '';
export function setNote(userId, lessonId, text) {
  const all = read(K.notes, {}); all[userId] = all[userId] || {};
  text ? (all[userId][lessonId] = text) : delete all[userId][lessonId]; write(K.notes, all);
}

/* ---------- quiz attempts ---------- */
export const getAttempts = (userId, courseId) => ((read(K.attempts, {})[userId] || {})[courseId] || []);
export function addAttempt(userId, courseId, attempt) {
  const all = read(K.attempts, {}); all[userId] = all[userId] || {}; all[userId][courseId] = [...(all[userId][courseId] || []), attempt];
  write(K.attempts, all); logActivity(userId);
}
export const bestScore = (userId, courseId) => getAttempts(userId, courseId).reduce((m, a) => Math.max(m, a.percent), -1);
export const allAttempts = (userId) => Object.entries(read(K.attempts, {})[userId] || {});
export const PASS_PERCENT = 60;
export const isCompleted = (userId, course) => percent(userId, course) === 100 && bestScore(userId, course.id) >= PASS_PERCENT;

/* ---------- reviews ---------- */
export const getReviews = (courseId) => read(K.reviews, {})[courseId] || [];
export function addReview(courseId, review) {
  const all = read(K.reviews, {}); const list = (all[courseId] || []).filter((r) => r.userId !== review.userId);
  all[courseId] = [{ ...review }, ...list]; write(K.reviews, all);
}
export function ratingOf(course) {
  const r = getReviews(course.id); if (!r.length) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] };
  const dist = [5, 4, 3, 2, 1].map((n) => r.filter((x) => x.rating === n).length);
  return { avg: Math.round((r.reduce((a, x) => a + x.rating, 0) / r.length) * 10) / 10, count: r.length, dist };
}

/* ---------- activity & streak ---------- */
export function logActivity(userId) {
  const all = read(K.activity, {}); all[userId] = all[userId] || {}; const k = dayKey();
  all[userId][k] = (all[userId][k] || 0) + 1; write(K.activity, all);
}
export const getActivity = (userId) => read(K.activity, {})[userId] || {};
export function streak(userId) {
  const a = getActivity(userId); const d = new Date(); let n = 0;
  if (!a[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (a[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- preferences ---------- */
export const getPrefs = () => read(K.prefs, { theme: 'light', fs: 1 });
export const setPrefs = (p) => write(K.prefs, { ...getPrefs(), ...p });
