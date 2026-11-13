// ─────────────────────────────────────────────────────────────────────────────
//  THE PHOTO PIPELINE
//  photos/ holds the originals and is never written to. Every build reads
//  them and produces, in generated/photos/ (a cache, safe to delete):
//    · true-colour copies   (only resized, auto-rotated, letterbox bars trimmed)
//    · graded copies        (the one house look, from design/tokens.yaml › grade)
//    · a monochrome copy    (for decorative duotone washes, never used alone)
//    · facts about the photo (size, accent colour, focal point, quality notes)
//  The grade only moves tone and white balance of the whole frame. It never
//  retouches, removes, adds or reshapes anything in the picture.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { r, slugify } from './util.mjs';
import { hexToRgb, rgbToOklch, oklchToHex } from './colour.mjs';

const VERSION = 8;                       // bump to force every photo to be re-made
const GRADED_WIDTHS = [400, 800, 1280, 1920];
const TRUE_WIDTHS = [800, 1920];
const MAX_EDGE = 2400;
const EXT = /\.(jpe?g|png|webp|gif|avif|tiff?)$/i;

sharp.cache(false);
sharp.concurrency(2);

export async function buildPhotos({ grade, log = console.log }) {
  const srcDir = r('photos'), outDir = r('generated', 'photos');
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter(f => EXT.test(f)).sort() : [];
  const unsupported = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter(f => !EXT.test(f) && !f.startsWith('.') && !/\.(stl|glb|mp4|webm|md)$/i.test(f)) : [];
  const manifest = {};
  const gradeKey = JSON.stringify(grade);
  let made = 0;
  const queue = files.slice();
  const ids = new Set();
  async function worker() {
    for (;;) {
      const file = queue.shift();
      if (!file) return;
      const buf = fs.readFileSync(path.join(srcDir, file));
      const hash = crypto.createHash('sha1').update(buf).update(gradeKey).update(String(VERSION)).digest('hex').slice(0, 12);
      let id = slugify(file.replace(EXT, ''));
      while (ids.has(id)) id += '-x';
      ids.add(id);
      const dir = path.join(outDir, `${id}.${hash}`);
      const metaFile = path.join(dir, 'meta.json');
      if (fs.existsSync(metaFile)) {
        manifest[file] = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        continue;
      }
      // remove stale versions of this photo
      for (const d of fs.readdirSync(outDir)) if (d.startsWith(id + '.') && d !== `${id}.${hash}`) fs.rmSync(path.join(outDir, d), { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      try {
        const meta = await processOne({ file, buf, id, hash, dir, grade });
        fs.writeFileSync(metaFile, JSON.stringify(meta));
        manifest[file] = meta;
        made++;
        log(`  photo  ${file}${meta.trimmed ? '  (trimmed black bars)' : ''}`);
      } catch (e) {
        fs.rmSync(dir, { recursive: true, force: true });
        log(`  ! could not read photo ${file}: ${e.message}`);
      }
    }
  }
  await Promise.all([worker(), worker()]);
  // forget cached photos whose originals are gone
  const live = new Set(Object.values(manifest).map(m => `${m.id}.${m.hash}`));
  for (const d of fs.readdirSync(outDir)) if (!live.has(d)) fs.rmSync(path.join(outDir, d), { recursive: true, force: true });
  return { manifest, made, total: files.length, unsupported };
}

// Copy generated images into the site folder.
export function publishPhotos(manifest, distDir) {
  const out = path.join(distDir, 'img');
  fs.mkdirSync(out, { recursive: true });
  for (const m of Object.values(manifest)) {
    const dir = r('generated', 'photos', `${m.id}.${m.hash}`);
    for (const f of fs.readdirSync(dir)) if (f !== 'meta.json') fs.copyFileSync(path.join(dir, f), path.join(out, f));
  }
}

async function processOne({ file, buf, id, hash, dir, grade }) {
  const isGif = /\.gif$/i.test(file);
  const input = () => sharp(buf, { failOn: 'none', limitInputPixels: false, animated: false }).rotate();
  const md = await sharp(buf, { failOn: 'none', limitInputPixels: false }).metadata();
  const turned = (md.orientation || 1) >= 5;
  const srcW = turned ? md.height : md.width, srcH = turned ? md.width : md.height;

  // 1 · trim true-black letterbox bars (screen recordings, phone screenshots)
  const trim = await findBars(input, srcW, srcH);
  let base = input();
  if (trim) base = base.extract({ left: 0, top: trim.top, width: srcW, height: srcH - trim.top - trim.bottom });
  const cropW = srcW, cropH = srcH - (trim ? trim.top + trim.bottom : 0);
  const scale = Math.min(1, MAX_EDGE / Math.max(cropW, cropH));
  const W = Math.round(cropW * scale), H = Math.round(cropH * scale);
  const { data: truePx } = await base.resize(W, H, { fit: 'fill' }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });

  // 2 · measure, then grade a copy
  const stats = measure(truePx, W, H);
  const recipe = makeRecipe(stats, grade);
  const gradedPx = applyRecipe(truePx, recipe);

  const rawOpts = { raw: { width: W, height: H, channels: 3 } };
  const tag = `${id}.${hash.slice(0, 6)}`;
  const out = { graded: [], true: [] };
  const sharpenSigma = Math.max(0.3, grade.sharpen ?? 0.55);

  for (const w of widthsFor(GRADED_WIDTHS, W)) {
    const name = `${tag}-${w}.webp`;
    await sharp(gradedPx, rawOpts).resize(w).sharpen({ sigma: sharpenSigma, m1: 0.6, m2: 1.2 }).webp({ quality: w <= 400 ? 72 : 76, effort: 4 }).toFile(path.join(dir, name));
    out.graded.push({ w, url: `/img/${name}` });
  }
  const jpgW = Math.min(W, 1280);
  await sharp(gradedPx, rawOpts).resize(jpgW).sharpen({ sigma: sharpenSigma }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, `${tag}-${jpgW}.jpg`));
  for (const w of widthsFor(TRUE_WIDTHS, W)) {
    const name = `${tag}-true-${w}.webp`;
    await sharp(truePx, rawOpts).resize(w).webp({ quality: 80, effort: 4 }).toFile(path.join(dir, name));
    out.true.push({ w, url: `/img/${name}` });
  }
  await sharp(truePx, rawOpts).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(dir, `${tag}-true-full.jpg`));
  const monoW = Math.min(W, 1000);
  await sharp(gradedPx, rawOpts).resize(monoW).greyscale().linear(1.15, -12).webp({ quality: 60, effort: 4 }).toFile(path.join(dir, `${tag}-mono.webp`));

  let anim = null;
  if (isGif) {
    const a = sharp(buf, { animated: true, failOn: 'none', limitInputPixels: false });
    const am = await a.metadata();
    if ((am.pages || 1) > 1) {
      const aw = Math.min(am.width, 560);
      await a.resize(aw).webp({ quality: 62, effort: 3 }).toFile(path.join(dir, `${tag}-anim.webp`));
      anim = { url: `/img/${tag}-anim.webp`, w: aw, frames: am.pages };
    }
  }

  // 3 · facts used by the design
  const small = await sharp(gradedPx, rawOpts).resize(96, 96, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const accent = pickAccent(small.data, small.info.width, small.info.height);
  const focus = await focalPoint(gradedPx, rawOpts, W, H);
  const sharpness = await measureSharpness(truePx, rawOpts);

  return {
    id, hash, file, w: W, h: H, srcW, srcH, ratio: +(W / H).toFixed(4),
    orientation: W / H > 1.15 ? 'landscape' : W / H < 0.87 ? 'portrait' : 'square',
    graded: out.graded, jpg: `/img/${tag}-${jpgW}.jpg`, jpgW,
    true: out.true, full: `/img/${tag}-true-full.jpg`, mono: `/img/${tag}-mono.webp`, anim,
    accent, focus, bg: stats.avgHex, trimmed: trim || null, sharpness,
    recipe: { gains: recipe.gains.map(g => +g.toFixed(3)), exposure: +recipe.exposure.toFixed(3), saturation: +recipe.sat.toFixed(3), wall: stats.wall ? true : false },
  };
}

const widthsFor = (list, W) => {
  const ws = list.filter(w => w <= W);
  if (!ws.length || (W > ws[ws.length - 1] * 1.15 && W < list[list.length - 1])) ws.push(W);
  return [...new Set(ws)].sort((a, b) => a - b);
};

// Rows that are true black (as in a video player's bars), top and bottom.
async function findBars(input, w, h) {
  const tw = 160, th = Math.min(1200, Math.round(h * (160 / w)));
  const { data } = await input().resize(tw, th, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const isBar = y => {
    let dark = 0; const row = [];
    for (let x = 0; x < tw; x++) { const v = data[y * tw + x]; row.push(v); if (v <= 8) dark++; }
    row.sort((a, b) => a - b);
    return row[tw >> 1] <= 3 && dark / tw >= 0.8;
  };
  let top = 0; while (top < th * 0.25 && isBar(top)) top++;
  let bottom = 0; while (bottom < th * 0.25 && isBar(th - 1 - bottom)) bottom++;
  if (top + bottom < th * 0.04) return null;
  const k = h / th;
  return { top: top ? Math.ceil(top * k) + 2 : 0, bottom: bottom ? Math.ceil(bottom * k) + 2 : 0 };
}

function measure(px, W, H) {
  const step = Math.max(1, Math.floor(Math.sqrt((W * H) / 60000)));
  const lum = []; let sr = 0, sg = 0, sb = 0, n = 0, chroma = 0;
  const samples = [];
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    const i = (y * W + x) * 3, R = px[i] / 255, G = px[i + 1] / 255, B = px[i + 2] / 255;
    const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, mx = Math.max(R, G, B), mn = Math.min(R, G, B);
    lum.push(Y); samples.push([R, G, B, Y, mx ? (mx - mn) / mx : 0]);
    sr += R; sg += G; sb += B; chroma += mx - mn; n++;
  }
  lum.sort((a, b) => a - b);
  const pct = p => lum[Math.min(lum.length - 1, Math.floor(p * lum.length))];
  // the "wall": bright, nearly colourless pixels
  const floor = Math.max(pct(0.82), 0.5);
  let wr = 0, wg = 0, wb = 0, wn = 0;
  for (const [R, G, B, Y, S] of samples) if (Y >= floor && S < 0.16) { wr += R; wg += G; wb += B; wn++; }
  const wall = wn / n >= 0.04 ? [wr / wn, wg / wn, wb / wn] : null;
  const hex = '#' + [sr, sg, sb].map(v => Math.round((v / n) * 255).toString(16).padStart(2, '0')).join('');
  return { p02: pct(0.02), p50: pct(0.5), p98: pct(0.98), wall, chroma: chroma / n, avgHex: hex };
}

function makeRecipe(s, grade) {
  const paper = hexToRgb(grade.paper_white || '#EDE8E0');
  const pm = Math.max(...paper);
  const tint = paper.map(c => c / pm);
  let gains = [1, 1, 1], exposure = 1;
  const bal = grade.balance ?? 0.35, exp = grade.exposure ?? 0.8;
  const night = s.p50 < 0.16;
  if (s.wall && !night) {
    const wm = Math.max(...s.wall);
    gains = s.wall.map((c, i) => Math.min(1.06, Math.max(0.94, (tint[i] / (c / wm)) ** bal)));
    const g1 = gains[1]; gains = gains.map(g => g / g1);
    const wl = 0.2126 * s.wall[0] + 0.7152 * s.wall[1] + 0.0722 * s.wall[2];
    exposure = Math.min(1.2, Math.max(0.92, (0.9 / wl) ** exp));
  } else {
    exposure = Math.min(1.14, Math.max(0.94, (0.42 / Math.max(0.08, s.p50)) ** (0.3 * exp)));
    if (night) exposure = 1;                      // night shots stay night
  }
  const sat = 1.03 * (grade.saturation ?? 1);
  return { gains, exposure, sat, contrast: grade.contrast ?? 0.16 };
}

function applyRecipe(px, { gains, exposure, sat, contrast }) {
  const curve = x => {
    x = Math.min(1, Math.max(0, x));
    const s = x * x * (3 - 2 * x);
    return x + (s - x) * contrast;
  };
  const shoulder = x => (x <= 0.82 ? x : 0.82 + 0.18 * Math.tanh((x - 0.82) / 0.18));
  const luts = gains.map(g => {
    const lut = new Float32Array(256);
    for (let i = 0; i < 256; i++) lut[i] = curve(shoulder((i / 255) * g * exposure));
    return lut;
  });
  const out = Buffer.allocUnsafe(px.length);
  for (let i = 0; i < px.length; i += 3) {
    let R = luts[0][px[i]], G = luts[1][px[i + 1]], B = luts[2][px[i + 2]];
    if (sat !== 1) {
      const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      R = Y + (R - Y) * sat; G = Y + (G - Y) * sat; B = Y + (B - Y) * sat;
    }
    out[i] = R <= 0 ? 0 : R >= 1 ? 255 : (R * 255 + 0.5) | 0;
    out[i + 1] = G <= 0 ? 0 : G >= 1 ? 255 : (G * 255 + 0.5) | 0;
    out[i + 2] = B <= 0 ? 0 : B >= 1 ? 255 : (B * 255 + 0.5) | 0;
  }
  return out;
}

// The most present vivid hue in the photo, as a small family of usable colours.
function pickAccent(px, pw, ph) {
  const bins = new Array(24).fill(0).map(() => ({ w: 0, L: 0, C: 0, x: 0, y: 0 }));
  for (let i = 0; i < px.length; i += 3) {
    const [L, C, h] = rgbToOklch([px[i] / 255, px[i + 1] / 255, px[i + 2] / 255]);
    if (C < 0.07 || L < 0.3 || L > 0.95) continue;
    // made things are vivid and near the middle; floors and skin are neither
    const n = i / 3, dx = ((n % pw) / pw - 0.5) * 2, dy = (Math.floor(n / pw) / ph - 0.5) * 2;
    const central = Math.exp(-(dx * dx + dy * dy) * 1.1);
    const earthy = h > 30 && h < 85 && C < 0.13 ? 0.25 : 1;
    const w = C ** 3 * central * earthy * 1000, b = bins[Math.floor(h / 15) % 24];
    b.w += w; b.L += L * w; b.C += C * w; b.x += Math.cos(h * Math.PI / 180) * w; b.y += Math.sin(h * Math.PI / 180) * w;
  }
  let best = null, score = 0;
  for (let i = 0; i < 24; i++) {
    const sc = bins[i].w + 0.5 * (bins[(i + 1) % 24].w + bins[(i + 23) % 24].w);
    if (sc > score) { score = sc; best = bins[i]; }
  }
  const n = px.length / 3;
  if (!best || score / n < 0.004) return { hex: '#CFC8BC', deep: '#2A262C', pale: '#E4DED4', ink: '#0D0B0E', neutral: true };
  const h = (Math.atan2(best.y, best.x) * 180 / Math.PI + 360) % 360;
  const C = Math.min(0.2, Math.max(0.12, best.C / best.w));
  const L = Math.min(0.88, Math.max(0.68, best.L / best.w));
  return {
    hex: oklchToHex([L, C, h]),          // vivid: fills, pitch text on top passes AA
    deep: oklchToHex([0.3, C * 0.55, h]),   // dark band: chalk text on top passes AA
    pale: oklchToHex([0.9, 0.045, h]),      // tinted paper
    ink: '#0D0B0E', hue: Math.round(h), neutral: false,
  };
}

async function focalPoint(px, rawOpts, W, H) {
  try {
    const s = Math.min(W, H);
    const { info } = await sharp(px, rawOpts).resize(s >> 2 || 1, s >> 2 || 1, { fit: 'cover', position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true });
    const k = 4, ox = Math.abs(info.cropOffsetLeft || 0), oy = Math.abs(info.cropOffsetTop || 0);
    const rw = W / k, rh = H / k, cs = s / k;
    const x = rw > cs ? ox / (rw - cs) : 0.5, y = rh > cs ? oy / (rh - cs) : 0.5;
    const soft = v => Math.round(50 + (Math.min(1, Math.max(0, v)) * 100 - 50) * 0.6);
    return { x: soft(x), y: soft(y) };
  } catch { return { x: 50, y: 50 }; }
}

async function measureSharpness(px, rawOpts) {
  try {
    const st = await sharp(px, rawOpts).resize(600, 600, { fit: 'inside' }).greyscale()
      .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], offset: 128 }).stats();
    return +st.channels[0].stdev.toFixed(2);
  } catch { return null; }
}
