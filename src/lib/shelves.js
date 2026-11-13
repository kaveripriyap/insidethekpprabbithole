// A "shelf" is a kind of content: things, notes, printables, a shop…
// Each one is just a folder in /content with a _shelf.yaml inside.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const CONTENT = "content";
let cache;

export function getShelves() {
  if (cache) return cache;
  cache = fs
    .readdirSync(CONTENT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => {
      const file = path.join(CONTENT, d.name, "_shelf.yaml");
      const cfg = fs.existsSync(file) ? yaml.load(fs.readFileSync(file, "utf8")) || {} : {};
      const url = String(cfg.url || d.name).replace(/^\/+|\/+$/g, "");
      return {
        key: d.name,
        title: cfg.title || d.name.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        intro: cfg.intro || "",
        nav: cfg.nav === undefined ? cfg.title || d.name : cfg.nav,
        url,
        singular: cfg.singular || "item",
        look: cfg.look || "finds",
        numbered: cfg.numbered !== false,
        order: cfg.order || "oldest-first",
        families: (cfg.families || []).map((f) => ({ ...f, url: `/${url}/family/${f.key}/` })),
        position: cfg.position ?? 50,
      };
    })
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
  return cache;
}

export function shelfFor(inputPath) {
  const rel = path.relative(CONTENT, path.normalize(inputPath));
  const key = rel.split(path.sep)[0];
  return getShelves().find((s) => s.key === key);
}

export function resetShelves() {
  cache = undefined;
}
