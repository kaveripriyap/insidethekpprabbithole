// The Cabinet's finder: search, filters, order and view, all kept in the
// address bar so any view can be shared as a link. No server involved.
import { surprise } from './site.js';

const form = document.querySelector('[data-finder]');
const list = document.querySelector('[data-drawers]');
if (form && list) {
  const q = form.querySelector('#q');
  const chips = [...form.querySelectorAll('.chip[data-facet]')];
  const count = form.querySelector('.finder__count');
  const sort = form.querySelector('#sort');
  const views = [...form.querySelectorAll('[data-view]')];
  const clears = [...document.querySelectorAll('[data-clear]')];
  const none = document.querySelector('[data-none]');
  const more = document.querySelector('[data-more]');
  const FACETS = ['kind', 'with', 'tag', 'by', 'year', 'sale'];
  const PAGE = 36;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* fine */ } } };

  const items = [...list.children].map((el, i) => ({
    el, i, slug: el.dataset.slug, title: el.dataset.title, date: el.dataset.date,
    words: el.dataset.search.split(/\s+/).filter(Boolean), text: el.dataset.search,
    kind: split(el.dataset.kind), with: split(el.dataset.with), tag: split(el.dataset.tag), by: [el.dataset.by], year: [el.dataset.year], sale: el.dataset.sale === '1' ? ['1'] : [],
  }));
  function split(s) { return s ? s.split(' ').filter(Boolean) : []; }

  const state = { q: '', sort: 'new', view: 'drawers', limit: PAGE };
  for (const f of FACETS) state[f] = new Set();

  // read the address bar
  const params = new URLSearchParams(location.search);
  state.q = (params.get('q') || '').trim();
  for (const f of FACETS) for (const v of (params.get(f) || '').split(',').filter(Boolean)) state[f].add(v);
  if (['new', 'old', 'az'].includes(params.get('sort'))) state.sort = params.get('sort');
  state.view = ['drawers', 'ledger'].includes(params.get('view')) ? params.get('view') : (store.get('kpp-view') === 'ledger' ? 'ledger' : 'drawers');
  q.value = state.q; sort.value = state.sort;

  // chips become toggles
  for (const c of chips) { c.setAttribute('role', 'button'); c.setAttribute('aria-pressed', 'false'); }
  form.addEventListener('click', e => {
    const c = e.target.closest('.chip[data-facet]');
    if (!c || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const set = state[c.dataset.facet];
    set.has(c.dataset.value) ? set.delete(c.dataset.value) : set.add(c.dataset.value);
    state.limit = PAGE; apply();
  });
  form.addEventListener('keydown', e => { if (e.key === ' ' && e.target.matches('.chip[data-facet]')) { e.preventDefault(); e.target.click(); } });
  form.addEventListener('submit', e => { e.preventDefault(); q.blur(); });
  let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = q.value.trim(); state.limit = PAGE; apply(); }, 90); });
  sort.addEventListener('change', () => { state.sort = sort.value; apply(); });
  for (const b of views) b.addEventListener('click', () => { state.view = b.dataset.view; store.set('kpp-view', state.view); apply(); });
  for (const b of clears) b.addEventListener('click', () => { state.q = ''; q.value = ''; for (const f of FACETS) state[f].clear(); state.limit = PAGE; apply(); q.focus(); });
  more?.addEventListener('click', () => { state.limit += PAGE; apply(true); });
  form.querySelector('[data-surprise-here]')?.addEventListener('click', e => { e.preventDefault(); surprise(matches().map(m => m.slug)); });
  if ('IntersectionObserver' in window && more) new IntersectionObserver(es => { if (es[0].isIntersecting && !more.hidden) { state.limit += PAGE; apply(true); } }, { rootMargin: '600px' }).observe(more);

  // filter groups fold: on a phone they all start folded away, on a wide screen only "Also" does
  const groups = [...form.querySelectorAll('.facet')];
  const wide = matchMedia('(min-width: 860px)');
  const always = g => wide.matches && !g.classList.contains('facet--more');
  const syncGroups = () => { for (const g of groups) g.querySelector('.facet__name').setAttribute('aria-expanded', String(always(g) || g.classList.contains('is-open'))); };
  for (const g of groups) {
    if (state[g.dataset.facet]?.size) g.classList.add('is-open');
    g.querySelector('.facet__name').addEventListener('click', () => { if (always(g)) return; g.classList.toggle('is-open'); syncGroups(); });
  }
  syncGroups(); wide.addEventListener?.('change', syncGroups);
  if (location.hash === '#find') q.focus({ preventScroll: false });

  const near = (a, b) => {       // one slip of the finger is forgiven
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, miss = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++miss > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return miss + (a.length - i) + (b.length - j) <= 1;
  };
  function hit(it, tokens) {
    return tokens.every(tk => it.text.includes(tk) || (tk.length >= 4 && it.words.some(w => near(w.slice(0, tk.length), tk) || near(w.slice(0, tk.length + 1), tk) || near(w.slice(0, tk.length - 1), tk))));
  }
  function passes(it, skip = null) {
    for (const f of FACETS) { if (f === skip || !state[f].size) continue; if (!it[f].some(v => state[f].has(v))) return false; }
    return true;
  }
  const tokens = () => state.q.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  function matches() {
    const tk = tokens();
    const m = items.filter(it => passes(it) && hit(it, tk));
    if (state.sort === 'old') m.sort((a, b) => b.i - a.i);
    else if (state.sort === 'az') m.sort((a, b) => a.title.localeCompare(b.title));
    else m.sort((a, b) => a.i - b.i);
    return m;
  }

  function apply(keepFocus = false) {
    const m = matches(), shown = new Set(m.slice(0, state.limit));
    const frag = document.createDocumentFragment();
    for (const it of m) { it.el.hidden = !shown.has(it); frag.appendChild(it.el); }
    for (const it of items) if (!m.includes(it)) { it.el.hidden = true; frag.appendChild(it.el); }
    list.appendChild(frag);
    list.classList.toggle('is-ledger', state.view === 'ledger');
    for (const b of views) b.setAttribute('aria-pressed', String(b.dataset.view === state.view));
    const any = !!state.q || FACETS.some(f => state[f].size);
    count.textContent = m.length === 0 ? 'Nothing. Yet.' : m.length === 1 ? (any ? 'Just the 1 thing' : '1 thing') : any ? `${m.length} of ${items.length} things` : `${m.length} things`;
    none.hidden = m.length > 0; list.hidden = m.length === 0;
    if (more) more.hidden = m.length <= state.limit;
    for (const b of clears) if (b.closest('.finder')) b.hidden = !any;
    // chips: pressed state, and how many each would give you from here
    const tk = tokens();
    for (const c of chips) {
      const f = c.dataset.facet, v = c.dataset.value, on = state[f].has(v);
      c.setAttribute('aria-pressed', String(on));
      const n = items.filter(it => it[f].includes(v) && passes(it, f) && hit(it, tk)).length;
      const badge = c.querySelector('.chip__n'); if (badge) badge.textContent = n;
      c.classList.toggle('is-empty', n === 0 && !on);
    }
    for (const d of groups) {
      const s = d.querySelector('.facet__name'), n = state[d.dataset.facet]?.size || 0;
      let b = s.querySelector('b');
      if (n) { if (!b) { b = document.createElement('b'); s.appendChild(b); } b.textContent = `· ${n} chosen`; } else b?.remove();
    }
    // the address bar
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    for (const f of FACETS) if (state[f].size) p.set(f, [...state[f]].join(','));
    if (state.sort !== 'new') p.set('sort', state.sort);
    if (state.view !== 'drawers') p.set('view', state.view);
    const qs = p.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + (location.hash === '#find' ? '' : location.hash));
    if (!keepFocus) { /* nothing: focus stays where the person put it */ }
  }
  apply();
}
