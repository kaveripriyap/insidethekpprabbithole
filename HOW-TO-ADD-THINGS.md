# How to add things

You never need to touch code. Everything on the site comes from four places:

| What | Where | What it controls |
|---|---|---|
| **Things you made** | `content/things/` | One `.md` file per thing |
| **Photos** | `photos/` | Every photo, full size, any name |
| **Words** | `site.yaml` | Title, tagline, email, cities, Etsy link |
| **Look** | `design/tokens.yaml` | Colours, fonts, sizes (the brand) |

Every change you save to GitHub rebuilds the site on Netlify within about a minute.

---

## Add a new thing (about 3 minutes)

You can do all of this on github.com, in a browser.

1. **Upload the photos.** Open the `photos` folder, click **Add file → Upload files**, drop them in, then click **Commit changes**. Names are up to you, but no spaces, e.g. `sock-holda-1.jpg`.
2. **Make the page.** Open `content/things/_copy-me.md`. Click **⋯ → Copy raw file**. Go back to `content/things/`, click **Add file → Create new file**, name it something like `sock-holda.md`, and paste.
   - The file name becomes the address: `sock-holda.md` lives at `/project/sock-holda/`.
3. **Fill it in.**

```yaml
---
title: "Sock Holda"
description: "Because socks deserve a home too."
maker: Kinnera/Kaveri        # Kinnera, Kaveri, or Kinnera/Kaveri
year: 2026
date: 2026-11-13             # newest dates show first
family: holdas               # which chamber it lives in (list below)
habitat: "the sock drawer"   # optional: where it lives
draft: false                 # true keeps it hidden
images:
  - src: sock-holda-1.jpg    # the file name from /photos
    caption: "Sock Holda, full of socks"
    alt: "A blue 3D-printed rack holding six rolled-up socks"
---
```

4. Click **Commit changes**. Done. It gets the next find number automatically, shows up in its chamber on the home page, in the full list at `/project/`, and gets its own social card for when someone shares the link.

**About `alt`:** it's what a screen reader says out loud instead of showing the photo. Describe what's in the picture in one sentence, as if over the phone. The site refuses to build without it, so nobody gets left out.

### The chambers (families)

| `family:` | Chamber |
|---|---|
| `holdas` | Holdas: things that hold other things |
| `demon-equipment` | Demon Equipment |
| `critters` | Critters |
| `wearables` | Wearables |
| `glowy-things` | Glowy Things |
| `surfaces` | Surfaces |
| `contraptions` | Contraptions |
| `us` | Us |

**New chamber?** Open `content/things/_shelf.yaml` and add a block under `families:`:

```yaml
  - key: kitchen-stuff
    name: Kitchen Stuff
    colour: mint            # any colour name from design/tokens.yaml
    blurb: "One honest line about what lives here."
```

### Optional extras on any thing

| Line | What it does |
|---|---|
| `featured: true` | Pops out of the hole on the home page (the first six featured things) |
| `price: "€18"` | Shows a price on the tag |
| `buy: "https://…"` | Adds a **Get one** button (e.g. to the Etsy listing) |
| `buy_label: "Get one on Etsy"` | Changes the button's words |
| `download: "/photos/file.stl"` | Adds a **Download** button (put the file in `photos/`) |
| Text below the second `---` | Shows on the page as a longer story |

To hide something without deleting it, set `draft: true`.

---

## Add a whole new kind of content (shop, notes, printables…) (about 5 minutes)

1. Copy the folder `content/_new-shelf-example/` and rename the copy, e.g. `content/printables/`. (Folders and files starting with `_` are never published, which is why the example stays hidden.)
2. Edit `_shelf.yaml` inside it: the title, the menu label, the address, what one item is called.
3. Add one `.md` file per item, same format as things. Photos are optional: items without photos show as a tag on its own.

On the next build you get a page listing them all (`/printables/`), a page for each item, chamber pages if you listed families, a link in the menu and footer, and social cards. No code.

---

## Change the words

Open `site.yaml`. The tagline, the promise line, the email, the four cities and the Etsy/Instagram links are all there. Leave a link empty (`""`) to hide it.

## Change the look

Open `design/tokens.yaml`. Change a colour's `hex:` and the whole site, the `/brand` page, the downloadable logo files, the Etsy images and the social cards all follow. If a change makes text hard to read, the build stops and says which pair failed. That's on purpose.

## Check your work before saving

If you have the project on your computer:

```sh
npm ci            # once
npm run check     # finds typos, missing photos and missing alt text
npm start         # preview at http://localhost:8080
```

If something is wrong, the Netlify deploy log says which file and what to fix, in plain words, and the live site stays as it was until you fix it.
