# Inside the KPP Rabbit Hole

The website of Kinnera and Kaveri, two sisters who build things.
**Things we built, all the way down.**

- Live address: https://insidethekpprabbithole.xyz
- Everything is made of plain files. There is no database and no server.

## If you only want to add a thing

Read **[docs/HOW-TO-ADD-THINGS.md](docs/HOW-TO-ADD-THINGS.md)**. You can do it
from github.com in a browser: upload photos, copy one file, fill it in, save.
The site rebuilds itself and the new page designs itself.

## What is where

| Folder or file | What it holds |
|---|---|
| `content/things/` | One file per thing we made. This is the collection. |
| `photos/` | The original photographs. **Never edited by anything.** |
| `site.yaml` | Every word that appears across the site (intro, asides, cities, email). |
| `design/tokens.yaml` | The one set of design values: colours, type, spacing, motion, the photo grade. |
| `content/pages/` | Optional extra written pages (a file here becomes a page). |
| `build/` | The machine that turns the above into the site. |
| `src/` | The styles and scripts of the site. |
| `docs/` | Plain-language guides. |
| `dist/`, `generated/` | Made by the build. Never edit; not stored in the repository. |

## The rooms

| Address | Room |
|---|---|
| `/` | **The Fall.** The long way in: through a very small door, then down past everything, newest first. |
| `/things/` | **The Cabinet.** Everything, with search and filters. Any view is a shareable link. |
| `/project/<name>/` | An exhibit: one thing, in a room of its own. (Same addresses as the old site.) |
| `/kind/…`, `/made-with/…`, `/tag/…`, `/by/…`, `/year/…` | Drawers: made automatically from the words in each thing's file. |
| `/shop/` | **The Gift Shop.** Fills itself when a thing has a price. |
| `/about/` | **The Curators.** |
| `/brand/` | **The Mark.** The brand, with downloadable logo and Etsy files. |
| `/surprise/` | Sends you to any one thing. |
| `/system/` | Every page type, and what the designer's guarantee says right now. |

## Commands (for whoever has a computer handy)

```
npm ci            # install, once
npm run build     # build the site into dist/
npm run dev       # build, serve at http://localhost:8080, rebuild on every change
npm run check     # only run the designer's guarantee
npm run torture   # build with the deliberately awkward test content too
```

Needs Node 20 or newer (Netlify uses 22).

## Netlify

Link the repository and deploy. `netlify.toml` already says everything:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `22` |
| Production branch | `main` |

The first build processes every photo (about a minute). After that, a small
plugin in `netlify/plugins/photo-cache` remembers them, so builds take seconds.

## More

- [docs/HOW-TO-ADD-THINGS.md](docs/HOW-TO-ADD-THINGS.md): adding and changing things, selling things.
- [docs/PHOTOS.md](docs/PHOTOS.md): what happens to photographs, and what never does.
- [docs/SYSTEM.md](docs/SYSTEM.md): how the design system works and how to extend it without breaking the look.
