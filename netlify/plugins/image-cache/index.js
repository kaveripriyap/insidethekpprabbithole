// Keeps the resized photos (_site/img) between Netlify builds.
// Without it every deploy re-processes ~40 big photos (about a minute and a half).
const DIR = "_site/img";

export const onPreBuild = async ({ utils }) => {
  if (await utils.cache.restore(DIR)) console.log("[image-cache] restored resized photos");
  else console.log("[image-cache] nothing cached yet, first build will resize everything");
};

export const onPostBuild = async ({ utils }) => {
  if (await utils.cache.save(DIR)) console.log("[image-cache] saved resized photos for next time");
};
