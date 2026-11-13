"""Dev-only helper. Turns the Telugu brand line into SVG path data, because the
browser-free build (logo files, social cards) can't shape Telugu by itself.
Run:  pip install uharfbuzz fonttools && python3 scripts/outline-telugu.py
Writes design/telugu-outline.json. Only needed if the Telugu text changes."""
import json, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

TEXT = "కుందేలు బొక్క"
FONT = "design/fonts/baloo-tammudu-2-telugu-variable.ttf"
WGHT = 700
font = hb.Font(hb.Face(hb.Blob(open(FONT, "rb").read()))); font.set_variations({"wght": WGHT})
buf = hb.Buffer(); buf.add_str(TEXT); buf.guess_segment_properties()
hb.shape(font, buf, {})
tt = TTFont(FONT); gs = tt.getGlyphSet(location={"wght": WGHT}); order = tt.getGlyphOrder()
upm = tt["head"].unitsPerEm; asc = tt["hhea"].ascent; desc = tt["hhea"].descent
pen = SVGPathPen(gs); x = 0
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    tp = TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, asc - pos.y_offset))
    gs[name].draw(tp); x += pos.x_advance
json.dump({"text": TEXT, "d": pen.getCommands(), "width": x, "height": asc - desc, "upm": upm},
          open("design/telugu-outline.json", "w"))
print("width", x, "height", asc - desc)
