// ─────────────────────────────────────────────────────────────────────────────
//  THE MARK: two ears in a lit doorway.
//  The hole is a tiny arched door, left ajar, with the light on inside and
//  spilling over the step. Two ears stand in it, tips poking out above the
//  arch: the left one straight, the right one curled at the tip.
//  Every part overlaps its neighbour, so the whole mark is one connected
//  shape: one sticker, one print.
//  An ear is in colour ("lit") when its sister made the thing; otherwise it
//  stands in shadow.
// ─────────────────────────────────────────────────────────────────────────────
export const VIEW = '0 0 100 120';
export const EAR_L = 'M43 96C31 72 17 37 26 10c2-6 7-6 9 0 9 27 11 60 8 86Z';
export const EAR_R = 'M57 96C52 70 56 43 68 28c9-12 24-15 29-5 5 9-1 20-10 21-5 0-7-3-5-6 3-4 4-9 0-10-6-1-11 9-15 24-4 15-7 30-10 44Z';
export const FRAME = 'M19 108V68a31 31 0 0 1 62 0v40ZM24 108V68a26 26 0 0 1 52 0v40Z';   // the door frame (a ring: fill-rule evenodd)
export const FRAME_SOLID = 'M19 108V68a31 31 0 0 1 62 0v40Z';
export const LIGHT = 'M24 106V68a26 26 0 0 1 52 0v38Z';          // the lit opening
export const LEAF = 'M24 68l12-7v50l-12-5Z';                     // the door itself, ajar
export const KNOB = { cx: 32.5, cy: 88, r: 1.8 };
export const STEP = 'M14 106h72v6H14Z';                          // the threshold
export const SPILL = 'M38 112h40l14 8H26Z';                      // light on the ground outside
export const OPENING = { x: 24, y: 42, w: 52, h: 64, r: 26 };    // used by the fall to walk through the door

const on = (lit) => [lit === 'kinnera' || lit === 'both', lit === 'kaveri' || lit === 'both'];

// lit: 'kinnera' | 'kaveri' | 'both' | 'none'.  open: leave the doorway see-through (the fall shows through it).
export function markSvg({ lit = 'both', c = null, size = null, title = '', cls = 'mark', hole = true } = {}) {
  const [l, rr] = on(lit);
  const dim = size ? ` width="${size}" height="${Math.round(size * 1.2)}"` : '';
  const a11y = title ? `role="img" aria-label="${title}"` : 'aria-hidden="true" focusable="false"';
  if (c) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW}"${dim} ${a11y}>${markInner({ lit, c })}</svg>`;
  return `<svg class="${cls}" viewBox="${VIEW}"${dim} ${a11y}><path class="mark__frame" fill-rule="evenodd" d="${FRAME}"/>${hole ? `<path class="mark__light" d="${LIGHT}"/>` : ''}<path class="mark__leaf" d="${LEAF}"/><circle class="mark__knob" cx="${KNOB.cx}" cy="${KNOB.cy}" r="${KNOB.r}"/><path class="mark__ear mark__ear--l${l ? ' is-lit' : ''}" d="${EAR_L}"/><path class="mark__ear mark__ear--r${rr ? ' is-lit' : ''}" d="${EAR_R}"/><path class="mark__step" d="${STEP}"/><path class="mark__spill" d="${SPILL}"/></svg>`;
}
// c: { frame, light, leaf, knob, ember, lagoon, shade, shadeLine }
export function markInner({ lit = 'both', c, stroke = 2.6 }) {
  const [l, rr] = on(lit);
  const ear = (d, lit_, col) => `<path d="${d}" fill="${lit_ ? col : c.shade}" stroke="${lit_ ? col : c.shadeLine}" stroke-width="${stroke}" stroke-linejoin="round"/>`;
  return `<path d="${FRAME}" fill-rule="evenodd" fill="${c.frame}"/><path d="${LIGHT}" fill="${c.light}"/><path d="${LEAF}" fill="${c.leaf}"/><circle cx="${KNOB.cx}" cy="${KNOB.cy}" r="${KNOB.r}" fill="${c.knob}"/>${ear(EAR_L, l, c.ember)}${ear(EAR_R, rr, c.lagoon)}<path d="${STEP}" fill="${c.frame}"/><path d="${SPILL}" fill="${c.light}" fill-opacity=".6"/>`;
}
// The whole mark as one solid shape: for die-cut stickers and 3D printing.
export const silhouetteSvg = (fill = '#000') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW}"><g fill="${fill}" stroke="${fill}" stroke-width="2.6" stroke-linejoin="round"><path d="${FRAME_SOLID}"/><path d="${EAR_L}"/><path d="${EAR_R}"/><path d="${STEP}"/><path d="${SPILL}"/></g></svg>`;
