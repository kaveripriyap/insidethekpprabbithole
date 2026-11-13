// ─────────────────────────────────────────────────────────────────────────────
//  THE BUILD.   npm run build   →   dist/
//  Reads content + tokens + photos, writes the whole site.
//    --torture      also builds the awkward test content in content/_tests
//    --check-only   only runs the designer's guarantee (no site written)
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as esbuild from 'esbuild';
import sharp from 'sharp';
import { r, write, copyDir, esc } from './lib/util.mjs';
import { hexToRgb, rgbToOklch, oklchToHex } from './lib/colour.mjs';
import { loadTokens, loadSite, loadThings, buildFacets, loadPages } from './lib/content.mjs';
import { buildPhotos, publishPhotos } from './lib/photos.mjs';
import { buildBrand } from './lib/brand.mjs';
import { shell } from './templates/parts.mjs';
import * as P from './templates/pages.mjs';

const args = new Set(process.argv.slice(2));
const TORTURE = args.has('--torture'), CHECK = args.has('--check-only');
const t0 = Date.now();
const dist = r('dist');
const log = (...a) => console.log(...a);

const tokens = loadTokens();
const site = loadSite();
site.url = String(site.url || '').replace(/\/+$/, '');

// 1 · photos
log('\nPhotographs');
const { manifest, made, total, unsupported } = await buildPhotos({ grade: tokens.grade, log });
log(`  ${total} photos (${made} newly made, ${total - made} from cache)`);

// 2 · content
const { things, problems } = loadThings({ tokens, manifest, includeDrafts: false, extraDirs: TORTURE ? [r('content', '_tests')] : [] });
for (const p of problems) p.test = p.test || things.find(t => t.slug === p.slug)?.test || false;
for (const f of unsupported) problems.push({ slug: '', where: `photos/${f}`, level: 'fix', text: `This file type can't be used as a photo. Save it as a .jpg or .png and upload that instead.` });
const used = new Set(things.flatMap(t => t.photos.map(p => p.file)));
if (site.curators_photo) used.add(site.curators_photo);
for (const m of Object.values(manifest)) if (!used.has(m.file)) problems.push({ slug: '', where: `photos/${m.file}`, level: 'better', text: `This photo isn't shown anywhere. List it under  photos:  in a thing's file, or leave it be.` });
const facets = buildFacets(things.filter(t => !t.test), tokens);
const pages = loadPages();
site._hasShop = true;
site._curators = site.curators_photo ? manifest[site.curators_photo] && { ...manifest[site.curators_photo], alt: site.curators_alt || '' } : null;

report(problems);
if (CHECK) process.exit(problems.some(p => p.level === 'fix' && !p.test) ? 1 : 0);

// 3 · a clean output folder
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
publishPhotos(manifest, dist);
copyDir(r('src', 'static'), dist);
// models, videos and downloads that sit beside the photos
for (const f of fs.existsSync(r('photos')) ? fs.readdirSync(r('photos')) : []) if (/\.(stl|glb|mp4|webm|zip|3mf|pdf)$/i.test(f)) { fs.mkdirSync(path.join(dist, 'media'), { recursive: true }); fs.copyFileSync(r('photos', f), path.join(dist, 'media', f)); }

// 4 · fonts
const fontSrc = {
  'fraunces.woff2': ['@fontsource-variable', 'fraunces', 'files', 'fraunces-latin-full-normal.woff2'],
  'fraunces-italic.woff2': ['@fontsource-variable', 'fraunces', 'files', 'fraunces-latin-full-italic.woff2'],
  'reenie-beanie.woff2': ['@fontsource', 'reenie-beanie', 'files', 'reenie-beanie-latin-400-normal.woff2'],
};
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
for (const [name, parts] of Object.entries(fontSrc)) fs.copyFileSync(r('node_modules', ...parts), path.join(dist, 'fonts', name));

// 5 · styles: tokens → CSS variables, plus per-thing accents and per-photo facts
const C = tokens.colour;
let gen = ':root{';
for (const [k, v] of Object.entries(C)) gen += `--c-${k}:${v.value};`;
for (const [k, v] of Object.entries(tokens.dream)) gen += `--d-${k}:${v};`;
for (const [k, v] of Object.entries(tokens.type)) gen += `--f-${k}:"${v.family}",${v.fallback};`;
for (const [k, v] of Object.entries(tokens.space)) gen += `--s-${k}:${v}rem;`;
for (const [k, v] of Object.entries(tokens.motion)) gen += `--m-${k}:${v};`;
gen += `--hairline:${tokens.shape.hairline};--corner:${tokens.shape.corner};--c-kinnera:var(--c-${tokens.makers.kinnera.colour});--c-kaveri:var(--c-${tokens.makers.kaveri.colour})}\n`;
for (const k of Object.keys(C)) gen += `.sw-${k}{background:var(--c-${k})}`;
for (const k of Object.keys(tokens.dream)) gen += `.sw-dream-${k}{background:var(--d-${k})}`;
gen += '\n';
for (const t of things) {
  const a = t.lead?.accent;
  if (a && !a.neutral) {
    const [, c, h] = rgbToOklch(hexToRgb(a.hex));   // the thing's own room: its accent hue, turned right down
    gen += `.a-${t.slug}{--accent:${a.hex};--accent-deep:${a.deep};--accent-pale:${a.pale};--room:${oklchToHex([0.27, Math.min(0.09, c * 0.6), h])};--floor:${oklchToHex([0.19, Math.min(0.065, c * 0.45), h])}}`;
  } else gen += `.a-${t.slug}{--accent:${C.gilt.value};--accent-deep:${C.velvet.value};--accent-pale:#E7DECB;--room:${C.velvet.value};--floor:${C.burrow.value}}`;
}
gen += '\n';
for (const m of Object.values(manifest)) gen += `.ph-${m.id}{--fx:${m.focus.x}%;--fy:${m.focus.y}%;background-color:${m.bg}}`;
const cssFiles = ['base.css', 'chrome.css', 'cabinet.css', 'exhibit.css', 'fall.css', 'rooms.css', 'charms.css'];
const cssRaw = gen + '\n' + cssFiles.map(f => fs.readFileSync(r('src', 'css', f), 'utf8')).join('\n');
const cssMin = (await esbuild.transform(cssRaw, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })).code;
const cssName = `/assets/site.${crypto.createHash('sha1').update(cssMin).digest('hex').slice(0, 8)}.css`;
write(path.join(dist, cssName), cssMin);

// 6 · scripts
const entries = ['site', 'fall', 'cabinet', 'exhibit', 'about', 'brand', 'surprise', 'lost'];
const js = await esbuild.build({
  entryPoints: entries.map(e => r('src', 'js', `${e}.js`)), bundle: true, splitting: true, format: 'esm', minify: true, target: ['chrome100', 'safari15', 'firefox100'],
  outdir: path.join(dist, 'assets'), entryNames: '[name].[hash]', chunkNames: 'chunk.[name].[hash]', metafile: true, logLevel: 'warning',
});
const jsMap = {};
for (const [out, meta] of Object.entries(js.metafile.outputs)) if (meta.entryPoint) jsMap[path.basename(meta.entryPoint, '.js')] = '/assets/' + path.basename(out);

// a fine paper grain, laid over the dark rooms
{
  const n = 160, px = Buffer.alloc(n * n * 4);
  let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n * n; i++) { const v = rnd() > 0.5 ? 255 : 0; px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v; px[i * 4 + 3] = Math.round(rnd() * 20); }
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  await sharp(px, { raw: { width: n, height: n, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(dist, 'assets', 'grain.png'));
}
// two small cursors: a key for anything that opens, a loupe for anything you can lean into
write(path.join(dist, 'assets', 'key.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><g fill="none" stroke="${C.ink.value}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l13 13M10 10l-3 3M14 14l-3 3"/><circle cx="21.500" cy="21.500" r="4.500"/></g><g fill="none" stroke="${C.gilt.value}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l13 13M10 10l-3 3M14 14l-3 3"/><circle cx="21.500" cy="21.500" r="4.500"/></g></svg>`.replace(/\.500/g, '.5'));
write(path.join(dist, 'assets', 'loupe.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><g fill="none" stroke-linecap="round"><circle cx="11" cy="11" r="8" stroke="${C.ink.value}" stroke-width="5"/><path d="M17.500 17.500l9 9" stroke="${C.ink.value}" stroke-width="6"/><circle cx="11" cy="11" r="8" stroke="${C.gilt.value}" stroke-width="2.4" fill="rgba(255,231,174,.25)"/><path d="M17.500 17.500l9 9" stroke="${C.gilt.value}" stroke-width="3.2"/></g></svg>`.replace(/\.500/g, '.5'));
write(path.join(dist, 'assets', 'nojs.css'), '.facet__chips{display:flex!important}.facet__name::after,.finder__tools,.finder__key,.case__tools,.lost__pile,.lost__hint{display:none!important}.is-fall .top{position:absolute!important}');
const assets = { css: cssName, js: jsMap, fonts: { story: '/fonts/fraunces.woff2', label: '/fonts/fraunces-italic.woff2' }, social: '/social.jpg' };

// 7 · brand files
log('\nBrand files');
const brandFiles = await buildBrand({ tokens, site, dist });
log(`  ${brandFiles.length} files in /brand/files/`);

// 8 · pages
const ctx = { site, tokens, things: things.filter(t => !t.test), facets };
const out = [];
const page = (p) => { out.push(p); const file = p.path.endsWith('/') ? path.join(dist, p.path, 'index.html') : path.join(dist, p.path); write(file, shell({ site, tokens, assets, page: p })); };
page(P.homePage(ctx));
page(P.cabinetPage(ctx));
for (const t of things) page(P.exhibitPage({ ...ctx, t }));
for (const f of facets) for (const v of f.values) page(P.drawerRoomPage({ ...ctx, facet: f, value: v }));
page(P.aboutPage(ctx));
page(P.shopPage(ctx));
page(P.surprisePage(ctx));
page(P.notFoundPage(ctx));
const sample = manifest['CuttingBoardHolda.jpg'] ? { ...manifest['CuttingBoardHolda.jpg'], alt: 'two cutting boards in a small teal holder' } : (ctx.things.find(t => t.lead)?.lead || null);
page(P.brandPage({ ...ctx, brandFiles, sample }));
page(P.systemPage({ ...ctx, problems, tests: things.filter(t => t.test) }));
for (const pg of pages) page(P.prosePage({ site, page: pg }));

// 9 · data, feeds, redirects
write(path.join(dist, 'things.json'), JSON.stringify(ctx.things.map(t => ({ slug: t.slug, url: t.url, title: t.title, note: t.note, year: t.year, by: t.lit, acc: t.acc, kind: t.kind, with: t.madeWith, tags: t.tags, sale: t.forSale, img: t.lead?.graded[0].url || null }))));
const listed = out.filter(p => !p.noindex && !things.find(t => t.test && t.url === p.path));
write(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${listed.map(p => `<url><loc>${site.url}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
write(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /system/\nSitemap: ${site.url}/sitemap.xml\n`);
write(path.join(dist, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.title)}</title><link>${site.url}/</link><description>${esc(site.description)}</description><atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>\n${ctx.things.slice(0, 40).map(t => `<item><title>${esc(t.title)}</title><link>${site.url}${t.url}</link><guid>${site.url}${t.url}</guid><pubDate>${new Date(t.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${esc(t.note)}</description>${t.lead ? `<enclosure url="${site.url}${t.lead.jpg}" type="image/jpeg" length="0"/>` : ''}</item>`).join('\n')}\n</channel></rss>\n`);
let redirects = '# Old addresses keep working. Made by the build: do not edit by hand.\n';
for (const m of Object.values(manifest)) redirects += `/assets/uploads/${encodeURI(m.file)}  ${m.anim ? m.anim.url : m.full}  301\n`;
redirects += '/assets/uploads/*  /things/  302\n/projects  /things/  301\n/projects/  /things/  301\n/projects/*  /project/:splat  301\n/project  /things/  301\n/project/  /things/  301\n/cabinet  /things/  301\n/cabinet/*  /things/  301\n';
write(path.join(dist, '_redirects'), redirects);

const pagesN = out.length;
log(`\nBuilt ${pagesN} pages, ${things.filter(t => !t.test).length} things${TORTURE ? ` (+${things.filter(t => t.test).length} stress tests)` : ''} in ${((Date.now() - t0) / 1000).toFixed(1)}s  →  dist/\n`);

// The designer's guarantee: say plainly what would make a page weak.
function report(list) {
  const mine = list.filter(p => TORTURE || !p.test);
  const fix = mine.filter(p => p.level === 'fix'), better = mine.filter(p => p.level === 'better');
  log("\nThe designer's guarantee");
  if (!fix.length && !better.length) { log('  Every page will look its best. Nothing to fix.'); return; }
  if (fix.length) { log(`  PLEASE FIX (${fix.length})`); for (const p of fix) log(`   ✗ ${p.where}\n     ${p.text}`); }
  if (better.length) { log(`  WOULD BE BETTER (${better.length})`); for (const p of better) log(`   · ${p.where}\n     ${p.text}`); }
  if (process.env.GITHUB_ACTIONS || process.env.NETLIFY) log('  (The site still builds. Every page stays presentable; these would make it sing.)');
}
