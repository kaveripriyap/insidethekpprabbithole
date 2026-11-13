# What happens to photographs

Our photos are real records of real things we made. The site may make them
fit the brand. It may never misrepresent what is in them.

## The promise

| Always | Never |
|---|---|
| The original file in `photos/` is left exactly as you uploaded it. | Nothing overwrites, edits or deletes an original. |
| Every photo gets the same gentle house grade, by itself. | Nothing in a photo is retouched, removed, added or reshaped. |
| True colour is one tap away on every exhibit page. | No photo, product or detail is ever generated or invented. |
| Leaning in (the large view) always shows true colour. | A thing's colour, shape, size, texture or flaws are never changed. |

## What the build does to each photo

Every build reads `photos/` and writes copies into `generated/photos/` (a
cache that can be deleted at any time and is rebuilt from the originals).

1. **Turns it the right way up**, using the phone's own rotation note.
2. **Trims true-black bars** at the top and bottom, the kind a screen
   recording or phone screenshot leaves. Only rows that are pure black are
   removed. Two photos have this today (`TentacleThing1.jpg`, `CuteWhaley.jpg`).
3. **Makes a true-colour copy**: only resized. This is what "As shot" and
   the lean-in view show.
4. **Makes a graded copy**, the house look, applied to the whole frame at once:
   - *White balance.* It finds the white wall in the photo and nudges it
     toward the paper colour of the site, so photos taken under yellow or
     blue light sit together. Limited to a few percent per colour.
   - *Exposure.* Dim photos are lifted, bright ones eased, so walls land at
     a similar brightness. Limited to about a fifth. Night shots are left dark.
   - *Contrast.* One soft curve, with highlights protected from blowing out.
   - *Sharpening.* A light touch after resizing.
5. **Makes a small black-and-white copy**, used only for decoration and
   never in place of the real photo.
6. **Notes some facts**: its size and shape, where the interesting part is
   (so crops in the Cabinet keep the subject), and the most vivid colour in
   it. That colour becomes the thing's accent and the wall colour of its room.

What it does **not** do: cut things out of their backgrounds, clean up
clutter, remove dust, or change one part of a picture differently from
another. Those need a human eye to be done honestly, so they are not automated.

Animated GIFs are shown as they are (only resized), and their first frame is
graded for use in the Cabinet.

## Changing the look

All the dials are in `design/tokens.yaml` under `grade:`. Change a number,
rebuild, and every photo is re-made from its original.

| Dial | What it does |
|---|---|
| `paper_white` | The colour white walls are balanced toward. |
| `balance` | `0` leaves white balance alone. `1` is the strongest correction. |
| `exposure` | `0` leaves brightness alone. `1` evens it out fully. |
| `contrast` | Strength of the soft curve. `0` is none. |
| `saturation` | `1` is as shot. Below `1` is quieter, above is richer. |
| `sharpen` | How crisp the resized copies are. |

To switch the grade off entirely, set `balance`, `exposure` and `contrast` to
`0` and `saturation` to `1`.

## New photos

Nothing to do. Any photo added to `photos/` gets exactly the same treatment
on the next build. If a photo is small, soft, missing a description, or not
used anywhere, the designer's guarantee says so (see `/system/` on the site).
