// Runs after every build: favicons, downloadable logo files, Etsy-ready images,
// and a social card for every page so shared links look like the site.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import yaml from "js-yaml";
import { markSvg, textPath, wrapText, teluguPath, GEOMETRY } from "./mark.js";
import { colour } from "./tokens.js";
import { photoMeta } from "./photos.js";
import { getShelves } from "./shelves.js";

const OUT = "_site";
const SITE = yaml.load(fs.readFileSync("site.yaml", "utf8"));
const C = (n) => colour(n);
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
};
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const nest = (svg, x, y, size) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">${inner(svg)}</svg>`;

// Lip (near rim) for any hole, so things can rise out of it.
function holeParts(cx, cy, rx, ry, colourName = "hole") {
  const lipRy = (ry * 6) / 16;
  return {
    back: `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C(colourName)}"/>`,
    lip: `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}A${rx} ${lipRy} 0 0 0 ${cx - rx} ${cy}Z" fill="${C(colourName)}"/>`,
  };
}

function svgText(text, size, x, y, fill = C("hole"), spacing = 0) {
  const t = textPath(text, size, x, y, spacing);
  return { svg: `<path d="${t.d}" fill="${fill}"/>`, width: t.width };
}

// ── Logo files ────────────────────────────────────────────────────────────
function lockup(text, { height = 120, fill = "hole", bg = null } = {}) {
  const size = height;
  const mark = markSvg({ decorative: true });
  const t = textPath(text, size * 0.42, 0, 0);
  const gap = size * 0.18;
  const w = Math.ceil(size + gap + t.width + 8);
  const ty = size * 0.5 + (t.ascent - t.descent) * 0.36;
  const words = textPath(text, size * 0.42, size + gap, ty);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${size}" width="${w}" height="${size}" role="img" aria-label="${text}">${
    bg ? `<rect width="100%" height="100%" fill="${C(bg)}"/>` : ""
  }${nest(mark, 0, 0, size)}<path d="${words.d}" fill="${C(fill)}"/></svg>`;
}

function brandFiles() {
  const dir = `${OUT}/brand/files`;
  const files = {
    "kpp-mark.svg": markSvg({ title: "KPP mark" }),
    "kpp-mark-tile.svg": markSvg({ bg: "periwinkle", title: "KPP mark on Periwinkle" }),
    "kpp-mark-on-hole.svg": markSvg({ bg: "hole", hole: "#000000", title: "KPP mark on Hole" }),
    "kpp-mark-one-colour-hole.svg": markSvg({ hole: "hole", left: "hole", right: "hole", title: "KPP mark, one colour" }),
    "kpp-mark-one-colour-paper.svg": markSvg({ hole: "paper", left: "paper", right: "paper", title: "KPP mark, one colour, for dark backgrounds" }),
    "kpp-lockup-site.svg": lockup(SITE.title),
    "kpp-lockup-shop.svg": lockup(SITE.shop_name),
    "kpp-lockup-shop-on-periwinkle.svg": lockup(SITE.shop_name, { bg: "periwinkle" }),
  };
  for (const [name, svg] of Object.entries(files)) write(`${dir}/${name}`, svg);
  return files;
}

// ── Favicons + Etsy images ────────────────────────────────────────────────
async function rasters(files) {
  const tile = Buffer.from(markSvg({ bg: "periwinkle", decorative: true }));
  const bare = Buffer.from(markSvg({ decorative: true }));
  write(`${OUT}/favicon.svg`, markSvg({ title: "KPP" }));
  await sharp(tile, { density: 300 }).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);
  await sharp(tile, { density: 300 }).resize(192, 192).png().toFile(`${OUT}/icon-192.png`);
  await sharp(tile, { density: 300 }).resize(512, 512).png().toFile(`${OUT}/icon-512.png`);
  await sharp(bare, { density: 200 }).resize(48, 48).png().toFile(`${OUT}/favicon-48.png`);
  // favicon.ico for browsers and tools that ask for it directly (PNG-in-ICO)
  const pngs = await Promise.all([16, 32, 48].map((n) => sharp(tile, { density: 200 }).resize(n, n).png().toBuffer().then((b) => [n, b])));
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(([n, b], i) => {
    const o = 6 + i * 16;
    head.writeUInt8(n, o); head.writeUInt8(n, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(b.length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += b.length;
  });
  write(`${OUT}/favicon.ico`, Buffer.concat([head, ...pngs.map(([, b]) => b)]));

  const dir = `${OUT}/brand/files`;
  // Etsy shop icon: 500 × 500
  await sharp(tile, { density: 600 }).resize(500, 500).png().toFile(`${dir}/etsy-shop-icon-500.png`);

  // Etsy big banner: 3360 × 840
  const W = 3360, H = 840;
  const h = holeParts(560, 690, 420, 120);
  const ears = markSvg({ decorative: true });
  const tx = 1080;
  const nameSize = Math.min(210, (210 * (W - tx - 140)) / textPath(SITE.shop_name, 210).width);
  const name = svgText(SITE.shop_name, nameSize, tx, 430);
  const tag = svgText(SITE.tagline, 120, tx, 640, C("hole"));
  const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${C("periwinkle")}"/>
    ${nest(ears, 120, -20, 820)}
    ${name.svg}${tag.svg}
    <circle cx="${tx + tag.width + 90}" cy="600" r="36" fill="${C("bubblegum")}"/>
    <circle cx="${tx + tag.width + 190}" cy="600" r="36" fill="${C("yolk")}"/>
  </svg>`;
  await sharp(Buffer.from(bannerSvg)).png().toFile(`${dir}/etsy-banner-3360x840.png`);

  // Etsy mini banner: 1200 × 160
  const mini = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="160" viewBox="0 0 1200 160">
    <rect width="1200" height="160" fill="${C("periwinkle")}"/>
    ${nest(ears, 40, 8, 144)}
    ${svgText(SITE.shop_name, Math.min(58, (58 * 600) / textPath(SITE.shop_name, 58).width), 210, 98).svg}
    ${svgText(SITE.tagline, 36, 1160 - textPath(SITE.tagline, 36).width, 96).svg}
  </svg>`;
  await sharp(Buffer.from(mini)).png().toFile(`${dir}/etsy-mini-banner-1200x160.png`);
}

// ── Social cards ──────────────────────────────────────────────────────────
async function card({ out, kicker, title, chip, chipColour = "yolk", photoSrc }) {
  const W = 1200, H = 630;
  const hole = holeParts(860, 560, 320, 84);
  const mark = markSvg({ decorative: true });
  const maxW = photoSrc ? 560 : 620;
  let size = photoSrc ? 74 : 96;
  let lines = wrapText(title, size, maxW, 3);
  while (lines.at(-1).endsWith("…") && size > 48) {
    size -= 8;
    lines = wrapText(title, size, maxW, 3);
  }
  let y = 250;
  const titleSvg = lines
    .map((l, i) => svgText(l, size, 64, y + i * size * 1.02).svg)
    .join("");
  const after = y + (lines.length - 1) * size * 1.02;
  const kick = svgText(kicker, 30, 64, 160, C("hole"));
  const brand = svgText(SITE.title, 30, 150, 86);
  let chipSvg = "";
  if (chip) {
    const t = textPath(chip, 30, 0, 0);
    const cy = Math.min(after + 70, 540);
    chipSvg = `<rect x="64" y="${cy}" width="${t.width + 48}" height="54" rx="27" fill="${C(chipColour)}" stroke="${C("hole")}" stroke-width="3"/>${svgText(chip, 30, 88, cy + 38).svg}`;
  }
  const back = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${C("periwinkle")}"/>${photoSrc ? hole.back : ""}</svg>`;
  const front = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    ${photoSrc ? hole.lip : nest(markSvg({ decorative: true }), 660, 120, 580)}
    ${nest(mark, 56, 30, 84)}${brand.svg}${kick.svg}${titleSvg}${chipSvg}</svg>`;
  const layers = [];
  if (photoSrc) {
    const meta = await photoMeta(photoSrc, "full");
    const fmt = meta.jpeg || meta.webp;
    const src = (fmt.find((f) => f.width >= 800) || fmt.at(-1)).outputPath;
    const pw = 400, ph = 470;
    const mask = Buffer.from(`<svg width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="34" fill="#fff"/></svg>`);
    const border = Buffer.from(`<svg width="${pw}" height="${ph}"><rect x="5" y="5" width="${pw - 10}" height="${ph - 10}" rx="30" fill="none" stroke="${C("hole")}" stroke-width="10"/></svg>`);
    const pic = await sharp(src)
      .resize(pw, ph, { fit: "cover", position: "attention" })
      .composite([{ input: mask, blend: "dest-in" }, { input: border }])
      .png()
      .toBuffer();
    const tilted = await sharp(pic).rotate(-5, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const tm = await sharp(tilted).metadata();
    layers.push({ input: tilted, left: Math.round(860 - tm.width / 2), top: Math.round(586 - tm.height) + 30 });
  }
  layers.push({ input: Buffer.from(front), left: 0, top: 0 });
  await sharp(Buffer.from(back)).composite(layers).png({ compressionLevel: 9, palette: false }).toFile(out);
}

async function socialCards(results) {
  const pages = results.filter((r) => r.outputPath && r.outputPath.endsWith(".html"));
  const shelves = getShelves();
  const tasks = [];
  for (const r of pages) {
    const url = r.url;
    const slug = url === "/" ? "home" : url.replace(/^\/|\/$/g, "").replace(/\//g, "--");
    const out = `${OUT}/og/${slug}.png`;
    // read the little JSON note each page leaves for us
    const m = r.content.match(/<meta name="kpp:card" content="([^"]*)"/);
    const info = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'")) : { title: SITE.title, kicker: SITE.tagline };
    tasks.push(() => card({ out, ...info }).catch((e) => console.warn(`[og] ${url}: ${e.message}`)));
  }
  fs.mkdirSync(`${OUT}/og`, { recursive: true });
  // a few at a time
  const queue = [...tasks];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) await queue.shift()();
    })
  );
  return tasks.length;
}

export async function afterBuild({ results }) {
  const t0 = Date.now();
  const files = brandFiles();
  await rasters(files);
  const n = await socialCards(results || []);
  console.log(`[kpp] brand files, icons and ${n} social cards in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
