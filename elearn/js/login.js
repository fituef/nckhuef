// login.js — simulated authentication: log in / register with client-side validation
import { el, $, clear, initPage, toast, param, icon } from './ui.js';
import { login, register, getSession } from './store.js';

if (await initPage('')) {
  const root = $('#root');
  const rawNext = param('next') || 'dashboard.html';
  const next = /^[a-z-]+\.html(\?[\w=&%.-]*)?$/i.test(rawNext) ? rawNext : 'dashboard.html'; // only same-site pages
  let mode = 'login';
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function field(id, label, type, extra = {}) {
    const input = el('input', { id, name: id, type, autocomplete: extra.autocomplete, 'aria-describedby': `${id}-err`, required: true }); const err = el('div', { class: 'err', id: `${id}-err`, role: 'alert' });
    const wrap = el('div', { class: 'field' }, el('label', { for: id, text: label }), input, err);
    const setError = (m) => { err.textContent = m || ''; wrap.classList.toggle('invalid', !!m); input.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; };
    input.addEventListener('input', () => setError('')); return { wrap, input, setError };
  }
  function render() {
    clear(root); const s = getSession();
    if (s) { root.append(el('div', { class: 'card', style: 'max-width:520px;margin:2rem auto' }, el('h1', { text: `You are logged in` }), el('p', { text: `Signed in as ${s.name} (${s.role}).` }), el('a', { class: 'btn primary', href: next, text: 'Continue' }))); return; }
    const isLogin = mode === 'login';
    const name = field('name', 'Full name', 'text', { autocomplete: 'name' }), email = field('email', 'Email', 'email', { autocomplete: 'email' }),
      pw = field('password', 'Password (min. 6 characters)', 'password', { autocomplete: isLogin ? 'current-password' : 'new-password' }), pw2 = field('password2', 'Confirm password', 'password', { autocomplete: 'new-password' });
    const form = el('form', { novalidate: true }, isLogin ? null : name.wrap, email.wrap, pw.wrap, isLogin ? null : pw2.wrap, el('div', { class: 'alert error', role: 'alert', hidden: true, id: 'form-err' }),
      el('button', { class: 'btn primary', type: 'submit', style: 'width:100%;margin-top:.5rem', text: isLogin ? 'Log in' : 'Create account' }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const ferr = $('#form-err'); ferr.hidden = true;
      const results = [!isLogin ? name.setError(name.input.value.trim().length >= 2 ? '' : 'Please enter your name.') : true, email.setError(emailOk(email.input.value.trim()) ? '' : 'Enter a valid email address.'),
        pw.setError(pw.input.value.length >= 6 ? '' : 'Password must be at least 6 characters.'), !isLogin ? pw2.setError(pw2.input.value === pw.input.value ? '' : 'Passwords do not match.') : true];
      if (results.includes(false)) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
      if (isLogin) { const u = await login(email.input.value, pw.input.value); if (!u) { ferr.textContent = 'Incorrect email or password.'; ferr.hidden = false; return; } toast(`Welcome, ${u.name}!`, 'success'); location.href = next; }
      else { const r = await register(name.input.value, email.input.value, pw.input.value); if (r.error) { email.setError(r.error); email.input.focus(); return; } toast('Account created', 'success'); location.href = next; }
    });
    const demo = el('div', { style: 'margin-top:1.4rem;padding-top:1rem;border-top:1px solid var(--border)' }, el('h2', { style: 'font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em', text: 'Demo accounts (password 123456)' }),
      el('table', { class: 'demo-tbl' }, el('tbody', {}, [['Learner', 'learner@demo.com'], ['Instructor', 'instructor@demo.com'], ['Admin', 'admin@demo.com']].map(([r, em]) =>
        el('tr', {}, el('td', { text: r }), el('td', {}, el('code', { text: em })), el('td', {}, el('button', { class: 'btn small', type: 'button', text: 'Use', 'aria-label': `Fill in ${r} account`, onclick: () => { mode = 'login'; render(); $('#email').value = em; $('#password').value = '123456'; } })))))));
    const switcher = el('p', { class: 'center', style: 'margin:1rem 0 0' }, isLogin ? 'No account? ' : 'Already registered? ', el('a', { href: '#', text: isLogin ? 'Create one' : 'Log in', onclick: (e) => { e.preventDefault(); mode = isLogin ? 'register' : 'login'; render(); } }));
    root.append(el('div', { class: 'auth' }, el('div', { class: 'card' }, el('h1', { style: 'font-size:1.5rem', text: isLogin ? 'Log in' : 'Create an account' }), form, switcher, isLogin ? demo : null)));
  }
  render();
}
