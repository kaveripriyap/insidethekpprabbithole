// THE FALL. Scrolling moves a camera down a shaft. Things, years, asides and
// small engraved creatures sit at different depths and rise past you.
// With reduced motion (or no script) none of this runs and the page is a calm,
// still list instead.
import { lockLit } from './site.js';
import { startTunnel } from './tunnel.js';

const html = document.documentElement;
const root = document.querySelector('[data-fall]');
const still = matchMedia('(prefers-reduced-motion: reduce)');

if (root && !still.matches) live();
still.addEventListener?.('change', () => location.reload());

// in the still version the gauge simply appears once you leave the surface
if (root && still.matches) {
  const well = root.querySelector('.well');
  const on = () => { const top = well.getBoundingClientRect().top; html.classList.toggle('past-surface', top < innerHeight * 0.5); html.classList.toggle('in-deep', top < 30); html.classList.toggle('at-bottom', root.querySelector('.bottom').getBoundingClientRect().top < innerHeight * 0.7); };
  addEventListener('scroll', on, { passive: true }); on();
}

function live() {
  html.classList.add('fall-live');
  const shaft = root.querySelector('.fall__shaft'), stage = root.querySelector('.fall__stage');
  const surface = root.querySelector('.surface'), rim = root.querySelector('.rim'), rimMark = rim.querySelector('.mark');
  const well = root.querySelector('.well'), things = root.querySelector('.well__things');
  const bottomEl = root.querySelector('.bottom');
  const gauge = root.querySelector('.gauge'), gaugeLinks = [...gauge.querySelectorAll('a[data-year]')];
  const els = [...things.children];
  const P = 1000;                    // perspective, in px (matches the CSS)
  const FAR = 3400, PASS = 460;      // how far ahead things appear, and how far behind they vanish
  let vw = 0, vh = 0, intro = 0, depth = 0, K = 1, rimH = 0, door = { t: 0, l: 0, r: 0, b: 0, q: 0 };
  let nodes = [], strata = [];

  const rand = seed => { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s ^= s >>> 16) >>> 0) / 4294967296); };

  function layout() {
    vw = stage.clientWidth; vh = stage.clientHeight;
    const small = vw < 860;
    intro = vh * 1.15;
    K = small ? 0.9 : 1;             // px of scroll per unit of depth
    let z = 1500, side = 1;
    nodes = []; strata = [];
    const crit = [];
    for (const el of els) {
      if (el.classList.contains('critter')) { crit.push(el); continue; }
      const n = { el, x: 0, y: 0, z: 0, rot: 0, kind: 'drop', year: el.dataset.year, on: false };
      if (el.classList.contains('stratum')) {
        z += strata.length ? 500 : 0; n.kind = 'stratum'; n.z = z; z += 900; strata.push(n);
      } else if (el.classList.contains('aside')) {
        n.kind = 'aside'; n.z = z - 350; n.y = -vh * 0.04;
      } else {
        const rnd = rand(parseInt(el.dataset.seed, 10) + 7);
        const giant = el.classList.contains('drop--giant'), tiny = el.classList.contains('drop--tiny');
        const reach = small ? (tiny ? 0.2 : 0.07) : giant ? 0.14 : tiny ? 0.3 : 0.2;
        n.x = side * vw * (reach + rnd() * 0.05); n.y = (rnd() - 0.5) * vh * (small ? 0.12 : 0.2) - vh * 0.02;
        n.rot = (rnd() - 0.5) * 26; n.z = z; n.lit = el.querySelector('a')?.dataset.lit;
        n.img = el.querySelector('img'); side = -side;
        z += (giant ? 1250 : tiny ? 620 : 950) * (small ? 0.92 : 1);
      }
      nodes.push(n);
    }
    depth = z + 300;
    crit.forEach((el, i) => {
      const rnd = rand(i * 977 + 13), ang = rnd() * Math.PI * 2, rad = (0.3 + rnd() * 0.22);
      const scale = [0.5, 3.4, 1, 0.7, 5, 1.6][i % 6];
      nodes.push({ el, kind: 'critter', x: Math.cos(ang) * vw * rad, y: Math.sin(ang) * vh * rad, z: 2200 + (depth - 3000) * ((i + rnd() * 0.6) / crit.length), rot: rnd() * 360, spin: (rnd() - 0.5) * 50, scale, on: false });
    });
    shaft.style.height = `${Math.round(intro + depth * K + vh * 0.2)}px`;
    // the way in is a very small door at the foot of the first screen
    rimH = vw < 600 ? Math.max(92, Math.min(vh * 0.17, 150)) : small ? Math.max(120, Math.min(vh * 0.22, 230)) : Math.max(120, Math.min(vh * 0.25, 230));   // the same numbers as --rim in fall.css
    rimMark.style.height = `${rimH}px`;
    const unit = rimH / 120, ground = small ? vh - 86 : vh * 0.93;      // on small screens the door stands just above the thumb bar
    const left = vw / 2 - 50 * unit, top = ground - 106 * unit;
    rim.style.left = `${left}px`; rim.style.top = `${top}px`;
    door = { t: top + 42 * unit, l: left + 24 * unit, r: vw - (left + 76 * unit), b: vh - ground, q: 26 * unit };
  }

  // images far down the shaft wait until you are close
  function park(n) { const i = n.img; if (!i || i.dataset.parked || i.complete) return; i.dataset.parked = '1'; i.dataset.ss = i.getAttribute('srcset') || ''; i.dataset.s = i.getAttribute('src') || ''; i.removeAttribute('srcset'); i.removeAttribute('src'); }
  function wake(n) { const i = n.img; if (!i || !i.dataset.parked) return; i.setAttribute('srcset', i.dataset.ss); i.setAttribute('src', i.dataset.s); i.loading = 'eager'; delete i.dataset.parked; }

  let tunnel = null;
  // The walls are only seen once you are through the door, so they are not drawn until you first move
  // (or the page has sat idle for a while). The first screen stays light to load.
  let booted = false;
  const boot = () => { if (booted) return; booted = true; tunnel = startTunnel(root.querySelector('.well__gl')); request(); };
  for (const ev of ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown']) addEventListener(ev, boot, { once: true, passive: true });
  setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(boot, { timeout: 2000 }) : boot()), 6000);
  let target = 0, cur = 0, vel = 0, px = 0, py = 0, tpx = 0, tpy = 0, last = performance.now(), front = null, raf = 0, hereYear = null;
  const shaftTop = () => shaft.getBoundingClientRect().top + scrollY;
  const camAt = y => Math.max(0, (y - shaftTop() - intro) / K);
  const scrollFor = cam => shaftTop() + intro + cam * K;

  function frame(now) {
    raf = 0;
    const dt = Math.min(50, now - last); last = now;
    target = scrollY - shaftTop();
    const prev = cur;
    cur += (target - cur) * Math.min(1, dt / 90);
    if (Math.abs(target - cur) < 0.2) cur = target;
    vel += ((cur - prev) / Math.max(1, dt) - vel) * 0.2;
    px += (tpx - px) * 0.08; py += (tpy - py) * 0.08;

    const t = Math.max(0, Math.min(1, cur / intro)), cam = Math.max(0, (cur - intro) / K);
    // you walk up to the door, the ears duck out of sight, and it swallows the screen
    const e = t < 0.12 ? 0 : ((t - 0.12) / 0.88) ** 2.2, k = 1 - e;
    const ws = well.style;
    ws.setProperty('--dt', `${(door.t * k).toFixed(1)}px`); ws.setProperty('--dl', `${(door.l * k).toFixed(1)}px`);
    ws.setProperty('--dr', `${(door.r * k).toFixed(1)}px`); ws.setProperty('--db', `${(door.b * k).toFixed(1)}px`);
    ws.setProperty('--dq', `${(door.q * k * k).toFixed(1)}px`);
    ws.setProperty('--glow', Math.max(0, Math.min(1, 1 - (t - 0.4) / 0.5)).toFixed(3));
    for (const c of surface.children) if (!c.classList.contains('motes')) { c.style.opacity = Math.max(0, 1 - t * 2.2).toFixed(3); c.style.transform = `translateY(${(-t * vh * 0.12).toFixed(1)}px)`; }
    surface.style.visibility = t > 0.97 ? 'hidden' : 'visible';
    rim.style.opacity = Math.max(0, 1 - Math.max(0, t - 0.1) * 6).toFixed(3);
    rim.style.setProperty('--duck', `${(Math.min(1, t * 9) * rimH * 0.62).toFixed(1)}px`);
    html.classList.toggle('in-deep', e > 0.9);
    html.classList.toggle('past-surface', t > 0.75);
    html.classList.toggle('at-bottom', bottomEl.getBoundingClientRect().top < vh * 0.7);

    things.style.perspectiveOrigin = `${(50 + px * 5).toFixed(2)}% ${(50 + py * 5).toFixed(2)}%`;
    let best = null, bestD = 1e9;
    for (const n of nodes) {
      const d = n.z - cam;
      if (n.img) { if (d > FAR + 1200) park(n); else wake(n); }
      const on = d < FAR && d > -PASS && t > 0.25;
      if (on !== n.on) { n.on = on; n.el.classList.toggle('is-near', on); }
      if (!on) continue;
      let o = Math.min(1, (FAR - d) / 1500);
      if (d < -90) o *= Math.max(0, (d + PASS) / (PASS - 90));
      let tr;
      if (n.kind === 'critter') {
        tr = `translate(-50%,-50%) translate3d(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px,${(-d).toFixed(1)}px) rotate(${(n.rot + now * 0.001 * n.spin).toFixed(1)}deg) scale(${n.scale})`;
      } else if (n.kind === 'stratum') {
        o = Math.min(0.9, (FAR - d) / 1700) * Math.min(1, Math.max(0, (d + 420) / 700));
        tr = `translate(-50%,-50%) translate3d(0,0,${(-d).toFixed(1)}px)`;
      } else {
        const tumble = n.rot * Math.max(-0.5, Math.min(1.3, (d - 120) / 1700));
        tr = `translate(-50%,-50%) translate3d(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px,${(-d).toFixed(1)}px) rotate(${tumble.toFixed(2)}deg)`;
        if (n.kind === 'drop') { const off = Math.abs(d - 140); if (off < bestD && off < 420) { bestD = off; best = n; } }
      }
      n.el.style.transform = tr;
      n.el.style.opacity = o.toFixed(3);
      n.el.style.zIndex = String(10000 - Math.round(d));
    }
    if (best !== front) { front?.el.classList.remove('is-front'); best?.el.classList.add('is-front'); front = best; lockLit(best ? best.lit : null); }

    // which year are we in?
    let yi = -1;
    for (let i = 0; i < strata.length; i++) if (cam > strata[i].z - 1500) yi = i;
    const year = yi >= 0 ? strata[yi].year : null;
    if (year !== hereYear) { hereYear = year; for (const a of gaugeLinks) a.classList.toggle('is-here', a.dataset.year === year); }
    let colour = 0;
    if (yi >= 0) { const here = strata[yi], next = strata[yi + 1], span = Math.max(1, (next ? next.z : depth) - here.z); colour = yi + Math.max(0, Math.min(1, (cam - here.z + 1500) / span)); }
    tunnel?.draw({ time: now / 1000, depth: cam / P, vel: Math.min(1, Math.abs(vel) / 4), px, py, colour, open: t });

    if (Math.abs(target - cur) > 0.2 || Math.abs(tpx - px) > 0.002 || Math.abs(tpy - py) > 0.002 || (inView && t > 0.02)) request();
  }
  let inView = true;
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) request(); }).observe(stage);

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { layout(); tunnel?.resize(); request(); });
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tpx = e.clientX / vw - 0.5; tpy = e.clientY / vh - 0.5; request(); } }, { passive: true });
  addEventListener('deviceorientation', e => { if (e.gamma === null) return; tpx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); tpy = Math.max(-0.5, Math.min(0.5, (e.beta - 40) / 80)); }, { passive: true });

  // ways to move without scrolling by hand
  const go = (y, smooth = true) => scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
  const yearTop = y => { const s = strata.find(n => n.year === String(y)); return s ? scrollFor(s.z - 2300) : null; };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (a.matches('[data-fall-in]')) { e.preventDefault(); go(scrollFor(Math.max(0, nodes.find(n => n.kind === 'drop').z - 900))); return; }
    if (id.startsWith('y-')) { const y = yearTop(id.slice(2)); if (y !== null) { e.preventDefault(); go(y); history.replaceState(null, '', '#' + id); } }
    else if (id === 'main' || a.matches('[data-climb]')) { e.preventDefault(); go(0); history.replaceState(null, '', location.pathname); }
  });
  // tabbing through the things brings each one up to you
  things.addEventListener('focusin', e => {
    const li = e.target.closest('li'); const n = nodes.find(x => x.el === li);
    if (n && n.kind !== 'critter') go(scrollFor(n.z - 160), false);
  });

  layout();
  if (location.hash.startsWith('#y-')) { const y = yearTop(location.hash.slice(3)); if (y !== null) requestAnimationFrame(() => go(y, false)); }
  cur = scrollY - shaftTop();
  request();
  document.fonts?.ready.then(() => { layout(); request(); });
}
