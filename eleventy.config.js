// Eleventy setup. Content lives in /content, words in site.yaml, the look in
// design/tokens.yaml. This file wires them together; you rarely need it.
import fs from "node:fs";
import crypto from "node:crypto";
import yaml from "js-yaml";
import { photo, photoShape } from "./src/lib/photos.js";
import { markSvg, madeBySvg, teluguPath } from "./src/lib/mark.js";
import { tokensCss, contrastReport, TOKENS, colour, contrast } from "./src/lib/tokens.js";
import { getShelves } from "./src/lib/shelves.js";
import { afterBuild } from "./src/lib/after-build.js";

const SITE = yaml.load(fs.readFileSync("site.yaml", "utf8"));
const numbers = new Map(); // url -> find number

const makers = (m = "") => {
  const names = String(m).split(/\s*[\/&,+]\s*|\s+and\s+/i).filter(Boolean);
  return names.length > 1 ? names.slice(0, -1).join(", ") + " & " + names.at(-1) : names[0] || "";
};

// Stable "random" pick so the no-JavaScript Fall Deeper link still goes somewhere fun.
const pick = (list, seed) => {
  const h = crypto.createHash("md5").update(seed).digest().readUInt32BE(0);
  return list[h % list.length];
};

export default function (cfg) {
  cfg.addDataExtension("yaml,yml", (contents) => yaml.load(contents));
  cfg.addGlobalData("site", SITE);
  cfg.addGlobalData("shelves", () => getShelves());
  cfg.addGlobalData("tokens", TOKENS);
  cfg.addGlobalData("familyPages", () => getShelves().flatMap((s) => s.families.map((f) => ({ shelf: s, family: f }))));
  cfg.addGlobalData("contrast", () => contrastReport());
  cfg.addGlobalData("build", () => ({
    year: new Date().getFullYear(),
    hash: crypto
      .createHash("md5")
      .update(fs.readFileSync("src/assets/css/site.css") + fs.readFileSync("src/assets/js/site.js") + fs.readFileSync("design/tokens.yaml"))
      .digest("hex")
      .slice(0, 8),
  }));

  // Things Eleventy should leave alone
  ["README.md", "HOW-TO-ADD-THINGS.md", "design/**", "scripts/**", "netlify/**", "content/_*/**", "content/**/_*.md"].forEach((p) =>
    cfg.ignores.add(p)
  );

  cfg.addPassthroughCopy({ "src/assets/fonts/*.woff2": "fonts" });
  cfg.addPassthroughCopy({ "src/assets/js": "js" });
  cfg.addPassthroughCopy({ photos: "photos" }); // full-size originals, linked from each find
  cfg.addWatchTarget("design/");
  cfg.addWatchTarget("src/assets/");
  cfg.addWatchTarget("site.yaml");

  // ── Collections ──────────────────────────────────────────────────────────
  cfg.addCollection("items", (api) => {
    const items = api
      .getAll()
      .filter((i) => i.data.shelf && i.data.draft !== true && i.url)
      .sort((a, b) => b.date - a.date || a.data.title.localeCompare(b.data.title));
    numbers.clear();
    for (const shelf of getShelves()) {
      const own = items.filter((i) => i.data.shelf === shelf.key);
      const counted = shelf.order === "newest-first" ? own : [...own].reverse();
      counted.forEach((i, n) => numbers.set(i.url, n + 1));
    }
    return items;
  });

  // ── Filters ──────────────────────────────────────────────────────────────
  cfg.addFilter("byShelf", (items = [], key) => items.filter((i) => i.data.shelf === key));
  cfg.addFilter("byFamily", (items = [], key) => items.filter((i) => i.data.family === key));
  cfg.addFilter("looseFinds", (items = []) =>
    items.filter((i) => !getShelves().find((s) => s.key === i.data.shelf)?.families.some((f) => f.key === i.data.family))
  );
  cfg.addFilter("chambers", (items = [], shelf) =>
    (shelf?.families || [])
      .map((family) => ({ family, items: items.filter((i) => i.data.family === family.key) }))
      .filter((c) => c.items.length)
      .map((c, i) => ({ ...c, n: i + 1 }))
  );
  cfg.addFilter("sampleOf", (items = [], title) => {
    const hit = items.find((i) => i.data.title === title) || items[0];
    return hit ? [hit] : [];
  });
  cfg.addFilter("featured", (items = []) => items.filter((i) => i.data.featured));
  cfg.addFilter("shelf", (key) => getShelves().find((s) => s.key === key));
  cfg.addFilter("family", (shelfKey, famKey) => getShelves().find((s) => s.key === shelfKey)?.families.find((f) => f.key === famKey));
  cfg.addFilter("findNo", (url) => String(numbers.get(url) || 0).padStart(3, "0"));
  cfg.addFilter("neighbours", (items = [], url) => {
    const i = items.findIndex((x) => x.url === url);
    return { newer: items[i - 1], older: items[i + 1] };
  });
  cfg.addFilter("fallTarget", (items = [], url) => pick(items.filter((x) => x.url !== url), url || "home"));
  cfg.addFilter("makers", makers);
  cfg.addFilter("makerCount", (m = "") => String(m).split(/[\/&,+]|\band\b/).filter((s) => s.trim()).length);
  cfg.addFilter("absoluteUrl", (p = "/") => SITE.url.replace(/\/+$/, "") + "/" + String(p).replace(/^\/+/, ""));
  cfg.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  cfg.addFilter("json", (v) => JSON.stringify(v));
  cfg.addFilter("hex", (name) => colour(name));
  cfg.addFilter("inkFor", (name) => (contrast("hole", name) >= contrast("paper", name) ? "hole" : "paper"));
  cfg.addFilter("ratio", (pair) => contrast(pair[0], pair[1]).toFixed(1));
  cfg.addFilter("pad", (n, w = 2) => String(n).padStart(w, "0"));
  cfg.addFilter("count", (items = []) => items.length);
  cfg.addFilter("limit", (items = [], n) => items.slice(0, n));
  cfg.addFilter("titleCase", (s = "") => s.replace(/\b\w/g, (c) => c.toUpperCase()));
  cfg.addFilter("ogImage", (url = "/") => {
    const slug = url === "/" ? "home" : url.replace(/^\/|\/$/g, "").replace(/\//g, "--");
    return `/og/${slug}.png`;
  });

  // One stylesheet: generated tokens + the hand-written CSS, lightly minified.
  cfg.addFilter("cssBundle", () => {
    const css = tokensCss() + fs.readFileSync("src/assets/css/site.css", "utf8");
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>])\s*/g, "$1")
      .replace(/;}/g, "}")
      .trim();
  });

  // ── Shortcodes ───────────────────────────────────────────────────────────
  cfg.addAsyncShortcode("photo", photo);
  cfg.addAsyncShortcode("photoShape", async (src) => (await photoShape(src)).shape);
  cfg.addShortcode("mark", (o = {}) => markSvg(o));
  cfg.addShortcode("madeBy", (maker, cls) => madeBySvg(maker, cls));
  cfg.addShortcode("telugu", (height = 40, cls = "telugu-art") => {
    const t = teluguPath(height);
    return `<svg class="${cls}" viewBox="0 0 ${t.width.toFixed(1)} ${height}" role="img" aria-label="${t.text} (kundelu bokka, rabbit hole)"><path d="${t.d}" transform="${t.transform}" fill="currentColor"/></svg>`;
  });

  cfg.on("eleventy.after", afterBuild);

  return {
    dir: { input: ".", includes: "src/_includes", data: "src/_data", output: "_site" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
