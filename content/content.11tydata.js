// Shared settings for everything in /content. You shouldn't need to touch this:
// the folder an item is in decides which shelf it belongs to and its address.
import { shelfFor } from "../src/lib/shelves.js";

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default {
  layout: "layouts/item.njk",
  eleventyComputed: {
    shelf: (data) => shelfFor(data.page.inputPath)?.key,
    slug: (data) => slugify(data.slug || data.page.fileSlug),
    permalink: (data) => {
      if (data.draft === true) return false;
      const shelf = shelfFor(data.page.inputPath);
      if (!shelf) return false;
      return `/${shelf.url}/${slugify(data.slug || data.page.fileSlug)}/`;
    },
    eleventyExcludeFromCollections: (data) => data.draft === true,
  },
};
