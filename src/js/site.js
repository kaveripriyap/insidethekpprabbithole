// Runs on every page: the live credit in the header, Surprise me, the "/" key,
// copy-link buttons, text size, and two small secrets.
const html = document.documentElement;
html.classList.remove('no-js');
html.classList.add('js');

// ── text size (grow / shrink), remembered ───────────────────────────────────
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
let size = parseInt(store.get('kpp-size') || '0', 10) || 0;
const applySize = () => { if (size) html.dataset.size = String(size); else delete html.dataset.size; };
applySize();
document.addEventListener('click', e => {
  const b = e.target.closest('.sizer');
  if (!b) return;
  size = Math.max(-1, Math.min(3, size + parseInt(b.dataset.size, 10)));
  store.set('kpp-size', String(size));
  applySize();
});

// ── the header mark is a credit line: it shows who made what you point at ───
const homeLit = html.dataset.lit && html.dataset.lit !== 'none' ? html.dataset.lit : 'both';
html.dataset.lit = homeLit;
let litLock = null;
export function setLit(v) { html.dataset.lit = v || litLock || homeLit; }
export function lockLit(v) { litLock = v; setLit(v); }
const litOf = t => t && t.closest ? t.closest('a[data-lit]') : null;
document.addEventListener('pointerover', e => { const a = litOf(e.target); if (a) setLit(a.dataset.lit); });
document.addEventListener('pointerout', e => { if (litOf(e.target)) setLit(null); });
document.addEventListener('focusin', e => { const a = litOf(e.target); if (a) setLit(a.dataset.lit); });
document.addEventListener('focusout', e => { if (litOf(e.target)) setLit(null); });

// ── Surprise me ─────────────────────────────────────────────────────────────
let thingsPromise = null;
export const allThings = () => (thingsPromise ||= fetch('/things.json').then(r => r.json()));
export async function surprise(fromSlugs = null) {
  const list = await allThings();
  const here = location.pathname;
  let pool = list.filter(t => t.url !== here && t.img);
  if (fromSlugs && fromSlugs.length) { const s = new Set(fromSlugs); const p = pool.filter(t => s.has(t.slug)); if (p.length) pool = p; }
  const seen = (store.get('kpp-seen') || '').split(',').filter(Boolean);
  const fresh = pool.filter(t => !seen.includes(t.slug));
  const pick = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))];
  if (!pick) return false;
  store.set('kpp-seen', [...seen, pick.slug].slice(-Math.max(1, Math.floor(list.length * 0.6))).join(','));
  location.href = pick.url;
  return true;
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-surprise]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  surprise().then(ok => { if (!ok) location.href = a.href; }).catch(() => { location.href = a.href; });
});

// ── finding things: "/" jumps to the search box ─────────────────────────────
const findBox = () => document.getElementById('q') || document.getElementById('top-q');
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
  if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); const b = findBox(); b?.focus(); b?.select?.(); }
  if (!typing && e.key.length === 1) secret(e.key.toLowerCase());
});
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-find]');
  if (a && document.getElementById('q')) { e.preventDefault(); document.getElementById('q').focus(); document.getElementById('find').scrollIntoView({ block: 'start' }); }
});
// "← The Cabinet" returns to the Cabinet exactly as you left it
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-back]');
  if (!a) return;
  try { const ref = new URL(document.referrer); if (ref.origin === location.origin && ref.pathname === '/things/' && history.length > 1) { e.preventDefault(); history.back(); } } catch { /* no referrer */ }
});

// ── copy a link ─────────────────────────────────────────────────────────────
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const url = b.dataset.copyUrl ? new URL(new URL(b.dataset.copyUrl).pathname, location.origin).href : location.href;
  const old = b.dataset.label || (b.dataset.label = b.textContent);
  try { await navigator.clipboard.writeText(url); b.textContent = 'Copied. Go on, send it.'; }
  catch { b.textContent = url; }
  b.classList.add('is-done');
  setTimeout(() => { b.textContent = old; b.classList.remove('is-done'); }, 2600);
});

// ── two small secrets ───────────────────────────────────────────────────────
let typed = '';
function secret(ch) {
  typed = (typed + ch).slice(-12);
  if (typed.endsWith('kpp')) { html.classList.add('is-perky'); setTimeout(() => html.classList.remove('is-perky'), 1600); }
  if (typed.endsWith('curiouser')) {
    const steps = [1, 2, 3, 2, 1, 0, -1, 0];
    steps.forEach((s, i) => setTimeout(() => { if (s) html.dataset.size = String(s); else delete html.dataset.size; if (i === steps.length - 1) applySize(); }, i * 260));
  }
}
if (window.console) console.log('%c!?%c  You found the back of the wallpaper. Try typing "kpp" or "curiouser" on any page.', 'font:900 28px Georgia;color:#FF5533', 'font:14px Georgia');
