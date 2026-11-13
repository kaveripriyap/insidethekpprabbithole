// npm run check: reads every content file and points out anything that would
// break the build or look wrong, in plain words. Safe to run any time.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const CONTENT = "content";
const PHOTOS = new Set(fs.readdirSync("photos"));
let problems = 0, items = 0;
const say = (file, msg) => { problems++; console.log(`  ✗ ${file}: ${msg}`); };

for (const dir of fs.readdirSync(CONTENT, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name.startsWith("_")) continue;
  const shelfFile = path.join(CONTENT, dir.name, "_shelf.yaml");
  const shelf = fs.existsSync(shelfFile) ? yaml.load(fs.readFileSync(shelfFile, "utf8")) || {} : {};
  const families = new Set((shelf.families || []).map((f) => f.key));
  console.log(`\n${dir.name}/  (${shelf.title || "no _shelf.yaml, using defaults"})`);
  for (const f of fs.readdirSync(path.join(CONTENT, dir.name))) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue;
    items++;
    const file = `${dir.name}/${f}`;
    const raw = fs.readFileSync(path.join(CONTENT, dir.name, f), "utf8");
    const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!m) { say(file, "the top section between --- lines is missing"); continue; }
    let d;
    try { d = yaml.load(m[1]) || {}; } catch (e) { say(file, `the top section has a typo: ${e.reason || e.message}`); continue; }
    if (!d.title) say(file, 'needs a "title:"');
    if (!d.date) say(file, 'needs a "date:" like 2026-11-13');
    if (d.family && families.size && !families.has(d.family)) say(file, `family "${d.family}" isn't in ${dir.name}/_shelf.yaml (it will show under "Loose finds")`);
    for (const [i, img] of (d.images || []).entries()) {
      const name = path.basename(String(img.src || ""));
      if (!img.src) say(file, `photo ${i + 1} has no "src:"`);
      else if (!PHOTOS.has(name)) say(file, `photo "${name}" isn't in the photos folder`);
      if (!img.alt) say(file, `photo ${i + 1} (${name}) needs an "alt:" describing it`);
    }
    if (d.draft === true) console.log(`  · ${file} is a draft (hidden)`);
  }
}
console.log(problems ? `\n${problems} thing(s) to fix in ${items} files.` : `\nAll ${items} files look good.`);
process.exit(problems ? 1 : 0);
