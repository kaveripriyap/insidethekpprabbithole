// Reads design/tokens.yaml and turns it into CSS custom properties, contrast
// checks and colour lookups. Nothing about the look is decided in code.
import fs from "node:fs";
import yaml from "js-yaml";

export const TOKENS = yaml.load(fs.readFileSync("design/tokens.yaml", "utf8"));

export function colour(v) {
  if (!v) return v;
  if (String(v).startsWith("#")) return v;
  const c = TOKENS.colours[v] || TOKENS.colours[TOKENS.roles?.[v]];
  if (!c) throw new Error(`[tokens] Unknown colour "${v}". Use a name from design/tokens.yaml.`);
  return c.hex;
}

function lum(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [l1, l2] = [lum(colour(a)), lum(colour(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function contrastReport() {
  return (TOKENS["contrast-pairs"] || []).map(([fg, bg]) => {
    const ratio = contrast(fg, bg);
    return { fg, bg, ratio: Math.round(ratio * 100) / 100, aa: ratio >= 4.5, aaa: ratio >= 7, large: ratio >= 3 };
  });
}

export function tokensCss() {
  const t = TOKENS;
  const lines = [];
  for (const [k, c] of Object.entries(t.colours)) lines.push(`--c-${k}:${c.hex};`);
  for (const [k, v] of Object.entries(t.roles)) lines.push(`--${k}:var(--c-${v});`);
  for (const [k, f] of Object.entries(t.type)) lines.push(`--font-${k}:"${f.family}",${f.fallback};`);
  for (const [k, v] of Object.entries(t.size)) lines.push(`--step-${k.replace("-", "n")}:${v};`);
  for (const [k, v] of Object.entries(t.space)) lines.push(`--space-${k}:${v};`);
  for (const [k, v] of Object.entries(t.radius)) lines.push(`--radius-${k}:${v};`);
  for (const [k, v] of Object.entries(t.motion)) lines.push(`--motion-${k}:${v};`);
  const faces = Object.values(t.type)
    .map((f) => `@font-face{font-family:"${f.family}";src:url(/fonts/${f.file}) format("woff2");font-weight:${f.weights};font-display:swap;}`)
    .join("");
  // a helper class per colour so templates can paint things without inline styles
  const paint = Object.keys(t.colours)
    .map((k) => `.paint-${k}{--paint:var(--c-${k});}.ink-${k}{color:var(--c-${k});}`)
    .join("");
  const steps = Object.keys(t.size)
    .map((k) => `.fs-${k.replace("-", "n")}{font-size:var(--step-${k.replace("-", "n")});}`)
    .join("");
  return `${faces}:root{${lines.join("")}}${paint}${steps}`;
}

// Refuse to build if a promised colour pair stops being readable.
for (const r of contrastReport()) {
  if (!r.aa) throw new Error(`[tokens] ${r.fg} on ${r.bg} is only ${r.ratio}:1. WCAG AA needs 4.5:1. Adjust design/tokens.yaml.`);
}
