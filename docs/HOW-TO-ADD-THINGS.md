# How to add a thing

You need a web browser and nothing else. No design, no code.

## The three steps

### 1. Upload the photos

On github.com, open the **`photos`** folder, press **Add file → Upload files**,
drop your photos in, and press **Commit changes**.

- Any phone photo is fine. `.jpg` and `.png` work. (`.heic` does not: on an
  iPhone, share the photo as "Most Compatible" first.)
- Bigger is better. Aim for at least 1600 pixels on the long side.
- Don't edit, crop or filter them first. The site gives every photo the same
  gentle grade by itself, and keeps your original untouched.
- Give files plain names, like `SockHolda1.jpg`.

### 2. Copy the template

Open **`content/things/_copy-me.md`**, press the copy button (**Copy raw
file**), then go back to `content/things`, press **Add file → Create new
file**, and paste.

Name the new file after the thing, with dashes and no spaces, ending in `.md`:

```
sock-holda.md
```

That name becomes the web address: `insidethekpprabbithole.xyz/project/sock-holda/`.

### 3. Fill it in and save

Only this much is needed:

```yaml
---
title: "Sock Holda"
note: "Because socks deserve a home too."
maker: Kinnera/Kaveri
year: 2026
date: 2026-11-13
photos:
  - file: SockHolda1.jpg
    alt: "A blue rack holding six rolled-up socks"
kind: [holder]
made_with: [3d-printing]
tags: [bedroom]
---
```

Press **Commit changes**. In a minute or two the site rebuilds, and the thing
has its own page, its own drawer in the Cabinet, and its place in the fall.

## What each line does

| Line | What it does |
|---|---|
| `title` | The name of the thing. |
| `note` | Your one-liner, shown large, in your own words. |
| `maker` | `Kinnera`, `Kaveri`, or `Kinnera/Kaveri`. This decides which ear lights up. |
| `year` | The year it was made. Decides which year it falls in, and its accession number. |
| `date` | Decides the order: newer dates are nearer the surface. |
| `photos` | The photos, in order. The first is the main one. |
| `alt` | A plain description of what is in the photo, for people who can't see it. Please always write one, and keep it true to the photo. |
| `caption` | Optional words shown under the photo. |
| `kind` | What it is. Any words: `[earrings]`, `[table, furniture]`. |
| `made_with` | How it was made: techniques and materials. `[sewing, electronics]`. |
| `tags` | Anything else that helps someone find it. |

**New words need no setup.** If you write `kind: [kite]` and nothing has ever
been a kite before, a "Kite" filter and a `/kind/kite/` page appear by
themselves. Use dashes for two-word names: `glow-in-the-dark`.

## Optional extras

Each of these adds a section to the page. None is required. A page with only a
title and a photo still looks finished.

| Add this | And you get |
|---|---|
| Text below the second `---` | **The story**: a longer piece of writing. |
| `specs:` | A small table of particulars (size, weight, time). |
| `parts:` | A "made with" list. |
| `video:` | A film: a YouTube or Vimeo link, or an `.mp4` uploaded to `photos`. |
| `model:` | A 3D model people can turn around: an `.stl` or `.glb` uploaded to `photos`. |
| `download:` | A "download the files" link. |
| `moment:` | A little scene: `butterflies`, `lights` or `gears`. |
| `draft: true` | Hides the thing until you remove the line. |

The template shows the exact spelling of each.

## Selling a thing

Add a price, and the thing appears in the **Gift Shop** with a button.

```yaml
price: "€18"
buy: "https://www.etsy.com/listing/1234567890/sock-holda"
```

- `buy` is where the button sends people (your Etsy listing, for now).
- Leave `buy` out and the button says "Ask us about it" and opens an email.
- `sold_out: true` marks it sold.
- `variants:` lists sizes or colours, each with its own price or link if you like.

When you move to your own checkout one day, only the `buy` links change. The
pages, the shop and the labels stay exactly as they are.

## Changing or removing a thing

Open its file in `content/things`, press the pencil, change it, commit.
To remove a thing, delete its file (or add `draft: true` to hide it).

## Changing the words of the site

Everything written on the site that isn't about one thing lives in
**`site.yaml`**: the intro, the things said to you on the way down, the notes
inked on labels, the cities, the email address, the Etsy link.

## The designer's guarantee

Every time the site builds, it checks each thing and tells you, in plain
words, anything that would make a weak page: a photo with no description, a
photo that is too small, a missing title, a file name it can't find. The site
still builds and the page still looks presentable. The notes are how to make
it sing.

You can read them in two places:

- on the site, at **`/system/`**
- in Netlify, under **Deploys → the latest deploy → Deploy log**, in the
  section called "The designer's guarantee"

## If something goes wrong

- **The thing doesn't appear.** Check the file name ends in `.md` and doesn't
  start with `_`, and that there is no `draft: true`.
- **The build failed.** Almost always a typing slip in the top block: a
  missing quote mark, or uneven spaces at the start of a line. `/system/` or
  the deploy log names the file and the line.
- **A photo is missing.** File names must match exactly, capital letters
  included: `SockHolda1.jpg` is not `sockholda1.JPG`.
