// Butterflies. Drawn in ink, never part of the photograph: they rest on the
// frame of the case and lift off into the page when you come near or scroll.
export default function butterflies(art, { reduce }) {
  const glass = art.querySelector('.case__glass');
  if (!glass) return;
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '30' });
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const css = getComputedStyle(art), accent = css.getPropertyValue('--accent').trim() || '#C8A24B', ink = getComputedStyle(document.body).getPropertyValue('--c-ink').trim() || '#17120F';
  let W = 0, H = 0, dpr = 1, mx = -999, my = -999, lastY = scrollY, stir = 0, raf = 0, seen = true;
  const N = innerWidth < 700 ? 7 : 11;
  const flies = Array.from({ length: N }, (_, i) => ({ u: (i + 0.5) / N, edge: i % 3, x: 0, y: 0, vx: 0, vy: 0, a: 0, flap: Math.random() * 6, air: 0, size: 9 + (i * 37 % 9), wait: 0 }));
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const perch = f => {     // a point on the frame of the case, in viewport coordinates
    const b = glass.getBoundingClientRect();
    if (f.edge === 0) return [b.left + b.width * f.u, b.top];
    if (f.edge === 1) return [b.right, b.top + b.height * f.u];
    return [b.left, b.top + b.height * (1 - f.u)];
  };
  function draw(f, t) {
    const open = f.air > 0.05 ? Math.abs(Math.sin(f.flap)) : 0.55 + 0.4 * Math.sin(t * 0.0012 + f.u * 20);
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.lineWidth = 1; ctx.strokeStyle = ink; ctx.fillStyle = accent;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * Math.max(0.12, open), 1);
      const s = f.size;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.1); ctx.bezierCurveTo(s * 0.5, -s * 1.1, s * 1.5, -s * 0.9, s * 1.2, -s * 0.1); ctx.bezierCurveTo(s * 1.1, s * 0.25, s * 0.4, s * 0.25, 0, s * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, s * 0.05); ctx.bezierCurveTo(s * 0.5, s * 0.15, s * 0.95, s * 0.6, s * 0.6, s * 0.95); ctx.bezierCurveTo(s * 0.35, s * 1.1, s * 0.1, s * 0.6, 0, s * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(0, -f.size * 0.3); ctx.lineTo(0, f.size * 0.5); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }
  function step(t) {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    stir *= 0.94;
    let moving = stir > 0.02;
    for (const f of flies) {
      const [hx, hy] = perch(f);
      const near = Math.hypot(mx - (f.air ? f.x : hx), my - (f.air ? f.y : hy)) < 90;
      if (!f.air) {
        f.x = hx; f.y = hy; f.a = f.edge === 0 ? 0 : f.edge === 1 ? 1.2 : -1.2;
        if ((near || stir > 0.5 + f.u * 0.8) && !reduce) { f.air = 1; f.vx = (Math.random() - 0.5) * 3; f.vy = -2 - Math.random() * 2; f.wait = 150 + Math.random() * 260; }
      } else {
        moving = true;
        f.flap += 0.45; f.wait--;
        const homing = f.wait < 0;
        const tx = homing ? hx : f.x + Math.sin(t * 0.002 + f.u * 30) * 40, ty = homing ? hy : f.y - 30;
        f.vx += (tx - f.x) * (homing ? 0.004 : 0.0012) + (Math.random() - 0.5) * 0.5; f.vy += (ty - f.y) * (homing ? 0.004 : 0.0012) + (Math.random() - 0.5) * 0.5;
        if (near) { f.vx += (f.x - mx) * 0.02; f.vy += (f.y - my) * 0.02; f.wait = Math.max(f.wait, 80); }
        f.vx *= 0.94; f.vy *= 0.94; f.x += f.vx; f.y += f.vy - (scrollY - lastY) * 0.35;
        f.a = Math.atan2(f.vy, f.vx) * 0.25 + Math.sin(f.flap * 0.5) * 0.15;
        if (homing && Math.hypot(hx - f.x, hy - f.y) < 7) f.air = 0;
        if (f.y < -60 || f.y > H + 60 || f.x < -60 || f.x > W + 60) { f.wait = -1; f.x = Math.max(-50, Math.min(W + 50, f.x)); f.y = Math.max(-50, Math.min(H + 50, f.y)); }
      }
      draw(f, t);
    }
    lastY = scrollY;
    if ((moving || !reduce) && seen) raf = requestAnimationFrame(step);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
  size();
  addEventListener('resize', () => { size(); kick(); });
  addEventListener('scroll', () => { stir = Math.min(2, stir + Math.abs(scrollY - lastY) * 0.02); kick(); }, { passive: true });
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; kick(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { seen = !document.hidden; if (seen) kick(); });
  kick();
}
