// Draws every brand file from design/tokens.yaml: the mark, the lockup,
// favicons, the social card and the Etsy images. Text is converted to outlines
// so the files look the same on any computer.
import fs from 'node:fs';
import path from 'node:path';
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import { r, write } from './util.mjs';
import { markInner, markSvg, silhouetteSvg } from './mark.mjs';

let fonts = null;
function loadFonts() {
  if (fonts) return fonts;
  const dir = r('node_modules', '@fontsource-variable', 'fraunces', 'files');
  fonts = {
    roman: fontkit.openSync(path.join(dir, 'fraunces-latin-full-normal.woff2')),
    italic: fontkit.openSync(path.join(dir, 'fraunces-latin-full-italic.woff2')),
  };
  return fonts;
}

// text → SVG path. style: { size, wght, opsz, soft, wonk, italic, fill, track }
export function textPath(text, x, y, s) {
  const f = loadFonts();
  const base = s.italic ? f.italic : f.roman;
  const font = base.getVariation({ wght: s.wght ?? 600, opsz: s.opsz ?? 144, SOFT: s.soft ?? 0, WONK: s.wonk ?? 1 });
  const run = font.layout(text);
  const k = s.size / font.unitsPerEm;
  let pen = 0, d = '';
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const p = g.path.scale(k, -k).translate(x + (pen + pos.xOffset) * k, y - pos.yOffset * k);
    d += p.toSVG();
    pen += pos.xAdvance + (s.track || 0) * font.unitsPerEm;
  });
  return { svg: `<path d="${d}" fill="${s.fill}"/>`, width: pen * k };
}
const measure = (text, s) => textPath(text, 0, 0, s).width;

// A row of differently styled words, laid out left to right.
function line(parts, x, y) {
  let out = '', cx = x;
  for (const [text, s] of parts) { const t = textPath(text, cx, y, s); out += t.svg; cx += t.width + (s.gap ?? s.size * 0.24); }
  return { svg: out, width: cx - x - (parts.length ? (parts[parts.length - 1][1].gap ?? parts[parts.length - 1][1].size * 0.24) : 0) };
}

const svgDoc = (w, h, body, bg = null) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}${body}</svg>`;
const placeMark = (x, y, h, lit, c) => `<g transform="translate(${x} ${y}) scale(${h / 120})">${markInner({ lit, c })}</g>`;

export async function buildBrand({ tokens, site, dist }) {
  const C = Object.fromEntries(Object.entries(tokens.colour).map(([k, v]) => [k, v.value]));
  const LIGHT = '#FFE7AE';
  const onPage = { ink: C.ink, frame: C.ink, light: LIGHT, leaf: C.velvet, knob: C.gilt, shade: C.velvet, shadeLine: C.ink, ember: C.ember, lagoon: C.lagoon };
  const onDeep = { ink: C.page, frame: C.gilt, light: LIGHT, leaf: C.velvet, knob: C.gilt, shade: C.velvet, shadeLine: C.gilt, ember: C.ember, lagoon: C.lagoon };
  const out = path.join(dist, 'brand', 'files');
  fs.mkdirSync(out, { recursive: true });
  const files = [];
  const png = async (svg, file, w, h) => { await sharp(Buffer.from(svg), { density: 96 }).resize(w, h).png({ compressionLevel: 9 }).toFile(file); };
  const add = (name, file, note, w, h, extra = {}) => files.push({ name, url: `/brand/files/${file}`, note, w, h, ...extra });

  // the mark, every state, on paper and in the deep
  for (const lit of ['both', 'kinnera', 'kaveri', 'none']) {
    write(path.join(out, `mark-${lit}.svg`), markSvg({ lit, c: onPage }));
    write(path.join(out, `mark-${lit}-on-dark.svg`), markSvg({ lit, c: onDeep }));
  }
  add('The mark', 'mark-both.svg', 'SVG, for paper and light backgrounds', 100, 120);
  add('The mark, for dark', 'mark-both-on-dark.svg', 'SVG, for dark backgrounds', 100, 120, { dark: true });
  add('Kinnera made it', 'mark-kinnera.svg', 'SVG credit mark', 100, 120);
  add('Kaveri made it', 'mark-kaveri.svg', 'SVG credit mark', 100, 120);
  add('Unlit', 'mark-none.svg', 'SVG, both ears in shadow', 100, 120);
  write(path.join(out, 'mark-silhouette.svg'), silhouetteSvg(C.ink));
  add('One-piece outline', 'mark-silhouette.svg', 'SVG: the whole mark as one solid shape, for die-cut stickers and 3D printing', 100, 120);
  await png(svgDoc(1024, 1024, placeMark(182, 112, 800, 'both', onPage)), path.join(out, 'mark-1024.png'), 1024, 1024);
  add('The mark, PNG', 'mark-1024.png', '1024 × 1024, transparent', 1024, 1024);

  // the lockup: mark + name
  const name = c => [['the', { size: 64, wght: 300, italic: true, soft: 100, fill: c.ink, gap: 18 }], ['KPP', { size: 64, wght: 800, fill: c.ink, gap: 18 }], ['rabbit hole', { size: 64, wght: 800, fill: c.ink }]];
  const nameW = line(name(onPage), 0, 0).width;
  const lockup = c => svgDoc(Math.ceil(nameW + 150), 132, placeMark(10, 6, 120, 'both', c) + line(name(c), 124, 96).svg);
  write(path.join(out, 'lockup.svg'), lockup(onPage));
  write(path.join(out, 'lockup-on-dark.svg'), lockup(onDeep));
  add('Name and mark', 'lockup.svg', 'SVG lockup, outlined text', Math.ceil(nameW + 150), 132);
  add('Name and mark, for dark', 'lockup-on-dark.svg', 'SVG lockup', Math.ceil(nameW + 150), 132, { dark: true });

  // favicons
  const fav = svgDoc(64, 64, `<rect width="64" height="64" rx="12" fill="${C.page}"/>${placeMark(8.5, 4, 56, 'both', onPage)}`);
  write(path.join(dist, 'favicon.svg'), fav);
  await png(fav, path.join(dist, 'favicon-32.png'), 32, 32);
  await png(svgDoc(180, 180, `<rect width="180" height="180" fill="${C.page}"/>${placeMark(32, 18, 140, 'both', onPage)}`), path.join(dist, 'apple-touch-icon.png'), 180, 180);

  // Etsy shop icon, 500 × 500
  await png(svgDoc(500, 500, placeMark(92, 56, 380, 'both', onPage), C.page), path.join(out, 'etsy-shop-icon-500.png'), 500, 500);
  add('Etsy shop icon', 'etsy-shop-icon-500.png', '500 × 500 PNG', 500, 500);

  // a quiet dream gradient for the deep images
  const glow = (w, h) => `<defs><radialGradient id="g" cx="78%" cy="42%" r="70%"><stop offset="0" stop-color="${tokens.dream.sea}" stop-opacity=".55"/><stop offset=".55" stop-color="${C.velvet}" stop-opacity=".5"/><stop offset="1" stop-color="${C.burrow}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="${C.burrow}"/><rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const rings = (cx, cy, n, r0, step) => Array.from({ length: n }, (_, i) => `<circle cx="${cx}" cy="${cy}" r="${r0 + i * step}" fill="none" stroke="${C.gilt}" stroke-opacity="${(0.34 - i * 0.03).toFixed(2)}" stroke-width="1.5"/>`).join('');

  // Etsy big banner, 3360 × 840 (keep the important part in the middle: Etsy crops the sides on phones)
  {
    const W = 3360, H = 840;
    const tag = { size: 250, wght: 300, italic: true, soft: 100, fill: C.page };
    const tw = measure(site.tagline, tag);
    const nm = [['the', { size: 84, wght: 300, italic: true, soft: 100, fill: C.gilt, gap: 22 }], ['KPP', { size: 84, wght: 800, fill: C.gilt, gap: 22 }], ['rabbit hole', { size: 84, wght: 800, fill: C.gilt }]];
    const nw = line(nm, 0, 0).width;
    const total = 420 + 90 + Math.max(tw, nw), x0 = (W - total) / 2;
    const body = glow(W, H) + rings(x0 + 210, 560, 9, 60, 90) + placeMark(x0, 150, 504, 'both', onDeep) + line(nm, x0 + 510, 330).svg + textPath(site.tagline, x0 + 500, 590, tag).svg;
    await png(svgDoc(W, H, body), path.join(out, 'etsy-banner-3360x840.png'), W, H);
    await sharp(path.join(out, 'etsy-banner-3360x840.png')).resize(1200).webp({ quality: 80 }).toFile(path.join(out, 'etsy-banner-preview.webp'));
    add('Etsy big banner', 'etsy-banner-3360x840.png', '3360 × 840 PNG', 1200, 300, { preview: '/brand/files/etsy-banner-preview.webp', dark: true });
  }
  // Etsy mini banner, 1200 × 160
  {
    const W = 1200, H = 160;
    const nm = [['the', { size: 46, wght: 300, italic: true, soft: 100, fill: C.ink, gap: 12 }], ['KPP', { size: 46, wght: 800, fill: C.ink, gap: 12 }], ['rabbit hole', { size: 46, wght: 800, fill: C.ink, gap: 34 }], [site.tagline, { size: 46, wght: 300, italic: true, soft: 100, fill: C.brass }]];
    const nw = line(nm, 0, 0).width, x0 = (W - nw - 110) / 2;
    await png(svgDoc(W, H, placeMark(x0, 20, 120, 'both', onPage) + line(nm, x0 + 112, 98).svg, C.page), path.join(out, 'etsy-mini-banner-1200x160.png'), W, H);
    add('Etsy mini banner', 'etsy-mini-banner-1200x160.png', '1200 × 160 PNG', 1200, 160);
  }
  // social card, 1200 × 630
  {
    const W = 1200, H = 630;
    const words = site.line.split(' '), half = Math.ceil(words.length / 2);
    const st = { size: 86, wght: 800, fill: C.page };
    const body = glow(W, H) + rings(930, 470, 7, 30, 46) + placeMark(800, 110, 372, 'both', onDeep)
      + textPath(words.slice(0, half).join(' '), 80, 270, st).svg + textPath(words.slice(half).join(' '), 80, 366, st).svg
      + line([['the', { size: 38, wght: 300, italic: true, soft: 100, fill: C.gilt, gap: 10 }], ['KPP', { size: 38, wght: 800, fill: C.gilt, gap: 10 }], ['rabbit hole', { size: 38, wght: 800, fill: C.gilt }]], 82, 500).svg;
    await sharp(Buffer.from(svgDoc(W, H, body))).jpeg({ quality: 86 }).toFile(path.join(dist, 'social.jpg'));
    fs.copyFileSync(path.join(dist, 'social.jpg'), path.join(out, 'social-card-1200x630.jpg'));
    add('Social card', 'social-card-1200x630.jpg', '1200 × 630 JPG, for link previews', 1200, 630, { dark: true });
  }
  return files;
}
