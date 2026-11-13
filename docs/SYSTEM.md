# How the design system works

Everything on the site is made from four ingredients. Change an ingredient
and every page that uses it changes with it.

| Ingredient | Where | Changes |
|---|---|---|
| Things | `content/things/*.md` | What exists |
| Words | `site.yaml` | What the site says |
| Tokens | `design/tokens.yaml` | Colours, type, spacing, motion, the photo grade |
| Photos | `photos/` | The pictures |

## The idea

You arrive at night at a very small lit door. Go through it and you fall,
past everything we have made, newest first, oldest at the bottom. Or skip
the fall and open **the Cabinet**, where every thing has a drawer. Each
thing's page is its **own room**, with walls the colour of the thing.

## The mark

Two ears in a lit doorway whose door is ajar. The left ear is Kinnera's, the
right ear (the curled one) is Kaveri's. An ear is in colour only on things
its sister made, so the mark doubles as a credit line everywhere it appears.
All its parts overlap, so it is one connected shape: `/brand/` offers a
one-piece outline for die-cut stickers and 3D printing.

It is drawn in one place: `build/lib/mark.mjs`.

## Every page type

The live list, with links, is on the site at **`/system/`**.

| Page | Made from | Notes |
|---|---|---|
| The Fall `/` | all things | Shows up to `fall_max` things (default 48; set it in `site.yaml`), spread across the years, always including the oldest. |
| The Cabinet `/things/` | all things | Search and filters run in the browser. The address bar always holds the current view, so any view is a shareable link. |
| A drawer `/kind/x/` and friends | the words in each thing's file | Made automatically for every `kind`, `made_with`, `tags`, maker and year. |
| An exhibit `/project/x/` | one thing | See below. |
| The Gift Shop `/shop/` | things with a `price` or `buy` | Empty state until something is for sale. |
| The Curators `/about/` | `site.yaml` | |
| The Mark `/brand/` | `design/tokens.yaml` | Logo and Etsy files are re-made on every build. |
| Written pages | `content/pages/*.md` | Drop a file in and it becomes `/file-name/`. |

## How an exhibit designs itself

A new thing needs a title and a photo. Everything else is worked out:

| The page decides | From |
|---|---|
| Its accent colour, wall colour and floor colour | The most vivid colour in the first photo |
| Whether the photo sits beside the words or above them | Whether the first photo is tall, square or wide |
| How the other photos are arranged | How many there are (one, a few, many) |
| Its accession number (`2026.03`) | Its year, and its order within that year |
| Which ear is lit | `maker` |
| The note inked on its label | Picked from `margin_notes` in `site.yaml`, always the same one for the same thing |
| The small creature by the skirting board | Picked the same way |
| "More like this" | Things sharing its `kind` and `tags`, then its maker, then its year |
| The doors to the next rooms | The next newer and next older thing |

Optional blocks appear only when the thing has them: the story, particulars,
a made-with list, a film, a 3D model, a price. A page with none of them is
complete. A page with no photo at all gets a drawn stand-in marked "not yet
photographed", never a fake photo.

## Selling

The shop is already built in. A thing with `price:` appears in the Gift Shop,
shows its price on its drawer and label, and gets a ticket to buy it. The
ticket goes to `buy:` (an Etsy listing today). To move to your own checkout
later, change the `buy:` links, or replace the one "buy" block in
`build/templates/pages.mjs` with a checkout button. Nothing else changes.

## Moments

A thing may ask for a small scene with `moment:`.

| Name | What happens |
|---|---|
| `butterflies` | Ink butterflies rest on the picture frame and lift off into the page. They are drawn, and are never part of the photo. |
| `lights` | A light switch on the frame turns the room's lights off. |
| `gears` | Two gears behind the frame turn as you scroll. |

To add one: write a file in `src/js/moments/` that exports one function, and
add its name to the short list in `src/js/exhibit.js`.

## Colour and type

All in `design/tokens.yaml`, shown live at `/brand/` with their contrast.

- **Rooms are dark, paper is light.** Walls, floors and the fall are deep
  colours. Labels, tags, tickets and frames are paper. Words on walls are
  page-coloured; words on paper are ink.
- **Two colours belong to people.** Ember is Kinnera, lagoon is Kaveri. They
  are used for the ears and nowhere else.
- **Gilt is for the museum's own fittings**: rails, knobs, numerals, rules.
- **One typeface does the reading**: Fraunces. Heavy and wonky for titles,
  italic for our own words, thin italic for big numerals, small spaced
  capitals for labels. **One hand** (Reenie Beanie) writes the paper tags and
  the notes in the margin.

## Rules that keep it beautiful

1. Never style one page by hand. If a page looks wrong, fix the template, so
   every page like it is fixed too.
2. Never put a colour or a size straight into a stylesheet when a token
   exists for it.
3. Photos are the stars. Nothing drawn may sit on top of a photo in a way
   that could be mistaken for part of it.
4. Anything that moves must also work standing still. With "reduce motion"
   switched on, the fall becomes a calm page and nothing animates.
5. Anything you can click must look clickable and work from a keyboard.
6. Run `npm run torture` after changing a template. It builds deliberately
   awkward things (no photo, twelve photos, a title 127 letters long, a broken
   file) so you can see that nothing breaks.

## Accessibility and speed, as built

- Colour contrast meets WCAG AA for all text.
- Everything works from a keyboard. Tabbing through the fall brings each
  thing up to you. "/" jumps to the search box anywhere.
- Every photo has alt text, and the build tells you when one is missing.
- The footer's "shrink me" and "grow me" change the text size and remember it.
- No inline scripts or styles: the strict security policy in `netlify.toml`
  holds everywhere.
- The 3D and WebGL parts load after the page is readable and are skipped
  entirely if a browser can't run them.
