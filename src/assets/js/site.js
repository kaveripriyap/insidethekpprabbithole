// Inside the KPP Rabbit Hole. Small, optional, and everything works without it.
const root = document.documentElement;
root.classList.replace("no-js", "js");
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const store = (() => {
  try {
    const k = "__kpp";
    sessionStorage.setItem(k, k);
    sessionStorage.removeItem(k);
    return sessionStorage;
  } catch {
    return null;
  }
})();

/* ── 1. The fall: scroll progress through the hero, as --p (0 → 1) ───────── */
const fall = document.querySelector("[data-fall]");
if (fall && !CSS.supports("animation-timeline: view()")) {
  let ticking = false;
  const update = () => {
    ticking = false;
    if (calm.matches) return fall.style.setProperty("--p", "0");
    const r = fall.getBoundingClientRect();
    const run = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (run || 1)));
    fall.style.setProperty("--p", p.toFixed(4));
  };
  addEventListener("scroll", () => ticking || ((ticking = true), requestAnimationFrame(update)), { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
}

/* ── 2. The ears notice you ──────────────────────────────────────────────── */
const earSets = [...document.querySelectorAll("[data-ears]")];
if (earSets.length && !calm.matches) {
  let raf = 0, px = 0, py = 0;
  const aim = () => {
    raf = 0;
    for (const el of earSets) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const dx = (px - (r.left + r.width / 2)) / Math.max(r.width, 300);
      const dy = (py - (r.top + r.height * 0.7)) / Math.max(r.height, 300);
      const lean = Math.max(-1, Math.min(1, dx)) * 16;
      const perk = dy < 0 ? Math.max(-1, dy) * 6 : 0;
      el.style.setProperty("--ear-l", `${(lean - perk).toFixed(1)}deg`);
      el.style.setProperty("--ear-r", `${(lean + perk).toFixed(1)}deg`);
    }
  };
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      raf ||= requestAnimationFrame(aim);
    },
    { passive: true }
  );
  for (const el of earSets) {
    el.addEventListener("pointerdown", () => {
      el.classList.remove("is-wiggling");
      void el.offsetWidth;
      el.classList.add("is-wiggling");
    });
  }
}

/* ── 3. Four cities, two sisters ─────────────────────────────────────────── */
const moods = (h) =>
  h < 6 ? "asleep, probably" : h < 9 ? "making coffee" : h < 18 ? "making things" : h < 23 ? "making more things" : "should be asleep";
const cities = [...document.querySelectorAll("[data-tz]")];
const tick = () => {
  for (const c of cities) {
    try {
      const tz = c.dataset.tz;
      const t = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
      const h = parseInt(t, 10);
      c.querySelector("[data-time]").textContent = t;
      c.querySelector("[data-mood]").textContent = moods(h);
      c.classList.toggle("is-night", h < 6 || h >= 23);
    } catch {}
  }
};
if (cities.length) {
  tick();
  setInterval(tick, 30_000);
}

/* ── 4. How deep are you? ────────────────────────────────────────────────── */
const SEEN = "kpp:seen";
const seen = new Set(JSON.parse(store?.getItem(SEEN) || "[]"));
const here = document.querySelector("[data-find]");
if (here) {
  seen.add(here.dataset.find);
  store?.setItem(SEEN, JSON.stringify([...seen]));
}
let finds;
const getFinds = () => (finds ||= fetch("/finds.json").then((r) => r.json()).catch(() => ({})));

const badge = document.querySelector("[data-depth]");
const lines = document.querySelectorAll("[data-depth-line]");
if (seen.size) {
  getFinds().then((all) => {
    const list = all.things || [];
    const total = list.length;
    const n = list.filter((f) => seen.has(f.url)).length;
    if (badge && n) {
      badge.hidden = false;
      badge.querySelector("[data-depth-num]").textContent = n;
      badge.querySelector("[data-depth-total]").textContent = total;
    }
    const left = total - n;
    const msg =
      n === 0 ? null : left <= 0 ? `You've seen all ${total}. You hit the bottom. Keep falling anyway?` : `You're ${n} find${n === 1 ? "" : "s"} deep. ${left} still down there.`;
    if (msg) lines.forEach((l) => (l.textContent = msg));
  });
}

/* ── 5. Fall deeper: a random find you haven't seen ─────────────────────── */
document.addEventListener("click", async (e) => {
  const a = e.target.closest("[data-fall-deeper]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const all = await getFinds();
  const list = (all[a.dataset.shelf || "things"] || []).filter((f) => f.url !== location.pathname);
  const fresh = list.filter((f) => !seen.has(f.url));
  const pool = fresh.length ? fresh : list;
  const next = pool[Math.floor(Math.random() * pool.length)];
  const go = () => (location.href = next ? next.url : a.href);
  if (calm.matches || !document.startViewTransition) return go();
  root.classList.add("is-falling");
  setTimeout(go, 380);
});
addEventListener("pageshow", () => root.classList.remove("is-falling"));

/* ── 6. Animated photos play when asked (they're heavy) ─────────────────── */
for (const box of document.querySelectorAll("[data-anim]")) {
  const btn = box.querySelector(".anim__play");
  const img = box.querySelector("img");
  if (!btn || !img) continue;
  btn.hidden = false;
  btn.addEventListener("click", () => {
    box.querySelectorAll("source").forEach((s) => s.remove());
    img.removeAttribute("srcset");
    img.src = box.dataset.anim;
    btn.remove();
  });
}
