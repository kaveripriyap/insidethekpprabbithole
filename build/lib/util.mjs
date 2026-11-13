import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const r = (...p) => path.join(ROOT, ...p);

export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slugify = (s = '') => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const titleCase = (s = '') => String(s).replace(/-/g, ' ').replace(/\b3d\b/gi, '3D').replace(/\bled(s?)\b/gi, 'LED$1')
  .replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());

export function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}
export function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

// Tagged template: html`...` joins arrays and drops null/false. Values are NOT
// auto-escaped (templates nest); use esc() on anything that came from content.
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) {
      const v = vals[i];
      out += Array.isArray(v) ? v.join('') : (v === null || v === undefined || v === false) ? '' : v;
    }
  });
  return out;
}
