// Every page type on the site. Each function returns the settings for shell().
import { esc, html, titleCase, plural } from '../lib/util.mjs';
import { markSvg } from '../lib/mark.mjs';
import { contrast } from '../lib/colour.mjs';
import { ears, pic, noPhoto, wonky, drawer, chip, makerLine } from './parts.mjs';
import { critterSprite, critterSvg, CRITTERS } from './critters.mjs';

const pickNote = (site, seed) => (site.margin_notes || [])[seed % Math.max(1, (site.margin_notes || []).length)] || '';
const door = (label = '') => `<svg class="door__svg" viewBox="0 0 60 90" aria-hidden="true"><path class="door__frame" d="M6 88V30C6 14 16 4 30 4s24 10 24 26v58Z"/><path class="door__leaf" d="M11 88V31c0-13 8-22 19-22s19 9 19 22v57Z"/><path class="door__panel" d="M17 46h26v14H17zM17 66h26v16H17zM18 38c0-9 5-16 12-16s12 7 12 16Z"/><circle class="door__knob" cx="42" cy="62" r="2.2"/></svg>${label}`;

// ── THE FALL (home) ─────────────────────────────────────────────────────────
export function homePage({ site, tokens, things, facets }) {
  const max = site.fall_max || 48;
  const real = things.filter(t => t.lead);
  let chosen = real;
  if (real.length > max) {
    const years = [...new Set(real.map(t => t.year))];
    chosen = years.flatMap(y => { const g = real.filter(t => t.year === y); return g.slice(0, Math.max(1, Math.round(max * g.length / real.length))); });
    const oldest = real[real.length - 1];
    if (!chosen.includes(oldest)) chosen.push(oldest);
  }
  const years = [...new Set(chosen.map(t => t.year))];
  const asides = site.asides || [];
  let i = 0;
  const items = years.map((y, yi) => {
    const group = chosen.filter(t => t.year === y), all = things.filter(t => t.year === y).length;
    return html`<li class="stratum" id="y-${y}" data-year="${y}"><h2 class="stratum__year"><span aria-hidden="true">${y}</span><span class="sr">Things from ${y}</span></h2><a class="stratum__all" href="/year/${y}/">${plural(all, 'thing')} from ${y}</a></li>
${yi > 0 && asides.length ? `<li class="aside" aria-hidden="false"><p class="hand">${esc(asides[(yi - 1) % asides.length])}</p></li>` : ''}
${group.map(t => {
      const n = i++;
      const scale = n > 0 && t.seed % 7 === 0 ? 'giant' : n > 1 && t.seed % 5 === 0 ? 'tiny' : 'usual';
      return html`<li class="drop drop--${scale} drop--${t.lead.orientation} a-${t.slug}" data-year="${y}" data-seed="${t.seed % 1000}">
<a class="drop__link" href="${t.url}" data-lit="${t.lit}">
<span class="drop__frame">${pic(t.lead, { sizes: '(min-width: 900px) 34vw, 72vw', cls: 'drop__ph', lazy: n > 1, max: 1280, fetch: n === 0 ? 'high' : null })}</span>
<span class="drop__tag"><span class="drop__acc">${t.acc}</span><span class="drop__title">${esc(t.title)}</span>${ears(t.lit, tokens)}</span>
${t.note ? `<span class="drop__note">${esc(t.note)}</span>` : ''}
${scale === 'tiny' ? '<span class="drop__hand hand" aria-hidden="true">look closer</span>' : scale === 'giant' ? '<span class="drop__hand hand" aria-hidden="true">larger than life</span>' : ''}
</a></li>`;
    })}`;
  });
  const oldest = real[real.length - 1];
  const curators = site._curators;
  const critters = Array.from({ length: 11 }, (_, k) => `<li class="critter" aria-hidden="true" data-k="${k}"><svg viewBox="0 0 48 48"><use href="#c-${CRITTERS[k % CRITTERS.length]}"/></svg></li>`);
  const main = html`<div class="fall" data-fall>
${critterSprite()}
<div class="fall__shaft">
<div class="fall__stage">
<section class="surface" aria-labelledby="surface-title">
<div class="motes" aria-hidden="true">${'<i></i>'.repeat(16)}</div>
<p class="surface__kicker label">${esc(site.title)}</p>
<h1 class="surface__title" id="surface-title">${wonky(site.line, 9)}</h1>
<p class="surface__intro">${esc(site.intro)}</p>
<div class="doors">
<a class="btn btn--fall" href="#y-${years[0]}" data-fall-in><span>Fall in</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v17m-6-6 6 6 6-6"/></svg></a>
<a class="btn btn--quiet" href="/things/">Skip the fall<small>straight to the Cabinet</small></a>
<a class="btn btn--quiet" href="/surprise/" data-surprise>Surprise me<small>any one thing</small></a>
</div>
</section>
<div class="rim" aria-hidden="true">${markSvg({ lit: 'both', cls: 'mark mark--rim' })}<span class="rim__hand hand">it's bigger inside</span></div>
<div class="well">
<canvas class="well__gl" aria-hidden="true"></canvas>
<ol class="well__things">
${items}
${critters}
</ol>
</div>
</div>
</div>
<nav class="gauge" aria-label="How deep you are">
<a class="gauge__top" href="#main" data-depth="0">surface</a>
<ol>${years.map(y => `<li><a href="#y-${y}" data-year="${y}">${y}</a></li>`)}</ol>
<a class="gauge__bottom" href="#bottom">bottom</a>
<span class="gauge__pip" aria-hidden="true"></span>
</nav>
<section class="bottom" id="bottom" aria-labelledby="bottom-title">
<p class="hand bottom__hand">you have reached the bottom</p>
<h2 class="bottom__title" id="bottom-title">${wonky('The bottom of the hole is where it started.', 4)}</h2>
${oldest ? html`<div class="bottom__first a-${oldest.slug}">
<a class="bottom__firstlink" href="${oldest.url}" data-lit="${oldest.lit}">${pic(oldest.lead, { sizes: '(min-width: 800px) 300px, 60vw', cls: 'bottom__ph', max: 800 })}</a>
<p class="label">The first thing down here &middot; ${oldest.acc}</p>
<p class="bottom__firsttitle"><a href="${oldest.url}">${esc(oldest.title)}</a>, ${oldest.year}</p>
${oldest.note ? `<p class="voice">&ldquo;${esc(oldest.note)}&rdquo;</p>` : ''}
</div>` : ''}
<div class="bottom__doors">
<a class="door" href="/things/">${door()}<span class="door__label hand">everything is through here</span><span class="door__name">The Cabinet <small>${plural(things.length, 'thing')}, one drawer each</small></span></a>
<a class="door door--b" href="/about/">${door()}<span class="door__label hand">we live in here</span><span class="door__name">The Curators <small>two sisters, four cities</small></span></a>
<a class="door door--c" href="/surprise/" data-surprise>${door()}<span class="door__label hand">no idea what's in here</span><span class="door__name">Surprise me <small>any one thing</small></span></a>
</div>
<p><a class="btn btn--quiet btn--onDeep" href="#main" data-climb>Climb back out <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V4m-6 6 6-6 6 6"/></svg></a></p>
</section>
</div>`;
  const lead = chosen[0]?.lead;
  return { title: site.title, path: '/', room: 'fall', theme: 'deep', bodyClass: 'is-fall', main, scripts: ['fall'], lit: 'both',
    jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: site.title, url: site.url + '/', description: site.description, potentialAction: { '@type': 'SearchAction', target: site.url + '/things/?q={q}', 'query-input': 'required name=q' } } };
}

// ── THE CABINET (everything, with the finder) ───────────────────────────────
export function cabinetPage({ site, tokens, things, facets }) {
  const anySale = things.some(t => t.forSale);
  const facetHtml = facets.filter(f => f.values.length).map(f => {
    const chips = f.values.map(v => `<a class="chip" href="${v.url}" data-facet="${f.key}" data-value="${v.value}">${f.key === 'by' ? markSvg({ lit: v.value, cls: 'mark mark--chip' }) : ''}${esc(v.name)}<span class="chip__n">${v.count}</span></a>`);
    return `<div class="facet${f.key === 'tag' ? ' facet--more' : ''}" data-facet="${f.key}"><button type="button" class="facet__name" aria-expanded="false" aria-controls="facet-${f.key}"><span>${esc(f.label)}</span></button><div class="facet__chips" id="facet-${f.key}">${chips.join('')}</div></div>`;
  });
  const main = html`<section class="roomhead">
<p class="label">Everything, one drawer each</p>
<h1 class="roomhead__title">${wonky('The Cabinet', 11)}</h1>
<p class="voice">Pull any drawer. Or tell the Cabinet what you're after and it will fetch it.</p>
</section>
<form class="finder" id="find" action="/things/" method="get" role="search" data-finder>
<div class="finder__q">
<label for="q" class="label">Find a thing</label>
<input id="q" name="q" type="search" placeholder="earrings, a table, tentacles&hellip;" autocomplete="off" enterkeyhint="search">
<span class="finder__key" aria-hidden="true">press /</span>
</div>
<div class="finder__facets">
${facetHtml}
${anySale ? `<div class="facet" data-facet="sale"><button type="button" class="facet__name" aria-expanded="false" aria-controls="facet-sale"><span>To take home</span></button><div class="facet__chips" id="facet-sale"><a class="chip" href="/shop/" data-facet="sale" data-value="1">For sale</a></div></div>` : ''}
</div>
<div class="finder__bar">
<output class="finder__count" for="q" aria-live="polite">${plural(things.length, 'thing')}</output>
<span class="finder__tools">
<label class="sr" for="sort">Order</label>
<select id="sort" name="sort" class="finder__sort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="az">A to Z</option></select>
<span class="viewswitch" role="group" aria-label="Show as"><button type="button" data-view="drawers" aria-pressed="true">Drawers</button><button type="button" data-view="ledger" aria-pressed="false">Ledger</button></span>
<button type="button" class="linkish" data-clear hidden>Clear all</button>
<button type="button" class="linkish" data-copy>Copy link to this view</button>
<a class="linkish" href="/surprise/" data-surprise-here>Surprise me from these</a>
</span>
</div>
</form>
<ol class="drawers" data-drawers>
${things.map((t, i) => drawer(t, tokens, { lazy: i > 5 }))}
</ol>
<div class="finder__none" data-none hidden>
<p class="hand">the drawer is empty</p>
<p class="voice">We haven't made that yet. Give us time.</p>
<p><button type="button" class="btn btn--quiet" data-clear>Clear the finder</button></p>
</div>
<p class="morewrap"><button type="button" class="btn btn--quiet" data-more hidden>Pull out more drawers</button></p>`;
  return { title: 'The Cabinet', description: `Everything ${site.shop_name} has made: ${things.length} things, searchable by what they are, how they were made, who made them and when.`, path: '/things/', room: 'cabinet', theme: 'deep', main, scripts: ['cabinet'] };
}

// ── ONE DRAWER OF THE CABINET (a kind, a material, a tag, a maker, a year) ───
export function drawerRoomPage({ site, tokens, facet, value, facets }) {
  const things = value.items;
  const kindLine = { kind: 'What it is', with: 'How it was made', by: 'Who made it', year: 'When', tag: 'Also filed under' }[facet.key];
  const heading = facet.key === 'by' ? (value.value === 'both' ? 'Made by both of us' : `Made by ${value.name}`) : facet.key === 'year' ? `Made in ${value.name}` : facet.key === 'with' ? `Made with ${value.name}` : value.name;
  const main = html`<section class="roomhead">
<p class="crumbs"><a href="/things/" data-back>&larr; back to the Cabinet</a></p>
<p class="label">${kindLine}</p>
<h1 class="roomhead__title">${facet.key === 'by' ? markSvg({ lit: value.value, cls: 'mark mark--head' }) : ''}${wonky(heading)}</h1>
<p class="voice">${plural(things.length, 'thing')} in this drawer. <a href="/things/?${facet.key}=${encodeURIComponent(value.value)}">Open it in the Cabinet to narrow it down.</a></p>
</section>
<ol class="drawers">
${things.map((t, i) => drawer(t, tokens, { lazy: i > 5 }))}
</ol>
<section class="sibs" aria-label="Other drawers">
<p class="label">Other drawers: ${esc(facet.label.toLowerCase())}</p>
<p class="sibs__chips">${facet.values.filter(v => v !== value).slice(0, 40).map(v => chip(v.name, v.url, { count: v.count }))}</p>
</section>`;
  return { title: heading, description: `${plural(things.length, 'thing')} from ${site.shop_name}: ${heading.toLowerCase()}.`, path: value.url, room: 'drawer', theme: 'deep', main, lit: facet.key === 'by' ? value.value : 'none', image: things[0]?.lead?.jpg };
}

// ── AN EXHIBIT (one thing) ──────────────────────────────────────────────────
export function exhibitPage({ site, tokens, t, facets }) {
  const p = t.photos, lead = t.lead;
  const n = p.length;
  const shape = lead ? lead.orientation : 'portrait';
  const count = n <= 1 ? 'n1' : n === 2 ? 'n2' : n <= 4 ? 'n3' : 'many';
  const link = (base, v) => `<a class="chip chip--small" href="/${base}/${v}/">${esc(titleCase(v))}</a>`;
  const note = pickNote(site, t.seed);
  const caseImg = lead
    ? (lead.anim ? `<img class="ph ph-${lead.id} case__ph" src="${lead.anim.url}" width="${lead.w}" height="${lead.h}" alt="${esc(lead.alt)}" decoding="async" fetchpriority="high" data-full="${lead.full}">` : pic(lead, { sizes: shape === 'landscape' ? '(min-width: 1000px) 62vw, 94vw' : '(min-width: 1000px) 44vw, 94vw', cls: 'case__ph', lazy: false, fetch: 'high', swap: true }))
    : noPhoto(t, 'case__ph');
  const buyBlock = t.forSale ? html`<div class="buy" id="buy">
<p class="buy__price">${t.soldOut ? '<span class="buy__sold">Sold. For now.</span>' : esc(t.price || '')}</p>
${t.variants.length ? `<ul class="buy__variants">${t.variants.map(v => `<li>${v.buy && !v.sold_out ? `<a href="${esc(v.buy)}" rel="noopener">${esc(v.name)}</a>` : esc(v.name)}${v.price ? ` <span>${esc(v.price)}</span>` : ''}${v.sold_out ? ' <em>sold</em>' : ''}</li>`).join('')}</ul>` : ''}
${t.soldOut ? '' : t.buy ? `<a class="btn btn--buy" href="${esc(t.buy)}" rel="noopener">${esc(t.buyLabel || (/etsy\.com/.test(t.buy) ? 'Take one home (Etsy)' : 'Take one home'))}</a>` : `<a class="btn btn--buy" href="mailto:${esc(site.email)}?subject=${encodeURIComponent(t.title)}">Ask us about it</a>`}
</div>` : '';
  const figure = (ph, i, cls = '') => html`<figure class="plate ${cls} plate--${ph.orientation}">
<button type="button" class="plate__open" data-zoom="${i}" aria-label="Lean in: ${esc(ph.alt)}">${ph.anim ? `<img class="ph ph-${ph.id}" src="${ph.anim.url}" width="${ph.w}" height="${ph.h}" alt="${esc(ph.alt)}" loading="lazy" decoding="async" data-full="${ph.full}">` : pic(ph, { sizes: '(min-width: 1000px) 46vw, 94vw', swap: true })}</button>
${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ''}
</figure>`;
  const doorLink = (o, dir) => o
    ? `<a class="door door--room door--${dir}" href="${o.url}" data-lit="${o.lit}">${door()}<span class="door__label hand">${dir === 'up' ? 'a newer room' : 'an older room'}</span><span class="door__name">${esc(o.title)}</span></a>`
    : `<span class="door door--room door--shut door--${dir}">${door()}<span class="door__label hand">${dir === 'up' ? 'the surface' : 'the bottom'}</span><span class="door__name">${dir === 'up' ? 'Nothing newer. Yet.' : 'This is where it started.'}</span></span>`;
  const roomDoors = `<nav class="roomdoors" aria-label="The rooms next door">${doorLink(t.newer, 'up')}<span class="scurry" aria-hidden="true" data-scurry>${critterSvg(CRITTERS[t.seed % CRITTERS.length])}</span>${doorLink(t.older, 'down')}</nav>`;
  const main = html`<article class="exhibit exhibit--${shape} exhibit--${count} a-${t.slug}"${t.moment ? ` data-moment="${t.moment}"` : ''}>
<div class="room"><div class="room__in">
<p class="crumbs"><a href="/things/" data-back>&larr; back to the Cabinet</a><span class="crumbs__acc">Acc. No. ${t.acc}</span></p>
<div class="exhibit__top">
<div class="case" data-case>
<div class="case__glass">
${lead ? `<button type="button" class="case__open" data-zoom="0" aria-label="Lean in: see ${esc(t.title)} large and in true colour">${caseImg}</button>` : caseImg}
${t.moment ? '<canvas class="case__moment" aria-hidden="true"></canvas>' : ''}
</div>
${lead ? html`<div class="case__foot">
${lead.caption ? `<p class="case__caption">${esc(lead.caption)}</p>` : ''}
<p class="case__tools"><button type="button" class="toggle" data-truecolour aria-pressed="false"><span class="toggle__knob" aria-hidden="true"></span><span class="toggle__on">As shot</span><span class="toggle__off">House grade</span></button><span class="case__hint">Tap any photo to lean in. The close view is always true colour.</span></p>
</div>` : ''}
</div>
<header class="exhibit__words">
<h1 class="exhibit__title">${wonky(t.title, t.seed)}</h1>
${t.note ? `<p class="exhibit__note voice">${esc(t.note)}</p>` : ''}
<div class="placard">
<span class="placard__pin" aria-hidden="true"></span>
<dl>
<div><dt>Acc. No.</dt><dd>${t.acc}</dd></div>
<div><dt>Made by</dt><dd>${ears(t.lit, tokens, { text: true })}</dd></div>
<div><dt>Year</dt><dd><a href="/year/${t.year}/">${t.year}</a></dd></div>
${t.kind.length ? `<div><dt>What it is</dt><dd>${t.kind.map(k => link('kind', k)).join('')}</dd></div>` : ''}
${t.madeWith.length ? `<div><dt>Made with</dt><dd>${t.madeWith.map(k => link('made-with', k)).join('')}</dd></div>` : ''}
${t.tags.length ? `<div><dt>Also</dt><dd>${t.tags.map(k => link('tag', k)).join('')}</dd></div>` : ''}
</dl>
${note ? `<p class="placard__hand hand">${esc(note)}</p>` : ''}
</div>
${buyBlock}
<p class="exhibit__share"><button type="button" class="linkish" data-copy data-copy-url="${site.url}${t.url}">Copy a link to this</button>${t.download ? ` <a class="linkish" href="${esc(t.download)}" download>Download the files</a>` : ''}</p>
</header>
</div>
</div>
${roomDoors}
</div>
<div class="floor"><div class="floor__in">
${n > 1 ? `<section class="plates plates--${count}" aria-label="More photographs">${p.slice(1).map((ph, i) => figure(ph, i + 1)).join('')}</section>` : ''}
${t.model ? `<section class="block block--model" aria-labelledby="model-h"><h2 id="model-h" class="block__h">Turn it around</h2><div class="model" data-model="${t.model.src}" data-model-type="${t.model.type}"><button type="button" class="btn btn--quiet" data-model-load>Pick it up</button><p class="model__hint hand">drag to turn, pinch or scroll to lean in</p></div><p class="block__small">This is the 3D model it was made from, not a photograph. Colour is for show.</p></section>` : ''}
${t.video ? `<section class="block block--video" aria-labelledby="video-h"><h2 id="video-h" class="block__h">See it move</h2>${t.video.type === 'file' ? `<video class="video" controls preload="none" playsinline${lead ? ` poster="${lead.jpg}"` : ''} src="${esc(t.video.src)}"></video>` : `<div class="video video--embed"><button type="button" class="btn btn--quiet" data-embed="${t.video.type}" data-embed-id="${esc(t.video.id)}">Play the film</button></div>`}</section>` : ''}
${t.story ? `<section class="block block--story" aria-labelledby="story-h"><h2 id="story-h" class="block__h">The story</h2><div class="prose">${t.story}</div></section>` : ''}
${t.specs.length || t.parts.length ? `<section class="block block--facts">${t.specs.length ? `<div><h2 class="block__h">Particulars</h2><dl class="specs">${t.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>` : ''}${t.parts.length ? `<div><h2 class="block__h">Made with</h2><ul class="parts">${t.parts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</section>` : ''}
${t.related.length ? `<section class="morelike" aria-labelledby="more-h"><h2 id="more-h" class="morelike__h">${wonky('More like this', 2)}</h2><p class="hand morelike__hand">from nearby drawers</p><ol class="drawers drawers--row">${t.related.map(o => drawer(o, tokens, { sizes: '(min-width: 900px) 22vw, 46vw', h: 'h3' })).join('')}</ol><p class="morelike__all"><a class="btn btn--quiet" href="/things/">Open the whole Cabinet</a> <a class="btn btn--quiet" href="/surprise/" data-surprise>Surprise me</a></p></section>` : ''}
</div></div>
${lead ? `<dialog class="lean" data-lean aria-label="Close view"><form method="dialog"><button class="lean__close" aria-label="Step back">Step back</button></form><button type="button" class="lean__nav lean__nav--prev" data-lean-prev aria-label="Previous photograph">&larr;</button><figure class="lean__fig"><img class="lean__img" alt="" data-lean-img><figcaption class="lean__cap" data-lean-cap></figcaption></figure><button type="button" class="lean__nav lean__nav--next" data-lean-next aria-label="Next photograph">&rarr;</button><p class="lean__true label">true colour, as shot</p></dialog>
<script type="application/json" data-photos>${JSON.stringify(p.map(ph => ({ full: ph.full, w: ph.w, h: ph.h, alt: ph.alt, caption: ph.caption }))).replace(/</g, '\\u003c')}</script>` : ''}
</article>`;
  const who = makerLine(t.lit, tokens);
  const jsonld = {
    '@context': 'https://schema.org', '@type': t.forSale ? 'Product' : 'CreativeWork', name: t.title, description: t.note || undefined, url: site.url + t.url,
    image: p.map(ph => site.url + ph.jpg), ...(t.forSale ? { brand: { '@type': 'Brand', name: site.shop_name } } : { creator: t.makers.map(m => ({ '@type': 'Person', name: tokens.makers[m].name })), dateCreated: String(t.year) }),
    ...(t.forSale && t.price && /[\d.]+/.test(t.price) ? { offers: { '@type': 'Offer', price: t.price.match(/[\d.]+/)[0], priceCurrency: /€/.test(t.price) ? 'EUR' : /£/.test(t.price) ? 'GBP' : /S\$|SGD/.test(t.price) ? 'SGD' : /₹/.test(t.price) ? 'INR' : 'USD', availability: t.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', url: t.buy || site.url + t.url } } : {}),
  };
  const preloadImage = lead && !lead.anim ? `<link rel="preload" as="image" imagesrcset="${lead.graded.map(s => `${s.url} ${s.w}w`).join(', ')}" imagesizes="${shape === 'landscape' ? '(min-width: 1000px) 62vw, 94vw' : '(min-width: 1000px) 44vw, 94vw'}" fetchpriority="high">` : '';
  return { title: t.title, description: t.note ? `${t.note} Made by ${who}, ${t.year}.` : `${t.title}. Made by ${who}, ${t.year}.`, path: t.url, room: 'exhibit', theme: 'deep', lit: t.lit, bodyClass: `a-${t.slug} is-room`, main, scripts: ['exhibit'], image: lead?.jpg, jsonld, preloadImage };
}

// ── THE CURATORS (about) ────────────────────────────────────────────────────
export function aboutPage({ site, tokens, things }) {
  const count = k => things.filter(t => t.lit === k).length;
  const c = site._curators;
  const main = html`<section class="roomhead">
<p class="label">The two of us</p>
<h1 class="roomhead__title">${wonky('The Curators', 5)}</h1>
</section>
<div class="curators">
${c ? `<figure class="curators__photo">${pic(c, { sizes: '(min-width: 900px) 44vw, 94vw', lazy: false, fetch: 'high', max: 1280, alt: site.curators_alt || 'Kinnera and Kaveri' })}<figcaption class="hand">us, feeling cute</figcaption></figure>` : ''}
<div class="curators__words prose">
${(site.about || []).map(x => `<p>${esc(x)}</p>`)}
<p class="label curators__where">${esc(site.where || '')}</p>
<ul class="cities">${(site.cities || []).map(ct => `<li><span class="cities__name">${esc(ct.name)}</span><time class="cities__time" data-tz="${esc(ct.tz)}"></time></li>`)}</ul>
<p>Write to us: <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
</div>
</div>
<section class="earkey" aria-labelledby="earkey-h">
<h2 id="earkey-h" class="earkey__h">${wonky('How to read the ears', 3)}</h2>
<p class="voice">Our mark is two ears in a very small doorway. The ears tell you who made a thing.</p>
<ul class="earkey__list">
<li>${count('kinnera') ? '<a href="/by/kinnera/" data-lit="kinnera">' : '<a href="/by/both/" data-lit="kinnera">'}${markSvg({ lit: 'kinnera', cls: 'mark mark--key' })}<b>${tokens.makers.kinnera.name}</b><span>the straight ear, in ember</span><small>${count('kinnera') ? plural(count('kinnera'), 'thing') : 'so far, only in cahoots'}</small></a></li>
<li>${count('kaveri') ? '<a href="/by/kaveri/" data-lit="kaveri">' : '<a href="/by/both/" data-lit="kaveri">'}${markSvg({ lit: 'kaveri', cls: 'mark mark--key' })}<b>${tokens.makers.kaveri.name}</b><span>the curious ear, in lagoon</span><small>${count('kaveri') ? plural(count('kaveri'), 'thing') : 'so far, only in cahoots'}</small></a></li>
<li><a href="/by/both/" data-lit="both">${markSvg({ lit: 'both', cls: 'mark mark--key' })}<b>Both of us</b><span>both ears in colour</span><small>${plural(count('both'), 'thing')}</small></a></li>
</ul>
</section>`;
  const preloadImage = c ? `<link rel="preload" as="image" imagesrcset="${c.graded.filter(g => g.w <= 1280).map(g => `${g.url} ${g.w}w`).join(', ')}" imagesizes="(min-width: 900px) 44vw, 94vw" fetchpriority="high">` : '';
  return { title: 'The Curators', description: `${site.intro}`, path: '/about/', room: 'curators', theme: 'deep', main, lit: 'both', scripts: ['about'], image: c?.jpg, preloadImage };
}

// ── THE GIFT SHOP ───────────────────────────────────────────────────────────
export function shopPage({ site, tokens, things }) {
  const sale = things.filter(t => t.forSale);
  const main = html`<section class="roomhead">
<p class="label">Exit through here</p>
<h1 class="roomhead__title">${wonky('The Gift Shop', 8)}</h1>
<p class="voice">${sale.length ? 'Things you can actually take home.' : 'The shelves are being dusted.'}</p>
</section>
${sale.length ? `<ol class="drawers drawers--shop">${sale.map((t, i) => drawer(t, tokens, { lazy: i > 5 })).join('')}</ol>` : html`<div class="emptyshop">
${markSvg({ lit: 'both', cls: 'mark mark--ghost' })}
<p class="hand">back in five minutes (give or take a while)</p>
<p class="prose">Nothing is for sale here just yet. Everything in the Cabinet is, for now, just-built-it. When something goes on sale it will appear on this shelf, with a price on its label.</p>
<p class="prose">Seen something you can't live without? <a href="mailto:${esc(site.email)}">Write to us</a>.${site.etsy ? ` Or visit <a href="${esc(site.etsy)}" rel="noopener">${esc(site.shop_name)} on Etsy</a>.` : ''}</p>
<p><a class="btn btn--quiet" href="/things/">Wander the Cabinet instead</a></p>
</div>`}`;
  return { title: 'The Gift Shop', description: `Things from ${site.shop_name} that you can take home.`, path: '/shop/', room: 'shop', theme: 'deep', main };
}

// ── SURPRISE ME ─────────────────────────────────────────────────────────────
export function surprisePage({ site, tokens, things }) {
  const picks = things.filter(t => t.lead).filter((t, i) => (t.seed + i) % 3 === 0).slice(0, 4);
  const main = html`<section class="roomhead" data-surprise-room>
<p class="hand">spinning the Cabinet&hellip;</p>
<h1 class="roomhead__title">${wonky('Surprise me', 6)}</h1>
<p class="voice">One moment. If nothing happens, pick a drawer yourself:</p>
</section>
<ol class="drawers drawers--row">${picks.map(t => drawer(t, tokens)).join('')}</ol>`;
  return { title: 'Surprise me', path: '/surprise/', room: 'surprise', theme: 'deep', main, noindex: true, scripts: ['surprise'] };
}

// ── 404 ─────────────────────────────────────────────────────────────────────
export function notFoundPage({ site, tokens, things }) {
  const few = things.filter(t => t.lead).slice(0, 9);
  const main = html`<section class="lost">
<p class="hand">this room isn't on the map</p>
<h1 class="lost__title">${wonky('You fell down the wrong hole.', 13)}</h1>
<p class="voice">It happens to the best of us. Nothing lives at this address, or it moved while nobody was looking.</p>
<p class="doors"><a class="btn btn--fall" href="/things/">Open the Cabinet</a><a class="btn btn--quiet" href="/">Back to the top</a><a class="btn btn--quiet" href="/surprise/" data-surprise>Surprise me</a></p>
<div class="lost__pile" data-pile aria-hidden="true">${few.map(t => `<img class="lost__bit ph-${t.lead.id}" src="${t.lead.graded[0].url}" width="${t.lead.w}" height="${t.lead.h}" alt="" draggable="false">`).join('')}</div>
<p class="hand lost__hint" aria-hidden="true">go on, throw them about</p>
</section>`;
  return { title: 'Wrong hole', path: '/404.html', room: 'lost', theme: 'deep', main, noindex: true, scripts: ['lost'] };
}

// ── A PLAIN WRITTEN PAGE (content/pages/*.md) ───────────────────────────────
export function prosePage({ site, page }) {
  const main = html`<section class="roomhead"><h1 class="roomhead__title">${wonky(page.title)}</h1>${page.intro ? `<p class="voice">${esc(page.intro)}</p>` : ''}</section><div class="prose prose--page">${page.html}</div>`;
  return { title: page.title, description: page.intro || site.description, path: page.url, room: 'page', main };
}

// ── THE MARK (brand) ────────────────────────────────────────────────────────
export function brandPage({ site, tokens, things, brandFiles, sample }) {
  const c = tokens.colour;
  const sw = Object.entries(c).map(([k, v]) => {
    const onPage = contrast(v.value, c.page.value), onDeep = contrast(v.value, c.burrow.value);
    return `<li class="swatch"><span class="swatch__chip sw-${k}"></span><b>${titleCase(k)}</b><code>${v.value}</code><span>${esc(v.role)}</span><small>on page ${onPage.toFixed(1)}:1 · in the deep ${onDeep.toFixed(1)}:1</small></li>`;
  });
  const dream = Object.entries(tokens.dream).map(([k, v]) => `<li class="swatch swatch--dream"><span class="swatch__chip sw-dream-${k}"></span><b>${titleCase(k)}</b><code>${v}</code></li>`);
  const main = html`<section class="roomhead">
<p class="label">The brand, all of it</p>
<h1 class="roomhead__title">${wonky('The Mark', 7)}</h1>
<p class="voice">Two ears in a doorway. Everything on this page is drawn from the same few values the whole site is built from, so it can never drift.</p>
</section>
<section class="brand">
<h2 class="brand__h">The mark</h2>
<div class="brand__stage" data-turn>
<div class="brand__big">${markSvg({ lit: 'both', cls: 'mark mark--huge', title: 'The KPP rabbit hole mark: two ears in a small lit doorway, its door ajar' })}</div>
<div class="brand__say prose">
<p>The hole is a very small door, left ajar, with the light on inside and spilling over the step. Two ears stand in the doorway, tips poking out over the arch: one straight, like an exclamation mark, and one that curls at the tip, like a question mark. <em>Wonder</em> and <em>curiosity</em>, on the same threshold.</p>
<p>It is also a credit line. An ear is in colour only on things its sister made. Otherwise it stands in shadow.</p>
<p>The ears overlap the door, so the whole mark is one connected shape. It cuts as a single sticker and prints as a single piece: use the one-piece outline in the files below.</p>
</div>
</div>
<ul class="brand__states">
<li>${markSvg({ lit: 'kinnera', cls: 'mark mark--state' })}<b>${tokens.makers.kinnera.name} made it</b><span>left ear in ember</span></li>
<li>${markSvg({ lit: 'kaveri', cls: 'mark mark--state' })}<b>${tokens.makers.kaveri.name} made it</b><span>right ear in lagoon</span></li>
<li>${markSvg({ lit: 'both', cls: 'mark mark--state' })}<b>We both made it</b><span>both in colour. Also the logo.</span></li>
<li>${markSvg({ lit: 'none', cls: 'mark mark--state' })}<b>Unlit</b><span>both ears in shadow: stamps, embossing, engraving</span></li>
</ul>
<ul class="brand__rules prose">
<li>Never mention a medium next to the mark. The brand is <b>${esc(site.shop_name)}</b> and nothing more specific.</li>
<li>Give it room: at least one ear's width of clear space all round.</li>
<li>Don't recolour the ears, swap them, add a face, shut the door, turn the light off, or let the ears float free of the doorway.</li>
</ul>
<h2 class="brand__h">Colour</h2>
<ul class="swatches">${sw}</ul>
<p class="label brand__dreamlabel">The dream you fall through (decoration only)</p>
<ul class="swatches swatches--dream">${dream}</ul>
<h2 class="brand__h">Type</h2>
<div class="specimens">
<div class="specimen"><p class="specimen__big specimen__big--title">Curiouser things</p><p class="specimen__big specimen__big--thin">2024, or so</p><p class="label">${tokens.type.story.family} &middot; ${esc(tokens.type.story.use)}</p></div>
<div class="specimen"><p class="voice specimen__voice">&ldquo;Because I have t(w)o many cutting boards.&rdquo;</p><p class="label">${tokens.type.story.family} italic &middot; our own words, exactly as we wrote them</p></div>
<div class="specimen"><p class="specimen__label label">Acc. No. 2024.07 &middot; Made by both &middot; Earrings</p><p class="label">${tokens.type.label.family} &middot; ${esc(tokens.type.label.use)}</p></div>
<div class="specimen"><p class="hand specimen__hand">please do touch</p><p class="label">${tokens.type.hand.family} &middot; ${esc(tokens.type.hand.use)}</p></div>
</div>
<h2 class="brand__h">Voice</h2>
<div class="prose">
<p>Two sisters who love what they do, talking to a friend. A curator's wink, never a sneer. We are never self-deprecating, never snarky and never corporate.</p>
<p>The tagline is <b>&ldquo;${esc(site.tagline)}&rdquo;</b> The line under it is <b>&ldquo;${esc(site.line)}&rdquo;</b> The words we use: <em>things</em> (never &ldquo;products&rdquo;), <em>the fall</em>, <em>the Cabinet</em>, <em>drawers</em>, <em>the Curators</em>.</p>
</div>
${sample ? html`<h2 class="brand__h">Photographs</h2>
<div class="prose"><p>Every photo is a real record of a real thing. They all get one gentle house grade, so white walls land on the colour of this page and the collection reads as one world. Nothing in a photo is ever retouched, removed or invented, the originals are never altered, and true colour is one tap away on every exhibit.</p></div>
<div class="beforeafter"><figure><img class="ph" src="${sample.true[0].url}" width="${sample.w}" height="${sample.h}" alt="As shot: ${esc(sample.alt)}" loading="lazy"><figcaption class="label">As shot</figcaption></figure><figure><img class="ph" src="${sample.graded[Math.min(1, sample.graded.length - 1)].url}" width="${sample.w}" height="${sample.h}" alt="With the house grade: ${esc(sample.alt)}" loading="lazy"><figcaption class="label">House grade</figcaption></figure></div>` : ''}
<h2 class="brand__h">Files</h2>
<p class="voice">Made fresh from the same values on every build. Take what you need.</p>
<ul class="files">
${brandFiles.map(f => `<li><a href="${f.url}" download><span class="files__thumb${f.dark ? ' files__thumb--dark' : ''}"><img src="${f.preview || f.url}" alt="" loading="lazy" width="${f.w}" height="${f.h}"></span><b>${esc(f.name)}</b><small>${esc(f.note)}</small></a></li>`)}
</ul>
</section>`;
  return { title: 'The Mark', description: `The ${site.shop_name} brand: the two-ear mark, colours, type, voice and downloadable files.`, path: '/brand/', room: 'brand', main, lit: 'both', scripts: ['brand'] };
}

// ── THE SYSTEM (a map of every page type, and the designer's guarantee) ─────
export function systemPage({ site, tokens, things, facets, problems, tests }) {
  const ex = things.filter(t => !t.test);
  const by = fn => ex.find(fn);
  const samples = [
    ['The Fall (home)', '/', 'The long way in. Things rise past you, newest first.'],
    ['The Cabinet', '/things/', 'Everything, with search and filters. Drawers or ledger.'],
    ['A drawer', facets[0]?.values[0]?.url, 'One kind, material, tag, maker or year. Made automatically.'],
    ['Exhibit: one tall photo', by(t => t.photos.length === 1 && t.lead.orientation === 'portrait')?.url, 'The commonest page.'],
    ['Exhibit: one wide photo', by(t => t.photos.length === 1 && t.lead.orientation === 'landscape')?.url, 'The case goes full width.'],
    ['Exhibit: two photos', by(t => t.photos.length === 2)?.url, 'A pair of plates.'],
    ['Exhibit: several photos', by(t => t.photos.length >= 3)?.url, 'Plates in a rhythm set by their shapes.'],
    ['Exhibit with a moment', by(t => t.moment)?.url, 'An optional scene: butterflies, lights, gears.'],
    ['The Gift Shop', '/shop/', 'Fills itself when anything has a price.'],
    ['The Curators', '/about/', 'Us.'],
    ['The Mark', '/brand/', 'The brand, built from the tokens.'],
    ['Surprise me', '/surprise/', 'Sends you to any one thing.'],
    ['Wrong hole (404)', '/404.html', 'What you see at an address that does not exist.'],
  ].filter(s => s[1]);
  const fix = problems.filter(p => p.level === 'fix' && !p.test), better = problems.filter(p => p.level === 'better' && !p.test);
  const main = html`<section class="roomhead">
<p class="label">Behind the wallpaper</p>
<h1 class="roomhead__title">${wonky('How it all works', 1)}</h1>
<p class="voice">Every kind of page, and what the designer's guarantee has to say about the content right now.</p>
</section>
<section class="system prose prose--page">
<h2>Every page type</h2>
<table class="system__table"><thead><tr><th>Page</th><th>What it is</th></tr></thead><tbody>
${samples.map(([n, u, d]) => `<tr><td><a href="${u}">${esc(n)}</a></td><td>${esc(d)}</td></tr>`)}
</tbody></table>
${tests.length ? `<h2>Stress tests</h2><p>Deliberately awkward content, to prove a page never looks broken. These are only built with <code>npm run torture</code> and are never published.</p><ul>${tests.map(t => `<li><a href="${t.url}">${esc(t.title)}</a></li>`).join('')}</ul>` : ''}
<h2>The designer's guarantee</h2>
<p>Every time the site is built, each thing is checked. Anything that would make a weak page is listed here and in the build log, with exactly what to change.</p>
${fix.length ? `<h3>Please fix (${fix.length})</h3><ul class="system__list">${fix.map(p => `<li><b>${esc(p.where)}</b> ${esc(p.text)}</li>`).join('')}</ul>` : '<p class="system__ok">Nothing needs fixing.</p>'}
${better.length ? `<h3>Would be better (${better.length})</h3><ul class="system__list">${better.map(p => `<li><b>${esc(p.where)}</b> ${esc(p.text)}</li>`).join('')}</ul>` : '<p class="system__ok">Nothing could be better. Remarkable.</p>'}
<h2>Adding things</h2>
<p>The full, plain-language guide is in the repository: <code>docs/HOW-TO-ADD-THINGS.md</code>. The short version: put photos in <code>photos/</code>, copy <code>content/things/_copy-me.md</code>, fill it in, save. Everything else on this site happens by itself.</p>
</section>`;
  return { title: 'How it all works', path: '/system/', room: 'system', main, noindex: true };
}
