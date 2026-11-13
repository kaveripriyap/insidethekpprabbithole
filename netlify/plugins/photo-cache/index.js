// Keeps generated/photos between Netlify builds so only new or changed photos
// are processed. If the cache is ever lost, the build simply remakes it.
const DIR = 'generated/photos';
export const onPreBuild = async ({ utils }) => {
  const ok = await utils.cache.restore(DIR);
  console.log(ok ? 'Photo cache restored.' : 'No photo cache yet: every photo will be processed this once.');
};
export const onPostBuild = async ({ utils }) => {
  await utils.cache.save(DIR);
  console.log('Photo cache saved.');
};
