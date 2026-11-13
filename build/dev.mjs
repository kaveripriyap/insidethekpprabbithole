// npm run dev  →  builds, serves http://localhost:8080 with the same security
// headers as the live site, and rebuilds when you change anything.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { r } from './lib/util.mjs';

const dist = r('dist'), port = process.env.PORT || 8080;
const toml = fs.readFileSync(r('netlify.toml'), 'utf8');
const csp = (toml.match(/Content-Security-Policy = "([^"]+)"/) || [])[1] || '';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.stl': 'model/stl', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4' };
let building = false, again = false;
function build() {
  if (building) { again = true; return; }
  building = true;
  const p = spawn(process.execPath, [r('build', 'build.mjs'), ...process.argv.slice(2)], { stdio: 'inherit' });
  p.on('exit', () => { building = false; if (again) { again = false; build(); } });
}
build();
let t;
for (const d of ['src', 'content', 'design', 'photos', 'build']) if (fs.existsSync(r(d))) fs.watch(r(d), { recursive: true }, () => { clearTimeout(t); t = setTimeout(build, 250); });
fs.watch(r('site.yaml'), () => { clearTimeout(t); t = setTimeout(build, 250); });

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(dist, p);
  if (!file.startsWith(dist)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  let status = 200;
  if (!fs.existsSync(file)) { file = path.join(dist, '404.html'); status = 404; }
  if (!fs.existsSync(file)) { res.writeHead(503); res.end('Building…'); return; }
  res.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`\n  http://localhost:${port}\n`));
