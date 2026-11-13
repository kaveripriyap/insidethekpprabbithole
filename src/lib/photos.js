// Photos: find them in /photos, turn them into small fast responsive images.
import fs from "node:fs";
import path from "node:path";
import Image, { generateHTML } from "@11ty/eleventy-img";

export const PHOTO_DIR = "photos";
const OUT_DIR = "_site/img/";

// Big source photos (one is 200 megapixels) are memory hungry. Keep it civil.
Image.concurrency = 4;

const escape = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Accepts "photo.jpg", "/photos/photo.jpg", "/assets/uploads/photo.jpg"… returns the file path. */
export function resolvePhoto(src, where = "") {
  if (!src) throw new Error(`[photos] An image is missing its "src" ${where}`);
  if (/^https?:\/\//.test(src)) return src;
  const file = path.basename(String(src).trim());
  const full = path.join(PHOTO_DIR, file);
  if (!fs.existsSync(full)) {
    const near = fs.readdirSync(PHOTO_DIR).filter((f) => f.toLowerCase() === file.toLowerCase());
    throw new Error(
      `[photos] Can't find "${file}" in the photos folder ${where}.` +
        (near.length ? ` Did you mean "${near[0]}"? File names are case-sensitive.` : " Check the spelling, and that the photo was added to /photos.")
    );
  }
  return full;
}

const isGif = (p) => /\.gif$/i.test(p);

function options(file, widths, animated = false) {
  return {
    widths: animated ? [480] : widths,
    formats: animated ? ["webp"] : ["avif", "jpeg"],
    outputDir: OUT_DIR,
    urlPath: "/img/",
    sharpOptions: animated ? { animated: true } : {},
    sharpAvifOptions: { quality: 52, effort: 3 },
    sharpJpegOptions: { quality: 76, mozjpeg: true, progressive: true },
    sharpWebpOptions: { quality: 55, effort: 4 },
  };
}

export const SIZES = {
  card: [320, 640, 960],
  hero: [200, 400],
  full: [480, 800, 1200, 1800],
};

/** Raw metadata, for things like social cards. */
export async function photoMeta(src, preset = "full") {
  const file = resolvePhoto(src);
  return Image(file, options(file, SIZES[preset] || SIZES.full));
}

/**
 * <picture> markup. Nunjucks: {% photo src, alt, "card", "(min-width: 60em) 30vw, 50vw", { class: "x" } %}
 */
export async function photo(src, alt, preset = "full", sizes = "100vw", attrs = {}) {
  if (alt === undefined || alt === null) {
    throw new Error(`[photos] "${src}" needs alt text. Add an "alt:" line describing the photo.`);
  }
  const file = resolvePhoto(src);
  const metadata = await Image(file, options(file, SIZES[preset] || SIZES.full));
  const { class: cls, loading = "lazy", fetchpriority, ...rest } = attrs || {};
  const imgAttrs = {
    alt: String(alt),
    sizes,
    loading,
    decoding: loading === "eager" ? "sync" : "async",
    ...rest,
  };
  if (fetchpriority) imgAttrs.fetchpriority = fetchpriority;
  if (cls) imgAttrs.class = cls;
  const html = generateHTML(metadata, imgAttrs, { whitespaceMode: "inline" });
  // Animated GIFs: show a still first (fast), play the animation on request.
  if (isGif(file) && preset === "full") {
    const anim = await Image(file, options(file, [], true));
    const url = anim.webp[0].url;
    return `<span class="anim" data-anim="${url}">${html}<button type="button" class="anim__play" hidden><span aria-hidden="true">▶</span> Play</button></span>`;
  }
  return html;
}

/** Width/height after EXIF rotation, without making any files. */
export async function photoShape(src) {
  const file = resolvePhoto(src);
  const m = await Image(file, { ...options(file, [320]), statsOnly: true });
  const first = Object.values(m)[0][0];
  const ratio = first.width / first.height;
  return { width: first.width, height: first.height, shape: ratio > 1.15 ? "wide" : ratio < 0.87 ? "tall" : "square" };
}

export { escape };
