// Reads site.yaml, design/tokens.yaml and every content file, and turns them
// into plain objects the templates can use.
import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import { marked } from 'marked';
import { r, slugify, titleCase } from './util.mjs';

marked.setOptions({ gfm: true });

export const loadYaml = file => yaml.load(fs.readFileSync(file, 'utf8')) || {};

export function parseFile(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw.trim(), error: 'The file must start with a block of settings between two --- lines.' };
  try { return { data: yaml.load(m[1]) || {}, body: m[2].trim() }; }
  catch (e) { return { data: {}, body: '', error: `The settings at the top could not be read (${e.reason || e.message}, near line ${e.mark ? e.mark.line + 2 : '?'}).` }; }
}

const list = v => (v === undefined || v === null || v === '') ? [] : (Array.isArray(v) ? v : String(v).split(/[,/]/)).map(x => String(x).trim()).filter(Boolean);
const hashStr = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export { hashStr };

export function loadTokens() { return loadYaml(r('design', 'tokens.yaml')); }
export function loadSite() { return loadYaml(r('site.yaml')); }

export function loadThings({ tokens, manifest, includeDrafts = false, extraDirs = [] }) {
  const makerKeys = Object.keys(tokens.makers);
  const problems = [];   // { slug, level: 'fix' | 'better', text }
  const things = [];
  const dirs = [r('content', 'things'), ...extraDirs];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!f.endsWith('.md') || f.startsWith('_')) continue;
      const slug = slugify(f.replace(/\.md$/, ''));
      const { data: d, body, error } = parseFile(path.join(dir, f));
      const where = `${path.relative(r(), dir).split(path.sep).join('/')}/${f}`;
      const isTest = dir !== dirs[0];
      if (error) { problems.push({ slug, where, level: 'fix', text: error, test: isTest }); continue; }
      if (d.draft && !includeDrafts) continue;
      const note = String(d.note ?? d.description ?? '').trim();
      const title = String(d.title ?? '').trim() || titleCase(slug);
      if (!d.title) problems.push({ slug, where, level: 'fix', text: `It has no title, so the file name is being used ("${title}"). Add a line like  title: "My Thing"` });

      // who made it
      const mk = list(d.maker).map(x => x.toLowerCase()).flatMap(x => (x === 'both' || x === 'us') ? makerKeys : [x]).filter(x => makerKeys.includes(x));
      const makers = makerKeys.filter(k => mk.includes(k));
      if (!makers.length) problems.push({ slug, where, level: 'fix', text: `It doesn't say who made it, so neither ear lights up. Add  maker: Kinnera  or  maker: Kaveri  or  maker: Kinnera/Kaveri` });
      const lit = makers.length === makerKeys.length ? 'both' : makers[0] || 'none';

      // when
      let date = d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date || '').slice(0, 10);
      let year = parseInt(d.year, 10) || parseInt(date, 10) || null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = year ? `${year}-01-01` : '1970-01-01';
      if (!year) { problems.push({ slug, where, level: 'fix', text: `It has no year, so it can't be placed in the fall. Add  year: 2026` }); year = new Date().getFullYear(); }

      // photos
      const photos = [];
      for (const p of (Array.isArray(d.photos) ? d.photos : Array.isArray(d.images) ? d.images : [])) {
        const file = typeof p === 'string' ? p : (p.file || p.src);
        if (!file) continue;
        const m = manifest[path.basename(file)] || Object.values(manifest).find(x => x.file.toLowerCase() === path.basename(file).toLowerCase());
        if (!m) { problems.push({ slug, where, level: 'fix', text: `It lists a photo called "${file}" but there is no such file in the photos folder. Check the spelling (capital letters matter) or upload the photo.` }); continue; }
        const alt = String((typeof p === 'object' && p.alt) || '').trim();
        const caption = String((typeof p === 'object' && p.caption) || '').trim();
        if (!alt) problems.push({ slug, where, level: 'fix', text: `The photo "${file}" has no alt text, so people using screen readers get only the title. Add a line under it like  alt: "A blue rack holding six rolled-up socks"` });
        if (Math.max(m.srcW, m.srcH) < 900) problems.push({ slug, where, level: 'better', text: `The photo "${file}" is small (${m.srcW} × ${m.srcH}). It will look soft when shown large. If you have the original, upload one at least 1600 pixels on its long side.` });
        if (m.sharpness !== null && m.sharpness < 12 && Math.max(m.srcW, m.srcH) >= 900) problems.push({ slug, where, level: 'better', text: `The photo "${file}" looks a little blurry. If there's a sharper one, swap it in.` });
        photos.push({ ...m, alt: alt || title, altMissing: !alt, caption });
      }
      if (!photos.length) problems.push({ slug, where, level: 'fix', text: `It has no photo. The page still works (it gets a drawn placeholder), but a photo is what makes it sing. Upload one to the photos folder and list it under  photos:` });
      if (!note) problems.push({ slug, where, level: 'better', text: `It has no one-line note. Add  note: "Because..."  so the label has something to say.` });
      else if (note.length > 220) problems.push({ slug, where, level: 'better', text: `The note is long (${note.length} characters). It is set large, so one or two sentences read best. Move the rest below the second --- line as the story.` });
      if (title.length > 60) problems.push({ slug, where, level: 'better', text: `The title is long (${title.length} characters). It will wrap onto several lines. Shorter is punchier.` });

      const kind = list(d.kind).map(slugify), madeWith = list(d.made_with ?? d['made-with']).map(slugify), tags = list(d.tags).map(slugify);
      if (!kind.length) problems.push({ slug, where, level: 'better', text: `It doesn't say what kind of thing it is, so it can't be found by browsing. Add  kind: [earrings]  (any words you like).` });

      // shop
      const price = d.price !== undefined && d.price !== null && String(d.price).trim() !== '' ? String(d.price).trim() : null;
      const buy = d.buy ? String(d.buy).trim() : null;
      const variants = Array.isArray(d.variants) ? d.variants.map(v => typeof v === 'string' ? { name: v } : { name: String(v.name || ''), price: v.price ? String(v.price) : null, buy: v.buy || null, sold_out: !!v.sold_out }).filter(v => v.name) : [];
      if (price && !buy) problems.push({ slug, where, level: 'better', text: `It has a price but no buy link, so the button says "Ask us about it" and opens an email. Add  buy: "https://..."  to send people to a listing.` });

      const specs = d.specs && typeof d.specs === 'object' && !Array.isArray(d.specs) ? Object.entries(d.specs).map(([k, v]) => [String(k), String(v)]) : [];
      const parts = list(d.parts);
      let video = null;
      if (d.video) {
        const v = String(d.video).trim();
        const yt = v.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
        const vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        video = yt ? { type: 'youtube', id: yt[1] } : vm ? { type: 'vimeo', id: vm[1] } : { type: 'file', src: v.startsWith('/') || /^https?:/.test(v) ? v : `/media/${v}` };
        if (video.type === 'file' && !/^https?:/.test(v) && !fs.existsSync(r('photos', path.basename(v)))) problems.push({ slug, where, level: 'fix', text: `It lists a video called "${v}" but there is no such file in the photos folder.` });
      }
      let model = null;
      if (d.model) {
        const mf = path.basename(String(d.model));
        if (!/\.(stl|glb)$/i.test(mf)) problems.push({ slug, where, level: 'fix', text: `The 3D model "${mf}" must be an .stl or .glb file.` });
        else if (!fs.existsSync(r('photos', mf))) problems.push({ slug, where, level: 'fix', text: `It lists a 3D model called "${mf}" but there is no such file in the photos folder.` });
        else model = { src: `/media/${mf}`, type: mf.toLowerCase().endsWith('.stl') ? 'stl' : 'glb' };
      }

      things.push({
        slug, url: `/project/${slug}/`, title, note, makers, lit, year, date,
        kind, madeWith, tags, photos, lead: photos[0] || null,
        price, buy, buyLabel: d.buy_label ? String(d.buy_label) : null, variants, soldOut: !!d.sold_out, forSale: !!(price || buy),
        specs, parts, video, model, moment: d.moment ? slugify(d.moment) : null, download: d.download ? String(d.download) : null,
        story: body ? marked.parse(body) : '', storyText: body, seed: hashStr(slug), draft: !!d.draft, test: isTest,
      });
    }
  }
  // newest first: by year, then by date, then by name
  things.sort((a, b) => b.year - a.year || b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  // accession numbers: year.sequence, counted from the first thing made that year
  const byYear = {};
  for (const t of [...things].reverse()) { byYear[t.year] = (byYear[t.year] || 0) + 1; t.acc = `${t.year}.${String(byYear[t.year]).padStart(2, '0')}`; }
  things.forEach((t, i) => { t.newer = things[i - 1] || null; t.older = things[i + 1] || null; });
  // more like this: shared words, then same maker, then nearness in time
  for (const t of things) {
    const mine = new Set([...t.kind.map(k => 'k:' + k), ...t.madeWith.map(k => 'w:' + k), ...t.tags.map(k => 't:' + k)]);
    t.related = things.filter(o => o !== t && o.lead).map(o => {
      let s = 0;
      for (const k of o.kind) if (mine.has('k:' + k)) s += 3;
      for (const k of o.tags) if (mine.has('t:' + k)) s += 2;
      for (const k of o.madeWith) if (mine.has('w:' + k)) s += 0.4;
      if (o.lit === t.lit) s += 0.3;
      s -= Math.abs(o.year - t.year) * 0.1;
      return [s, o];
    }).sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).slice(0, 4).map(x => x[1]);
  }
  return { things, problems };
}

// Every way of browsing: what it is, how it's made, loose tags, who, when.
export function buildFacets(things, tokens) {
  const facet = (key, label, base, get, name = titleCase) => {
    const map = new Map();
    for (const t of things) for (const v of get(t)) { if (!map.has(v)) map.set(v, []); map.get(v).push(t); }
    const values = [...map.entries()].map(([value, items]) => ({ value, name: name(value), items, count: items.length, url: `/${base}/${value}/` }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return { key, label, base, values };
  };
  const makerName = v => v === 'both' ? 'Both of us' : tokens.makers[v]?.name || titleCase(v);
  return [
    facet('kind', 'What it is', 'kind', t => t.kind),
    facet('with', 'How it was made', 'made-with', t => t.madeWith),
    facet('by', 'Who made it', 'by', t => [t.lit].filter(x => x !== 'none'), makerName),
    facet('year', 'When', 'year', t => [String(t.year)], v => v),
    facet('tag', 'Also', 'tag', t => t.tags),
  ].map(f => f.key === 'year' ? { ...f, values: f.values.sort((a, b) => b.value - a.value) } : f.key === 'by' ? { ...f, values: f.values.sort((a, b) => ['kinnera', 'kaveri', 'both'].indexOf(a.value) - ['kinnera', 'kaveri', 'both'].indexOf(b.value)) } : f);
}

export function loadPages() {
  const dir = r('content', 'pages');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(f => {
    const { data, body } = parseFile(path.join(dir, f));
    const slug = slugify(f.replace(/\.md$/, ''));
    return { slug, url: `/${slug}/`, title: data.title || titleCase(slug), intro: data.intro || '', nav: data.nav || null, html: marked.parse(body || ''), draft: !!data.draft };
  }).filter(p => !p.draft);
}
