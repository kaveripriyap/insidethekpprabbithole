// Shared pieces every page is built from.
import { esc, html, titleCase } from '../lib/util.mjs';
import { markSvg } from '../lib/mark.mjs';
import { hashStr } from '../lib/content.mjs';

export const ROOMS = [
  { key: 'fall', href: '/', label: 'The Fall', hint: 'the long way in' },
  { key: 'cabinet', href: '/things/', label: 'The Cabinet', hint: 'everything, one drawer each' },
  { key: 'shop', href: '/shop/', label: 'Gift Shop', hint: 'things you can take home' },
  { key: 'curators', href: '/about/', label: 'The Curators', hint: 'the two of us' },
];

const makerLine = (lit, tokens) => lit === 'both' ? `${tokens.makers.kinnera.name} and ${tokens.makers.kaveri.name}` : tokens.makers[lit]?.name || 'the rabbit hole';

// The credit: a small mark whose lit ear says who made it.
export function ears(lit, tokens, { text = false, cls = '' } = {}) {
  const who = makerLine(lit, tokens);
  return `<span class="credit ${cls}" data-lit="${lit}">${markSvg({ lit, cls: 'mark mark--credit' })}<span class="${text ? 'credit__who' : 'sr'}">${text ? '' : 'Made by '}${esc(who)}</span></span>`;
}
export { makerLine };

// A photo. mode: 'graded' (default) or 'true'.
export function pic(p, { sizes = '100vw', cls = '', lazy = true, alt = null, max = 1920, fetch = null, swap = false } = {}) {
  const set = list => list.filter(s => s.w <= max || s === list[0]).map(s => `${s.url} ${s.w}w`).join(', ');
  const a = alt === null ? p.alt : alt;
  const swapAttrs = swap ? ` data-graded="${set(p.graded)}" data-true="${set(p.true)}" data-full="${p.full}"` : '';
  return `<img class="ph ph-${p.id} ${cls}" src="${p.jpg}" srcset="${set(p.graded)}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(a)}"${lazy ? ' loading="lazy"' : ''}${fetch ? ` fetchpriority="${fetch}"` : ''} decoding="async"${swapAttrs}>`;
}

// For a thing with no photo at all: a drawn stand-in, never a fake photo.
export function noPhoto(t, cls = '') {
  return `<span class="ph ph--none ${cls}" role="img" aria-label="No photograph yet of ${esc(t.title)}">${markSvg({ lit: t.lit, cls: 'mark mark--ghost' })}<span class="ph--none__note">not yet photographed</span></span>`;
}

// Storybook titles: one or two letters in each title refuse to behave.
export function wonky(title, seed = hashStr(title)) {
  const words = String(title).split(/\s+/).filter(Boolean);
  const letters = [];
  words.forEach((w, wi) => [...w].forEach((ch, ci) => { if (/[a-z]/i.test(ch)) letters.push([wi, ci]); }));
  const picks = new Map();
  const n = letters.length > 14 ? 2 : letters.length > 3 ? 1 : 0;
  const kinds = ['w-up', 'w-tilt', 'w-big', 'w-drop', 'w-lean'];
  for (let i = 0; i < n; i++) {
    const [wi, ci] = letters[(seed >>> (i * 7)) % letters.length];
    picks.set(`${wi}.${ci}`, kinds[(seed >>> (i * 5 + 3)) % kinds.length]);
  }
  const inner = words.map((w, wi) => `<span class="w">${[...w].map((ch, ci) => picks.has(`${wi}.${ci}`) ? `<span class="${picks.get(`${wi}.${ci}`)}">${esc(ch)}</span>` : esc(ch)).join('')}</span>`).join(' ');
  return `<span class="wonky" aria-hidden="true">${inner}</span><span class="sr">${esc(title)}</span>`;
}

// One drawer of the Cabinet: used on every listing.
export function drawer(t, tokens, { sizes = '(min-width: 1100px) 22vw, (min-width: 700px) 30vw, 46vw', lazy = true, h = 'h2' } = {}) {
  const search = [t.title, t.note, ...t.kind, ...t.madeWith, ...t.tags, ...t.makers, t.year, t.acc].join(' ').toLowerCase().replace(/-/g, ' ');
  return html`<li class="drawer a-${t.slug}" data-slug="${t.slug}" data-kind="${t.kind.join(' ')}" data-with="${t.madeWith.join(' ')}" data-tag="${t.tags.join(' ')}" data-by="${t.lit}" data-year="${t.year}" data-sale="${t.forSale ? 1 : 0}" data-date="${t.date}" data-title="${esc(t.title.toLowerCase())}" data-search="${esc(search)}">
<a class="drawer__link" href="${t.url}" data-lit="${t.lit}">
<span class="drawer__window">${t.lead ? pic(t.lead, { sizes, cls: 'drawer__ph', lazy, max: 1280 }) : noPhoto(t, 'drawer__ph')}</span>
<span class="drawer__plate"><span class="drawer__acc">${t.acc}</span><${h} class="drawer__title">${esc(t.title)}</${h}>${ears(t.lit, tokens)}${t.forSale ? `<span class="drawer__price">${t.soldOut ? 'sold' : esc(t.price || 'for sale')}</span>` : ''}</span>
<span class="drawer__note">${esc(t.note)}</span>
<span class="drawer__meta">${[...t.kind, ...t.madeWith].slice(0, 4).map(k => esc(titleCase(k))).join(' · ')}</span>
</a></li>`;
}

export function chip(label, href, { count = null, cls = '', attrs = '' } = {}) {
  return `<a class="chip ${cls}" href="${href}" ${attrs}>${esc(label)}${count !== null ? `<span class="chip__n">${count}</span>` : ''}</a>`;
}

export function shell({ site, tokens, assets, page }) {
  const { title, description = site.description, path, room = '', lit = 'none', bodyClass = '', main, scripts = [], image = null, noindex = false, jsonld = null, theme = 'page', preloadImage = null } = page;
  const canonical = site.url.replace(/\/+$/, '') + path;
  const fullTitle = path === '/' ? `${site.title} · ${site.line}` : `${title} · ${site.title}`;
  const og = image ? (image.startsWith('http') ? image : site.url.replace(/\/+$/, '') + image) : site.url.replace(/\/+$/, '') + assets.social;
  const rooms = ROOMS.filter(rm => rm.key !== 'shop' || site._hasShop);
  return html`<!doctype html>
<html lang="en" class="no-js" data-room="${room}" data-lit="${lit}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta name="theme-color" content="${theme === 'deep' ? tokens.colour.burrow.value : tokens.colour.page.value}">
<meta property="og:title" content="${esc(path === '/' ? site.title : title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:type" content="${room === 'exhibit' ? 'article' : 'website'}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(site.title)}" href="/feed.xml">
<link rel="preload" href="${assets.fonts.story}" as="font" type="font/woff2" crossorigin>
${preloadImage || ''}
<link rel="stylesheet" href="${assets.css}">
<noscript><link rel="stylesheet" href="/assets/nojs.css"></noscript>
<script type="module" src="${assets.js.site}"></script>
${scripts.map(s => `<script type="module" src="${assets.js[s]}"></script>`)}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body class="theme-${theme} ${bodyClass}">
<a class="skip" href="#main">Skip to the things</a>
<header class="top">
<a class="top__home" href="/" aria-label="${esc(site.shop_name)}, home">${markSvg({ lit: 'both', cls: 'mark mark--top' })}<span class="top__name">the <b>KPP</b> rabbit hole</span></a>
<nav class="top__rooms" aria-label="Rooms">
${rooms.map(rm => `<a href="${rm.href}"${rm.key === room || (rm.key === 'cabinet' && (room === 'exhibit' || room === 'drawer')) ? ' aria-current="' + (rm.key === room ? 'page' : 'true') + '"' : ''}>${rm.label}</a>`)}
</nav>
<form class="top__find" action="/things/" method="get" role="search">
<label class="sr" for="top-q">Find a thing</label>
<input id="top-q" name="q" type="search" placeholder="Ask for a thing&hellip;" autocomplete="off" enterkeyhint="search">
<button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg></button>
</form>
<a class="top__surprise" href="/surprise/" data-surprise>Surprise me</a>
</header>
<main id="main" tabindex="-1">
${main}
</main>
<footer class="foot">
<div class="foot__in">
<div class="foot__mark">${markSvg({ lit: 'both', cls: 'mark mark--foot' })}<p class="foot__line">${esc(site.tagline)}</p></div>
<nav class="foot__rooms" aria-label="All rooms">
<a href="/">The Fall</a><a href="/things/">The Cabinet</a><a href="/shop/">Gift Shop</a><a href="/about/">The Curators</a><a href="/brand/">The Mark</a><a href="/surprise/" data-surprise>Surprise me</a>
</nav>
<div class="foot__notes">
<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
${site.etsy ? `<p><a href="${esc(site.etsy)}" rel="noopener">${esc(site.shop_name)} on Etsy</a></p>` : ''}
${site.instagram ? `<p><a href="${esc(site.instagram)}" rel="noopener">Instagram</a></p>` : ''}
<p class="foot__size"><span id="size-label">Text size</span> <button type="button" class="sizer" data-size="-1" aria-label="Shrink me: make the words smaller">shrink me</button> <button type="button" class="sizer" data-size="1" aria-label="Grow me: make the words bigger">grow me</button></p>
</div>
<p class="foot__small">Made by two sisters. Left ear lit: ${tokens.makers.kinnera.name}. Right ear lit: ${tokens.makers.kaveri.name}. Both lit: both of us.</p>
</div>
</footer>
<nav class="tabbar" aria-label="Quick rooms">
<a href="/"${room === 'fall' ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="17" rx="9" ry="3.2"/><path d="M12 3v9m-3.5-3.5L12 12l3.5-3.5"/></svg>Fall</a>
<a href="/things/"${room === 'cabinet' ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17"/><path d="M4 9h16M4 15h16M10.5 6.2h3M10.5 12h3M10.5 17.8h3"/></svg>Cabinet</a>
<a href="/things/#find" data-find><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>Find</a>
<a href="/surprise/" data-surprise><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 9.2a3 3 0 1 1 4.3 2.7c-1 .6-1.5 1.2-1.5 2.4M12 18v.4"/><circle cx="12" cy="12" r="9.5"/></svg>Surprise</a>
<a href="/about/"${room === 'curators' ? ' aria-current="page"' : ''}>${markSvg({ lit: 'both', cls: 'mark mark--tab' })}Us</a>
</nav>
</body>
</html>`;
}
