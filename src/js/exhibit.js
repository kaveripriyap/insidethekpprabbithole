// An exhibit: leaning in (true colour, always), the loupe, the grade toggle,
// and any optional moment the thing asked for.
const art = document.querySelector('.exhibit');
if (art) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── house grade ⇄ as shot ────────────────────────────────────────────────
  const toggle = art.querySelector('[data-truecolour]');
  toggle?.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    for (const img of art.querySelectorAll('img[data-true]')) img.srcset = on ? img.dataset.true : img.dataset.graded;
  });

  // ── lean in ──────────────────────────────────────────────────────────────
  const dlg = art.querySelector('[data-lean]'), data = art.querySelector('[data-photos]');
  if (dlg && data && dlg.showModal) {
    const photos = JSON.parse(data.textContent);
    const img = dlg.querySelector('[data-lean-img]'), cap = dlg.querySelector('[data-lean-cap]');
    const prev = dlg.querySelector('[data-lean-prev]'), next = dlg.querySelector('[data-lean-next]');
    let at = 0, opener = null;
    const show = i => {
      at = (i + photos.length) % photos.length; const p = photos[at];
      img.removeAttribute('src'); img.width = p.w; img.height = p.h; img.alt = p.alt; img.src = p.full;
      cap.textContent = p.caption || '';
      prev.hidden = next.hidden = photos.length < 2;
    };
    art.addEventListener('click', e => { const b = e.target.closest('[data-zoom]'); if (!b) return; opener = b; show(parseInt(b.dataset.zoom, 10)); dlg.showModal(); });
    prev.addEventListener('click', () => show(at - 1)); next.addEventListener('click', () => show(at + 1));
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('lean__fig')) dlg.close(); });
    dlg.addEventListener('close', () => opener?.focus());
    let sx = 0;
    dlg.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60 && photos.length > 1) show(at + (dx < 0 ? 1 : -1)); }, { passive: true });
  }

  // ── the loupe: a magnifying glass over the case, in true colour ──────────
  const glass = art.querySelector('.case__glass'), lead = glass?.querySelector('img[data-full]');
  if (glass && lead && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const loupe = document.createElement('span'); loupe.className = 'loupe'; loupe.setAttribute('aria-hidden', 'true');
    glass.appendChild(loupe);
    let ready = false;
    glass.addEventListener('pointerenter', () => { if (!ready) { ready = true; loupe.style.backgroundImage = `url("${lead.dataset.full}")`; } });
    glass.addEventListener('pointermove', e => {
      const b = lead.getBoundingClientRect(), g = glass.getBoundingClientRect();
      const x = e.clientX - b.left, y = e.clientY - b.top;
      if (x < 0 || y < 0 || x > b.width || y > b.height) { loupe.classList.remove('is-on'); return; }
      const zoom = 2.4, s = loupe.offsetWidth;
      loupe.style.left = `${e.clientX - g.left}px`; loupe.style.top = `${e.clientY - g.top}px`;
      loupe.style.backgroundSize = `${b.width * zoom}px ${b.height * zoom}px`;
      loupe.style.backgroundPosition = `${-(x * zoom - s / 2)}px ${-(y * zoom - s / 2)}px`;
      loupe.classList.add('is-on');
    });
    glass.addEventListener('pointerleave', () => loupe.classList.remove('is-on'));
  }

  // ── something small lives by the skirting board, and does not like being looked at
  const scurry = art.querySelector('[data-scurry]');
  if (scurry && !reduce) {
    const off = () => { if (scurry.classList.contains('is-off')) return; scurry.classList.add('is-off'); setTimeout(() => scurry.classList.remove('is-off'), 6000); };
    scurry.addEventListener('pointerenter', off); scurry.addEventListener('click', off);
  }

  // ── optional moments ─────────────────────────────────────────────────────
  const moments = {
    butterflies: () => import('./moments/butterflies.js'),
    lights: () => import('./moments/lights.js'),
    gears: () => import('./moments/gears.js'),
  };
  const m = art.dataset.moment;
  if (m && moments[m]) {
    const run = () => moments[m]().then(mod => mod.default(art, { reduce })).catch(() => {});
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 300);
  }

  // ── a 3D model to turn around ────────────────────────────────────────────
  const model = art.querySelector('[data-model]');
  const pick = model?.querySelector('[data-model-load]');
  pick?.addEventListener('click', async () => {
    pick.textContent = 'Fetching it…'; pick.disabled = true;
    try { const mod = await import('./moments/model.js'); await mod.default(model); pick.remove(); }
    catch { pick.textContent = 'It would not come out of the drawer. Try again?'; pick.disabled = false; }
  });

  // ── films from elsewhere load only when asked ────────────────────────────
  art.querySelector('[data-embed]')?.addEventListener('click', e => {
    const b = e.currentTarget, f = document.createElement('iframe');
    f.src = b.dataset.embed === 'youtube' ? `https://www.youtube-nocookie.com/embed/${b.dataset.embedId}?autoplay=1` : `https://player.vimeo.com/video/${b.dataset.embedId}?autoplay=1`;
    f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = 'Film';
    b.replaceWith(f);
  });
}
