// The KPP mark: two ears coming out of one hole. Left ear Kinnera, right ear Kaveri.
// Everything is drawn here once, so the site, the /brand page, the downloadable
// logo files and the social cards all share exactly the same shapes.
import fs from "node:fs";
import opentype from "opentype.js";
import { colour } from "./tokens.js";

export const GEOMETRY = {
  viewBox: "0 0 100 100",
  hole: { cx: 50, cy: 74, rx: 44, ry: 16 },
  // ears are drawn upright, then tilted from their base
  left: { d: "M31 84C26 60 20 33 26 16C30 4 45 5 47 18C49 36 50 60 50 84Z", tilt: -10, origin: "40 78" },
  right: { d: "M52 84C51 64 52 42 58 27C62 15 77 16 76 29C74 46 70 64 70 84Z", tilt: 12, origin: "61 78" },
  // the near rim of the hole, drawn over the bottom of the ears
  lip: "M6 74A44 16 0 0 0 94 74A44 6 0 0 0 6 74Z",
};

/**
 * @param {object} o
 *  bg        background colour name/hex, or null for transparent
 *  hole      hole colour
 *  left/right ear colours (null = unlit outline)
 *  outline   colour used for unlit ears
 *  title     accessible name (omit + decorative:true to hide from screen readers)
 *  cls       class on <svg>
 *  parts     true adds classes to ears so CSS can move them
 */
export function markSvg(o = {}) {
  const g = GEOMETRY;
  const c = (v, fallback) => (v === null ? null : colour(v ?? fallback));
  const hole = c(o.hole, "hole");
  const left = o.left === null ? null : c(o.left, "bubblegum");
  const right = o.right === null ? null : c(o.right, "yolk");
  const outline = c(o.outline, "tunnel");
  const bg = o.bg ? colour(o.bg) : null;
  const size = o.size ? ` width="${o.size}" height="${o.size}"` : "";
  const a11y = o.decorative ? ` aria-hidden="true" focusable="false"` : ` role="img" aria-label="${o.title || "KPP: two ears in a hole"}"`;
  const ear = (side, fill) => {
    const e = g[side];
    const paint = fill ? `fill="${fill}"` : `fill="none" stroke="${outline}" stroke-width="3"`;
    const cls = o.parts ? ` class="ear ear--${side}"` : "";
    const path = `<path d="${e.d}" ${paint} transform="rotate(${e.tilt} ${e.origin})"/>`;
    return o.parts ? `<g${cls}><g class="ear__in">${path}</g></g>` : `<g>${path}</g>`;
  };
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.viewBox}"${size}${o.cls ? ` class="${o.cls}"` : ""}${a11y}>` +
    (bg ? `<rect width="100" height="100" fill="${bg}"/>` : "") +
    `<ellipse cx="${g.hole.cx}" cy="${g.hole.cy}" rx="${g.hole.rx}" ry="${g.hole.ry}" fill="${hole}"${o.parts ? ' class="mark-hole"' : ""}/>` +
    ear("left", left) +
    ear("right", right) +
    `<path d="${g.lip}" fill="${hole}"${o.parts ? ' class="mark-lip"' : ""}/>` +
    `</svg>`
  );
}

/** Tiny "made by" badge: the ear of whoever made it lights up. */
export function madeBySvg(maker = "", cls = "made-by") {
  const m = String(maker).toLowerCase();
  const kin = m.includes("kinnera");
  const kav = m.includes("kaveri");
  const who = kin && kav ? "Kinnera and Kaveri" : kin ? "Kinnera" : kav ? "Kaveri" : maker;
  return markSvg({
    left: kin ? "bubblegum" : null,
    right: kav ? "yolk" : null,
    hole: "hole",
    outline: "tunnel",
    cls,
    title: `Made by ${who}`,
  });
}

// ── Text outlines (for logo files and social cards, where web fonts don't exist) ──
let _font;
function font() {
  if (!_font) {
    const buf = fs.readFileSync("design/fonts/gluten-800.ttf");
    _font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return _font;
}

/** Returns { d, width, height } for a line of Gluten at a given size, baseline at y. */
export function textPath(text, size, x = 0, y = size, letterSpacing = 0) {
  const f = font();
  const p = f.getPath(text, x, y, size, { kerning: true, letterSpacing });
  const width = f.getAdvanceWidth(text, size, { kerning: true, letterSpacing });
  return { d: p.toPathData(2), width, ascent: (f.ascender / f.unitsPerEm) * size, descent: (-f.descender / f.unitsPerEm) * size };
}

/** Wrap text into lines that fit a width. */
export function wrapText(text, size, maxWidth, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (textPath(test, size).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
}

const TELUGU = JSON.parse(fs.readFileSync("design/telugu-outline.json", "utf8"));
/** Telugu brand line as a path, scaled to a given height. */
export function teluguPath(height, x = 0, y = 0) {
  const s = height / TELUGU.height;
  return { d: TELUGU.d, transform: `translate(${x} ${y}) scale(${s.toFixed(5)})`, width: TELUGU.width * s, text: TELUGU.text };
}
