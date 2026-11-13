# Inside the KPP Rabbit Hole

Oddly useful things by Kinnera & Kaveri, mostly 3D printed, some sewn, all a little weird.

**Fall in. Come back holding something.** The site is a rabbit hole you actually fall into. On the surface there's a hole with two ears sticking out of it, one ear per sister. Scroll, and the hole swallows the screen. Inside is a burrow drawn in cross-section: tunnels lead to chambers, and each chamber holds one family of things (Holdas, Demon Equipment, Critters…). Every object is a *find* with a punched specimen tag. **Fall deeper** sends you to a random find you haven't seen yet, and the top bar counts how deep you've gone.

- **Adding things:** see [HOW-TO-ADD-THINGS.md](HOW-TO-ADD-THINGS.md). No code needed.
- **The brand:** `/brand` on the live site, built from `design/tokens.yaml`.

## Where things live

```
content/things/        one .md file per thing (the file name is the address)
content/things/_shelf.yaml   the chambers (families) and shelf settings
content/_new-shelf-example/  copy this to add a new kind of content
photos/                every photo, full size
site.yaml              site words: title, tagline, email, cities, links
design/tokens.yaml     colours, fonts, sizes: the whole look
src/                   templates, CSS and JS (you shouldn't need these)
```

## Run it

```sh
npm ci
npm start        # http://localhost:8080
npm run build    # writes the site to _site/
npm run check    # checks every content file for missing photos, alt text and typos
```

Node 22 or newer. The first build resizes every photo (about 90 seconds). After that it's a few seconds.

## Deploy (Netlify)

Everything is set in `netlify.toml`, so the Netlify UI can be left on its defaults:

| Setting | Value |
|---|---|
| Base directory | *(empty)* |
| Build command | `npm run build` |
| Publish directory | `_site` |
| Node version | 22 (set in `netlify.toml`) |

`netlify.toml` also sets a strict Content Security Policy (no inline scripts or styles anywhere), long caching for photos and fonts, a 301 redirect from the old `/assets/uploads/*` photo addresses to `/photos/*`, and a small local build plugin that keeps resized photos between deploys.

Old project addresses (`/project/<name>/`) are unchanged.

## How it's built

[Eleventy 3](https://www.11ty.dev/) with Nunjucks templates, plain CSS and one small JavaScript module. No framework and no client-side rendering: every page is static HTML that works without JavaScript. JS adds the ears that follow your cursor, the live clocks for the four cities, the depth counter and Fall Deeper.

- Photos become responsive AVIF and JPEG (animated WebP for GIFs) with `@11ty/eleventy-img`. Originals stay linked from each find as "Full size".
- `design/tokens.yaml` becomes CSS custom properties at build time (`src/lib/tokens.js`). The build fails if any promised colour pair drops below WCAG AA contrast.
- The mark is drawn once, in `src/lib/mark.js`. The site, the `/brand` page, the downloadable SVGs, the favicons, the Etsy images and the social cards all use it.
- A social card (Open Graph image) is generated for every page in `src/lib/after-build.js`, using the real photo rising out of the hole.
- The fall is a CSS scroll-driven animation. Browsers that don't support it, and anyone with reduced motion turned on, get a still hero.

## Fonts

All open-source (SIL Open Font License), self-hosted and subset: **Gluten** (display), **Atkinson Hyperlegible Next** (body), **Martian Mono** (labels), **Baloo Tammudu 2** (Telugu, subset to the brand line only). Licences are in `src/assets/fonts/`.

`design/fonts/` holds the desktop versions the build uses to outline text in logo files and social cards. `scripts/outline-telugu.py` regenerates the Telugu outline if that line ever changes.
