// Pick the mark up and turn it around.
const stage = document.querySelector('.brand__big');
const mark = stage?.querySelector('.mark--huge');
if (stage && mark && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let held = false, sx = 0, sy = 0, rx = 0, ry = 0;
  const set = () => { mark.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
  stage.addEventListener('pointerdown', e => { held = true; sx = e.clientX - ry * 2; sy = e.clientY + rx * 2; stage.classList.add('is-held'); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (held) { ry = (e.clientX - sx) / 2; rx = Math.max(-60, Math.min(60, -(e.clientY - sy) / 2)); set(); }
    else if (e.pointerType === 'mouse') { const b = stage.getBoundingClientRect(); ry = ((e.clientX - b.left) / b.width - 0.5) * 36; rx = -((e.clientY - b.top) / b.height - 0.5) * 24; set(); }
  });
  const drop = () => { if (!held) return; held = false; stage.classList.remove('is-held'); rx = 0; ry = Math.round(ry / 360) * 360; set(); };
  stage.addEventListener('pointerup', drop); stage.addEventListener('pointercancel', drop);
  stage.addEventListener('pointerleave', () => { if (!held) { rx = 0; ry = 0; set(); } });
}
