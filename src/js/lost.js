// The wrong hole: a pile of things you can throw about.
const pile = document.querySelector('[data-pile]');
if (pile && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const bits = [...pile.querySelectorAll('.lost__bit')].map((el, i) => ({ el, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 0, h: 0, held: false, i }));
  let W = 0, H = 0, grabbed = null, px = 0, py = 0, lx = 0, ly = 0, lt = 0;
  const measure = () => { const b = pile.getBoundingClientRect(); W = b.width; H = b.height; for (const o of bits) { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight || o.w * 1.3; } };
  const start = () => {
    measure();
    bits.forEach((o, i) => { o.x = (W - o.w) * ((i + 0.5) / bits.length); o.y = -o.h - i * 70; o.vx = (Math.random() - 0.5) * 2; o.va = (Math.random() - 0.5) * 3; o.a = (Math.random() - 0.5) * 30; });
    requestAnimationFrame(step);
  };
  function step() {
    for (const o of bits) {
      if (o.held) continue;
      o.vy += 0.55; o.x += o.vx; o.y += o.vy; o.a += o.va;
      const floor = H - o.h - 4;
      if (o.y > floor) { o.y = floor; o.vy *= -0.42; o.vx *= 0.9; o.va *= 0.8; if (Math.abs(o.vy) < 1.2) o.vy = 0; }
      if (o.x < 0) { o.x = 0; o.vx *= -0.6; }
      if (o.x > W - o.w) { o.x = W - o.w; o.vx *= -0.6; }
    }
    for (let i = 0; i < bits.length; i++) for (let j = i + 1; j < bits.length; j++) {
      const a = bits[i], b = bits[j];
      const dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.h / 2) - (a.y + a.h / 2), min = (a.w + b.w) * 0.42, d = Math.hypot(dx, dy) || 1;
      if (d < min) { const f = (min - d) / min * 0.9, ux = dx / d, uy = dy / d; if (!a.held) { a.vx -= ux * f; a.vy -= uy * f * 0.4; } if (!b.held) { b.vx += ux * f; b.vy += uy * f * 0.4; } }
    }
    for (const o of bits) o.el.style.transform = `translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px) rotate(${o.a.toFixed(1)}deg)`;
    requestAnimationFrame(step);
  }
  pile.addEventListener('pointerdown', e => {
    const el = e.target.closest('.lost__bit'); if (!el) return;
    grabbed = bits.find(o => o.el === el); grabbed.held = true; const b = pile.getBoundingClientRect();
    px = e.clientX - b.left - grabbed.x; py = e.clientY - b.top - grabbed.y; lx = e.clientX; ly = e.clientY; lt = performance.now();
    pile.setPointerCapture(e.pointerId); e.preventDefault();
  });
  pile.addEventListener('pointermove', e => {
    if (!grabbed) return; const b = pile.getBoundingClientRect(), now = performance.now(), dt = Math.max(8, now - lt);
    grabbed.x = e.clientX - b.left - px; grabbed.y = e.clientY - b.top - py;
    grabbed.vx = (e.clientX - lx) / dt * 16; grabbed.vy = (e.clientY - ly) / dt * 16; grabbed.va = grabbed.vx * 0.4;
    lx = e.clientX; ly = e.clientY; lt = now;
  });
  const let_go = () => { if (grabbed) { grabbed.held = false; grabbed = null; } };
  pile.addEventListener('pointerup', let_go); pile.addEventListener('pointercancel', let_go);
  addEventListener('resize', measure);
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
}
