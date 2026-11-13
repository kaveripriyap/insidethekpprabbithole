// The small fauna of the fall: our own tools, drawn like engravings.
// Decoration only. They drift past at the wrong sizes.
const S = {
  spool: '<ellipse cx="24" cy="11" rx="14" ry="5"/><ellipse cx="24" cy="37" rx="14" ry="5"/><path d="M14.5 14v20M33.5 14v20M14.5 20c6 3 13 3 19 0M14.5 26c6 3 13 3 19 0M14.5 32c6 3 13 3 19 0"/><ellipse cx="24" cy="11" rx="4" ry="1.5"/>',
  needle: '<path d="M7 41 37 11"/><path d="M39.5 8.5c1.5 1.500-.500 4-2.500 6s-4.500 4-6 2.500.500-4 2.500-6 4.500-4 6-2.500Z"/><path d="M36 12c9-5 8 9-2 10-9 1-13 9-21 6"/>',
  gear: '<circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="3.500"/><path d="M22 6h4v5h-4zM22 37h4v5h-4zM6 22h5v4H6zM37 22h5v4h-5zM10 12.800l2.800-2.800 3.600 3.600-2.800 2.800zM31.600 34.400l2.800-2.800 3.600 3.600-2.800 2.800zM10 35.200l3.600-3.600 2.800 2.800-3.600 3.600zM31.600 13.600l3.600-3.600 2.800 2.800-3.600 3.600z"/>',
  led: '<path d="M16 27v-9a8 8 0 0 1 16 0v9ZM13 27h22M20 27v15M28 27v11"/><path d="M21 15c1-2 3-3 5-2"/>',
  button: '<circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="10.500"/><circle cx="20.500" cy="20.500" r="1.600"/><circle cx="27.500" cy="20.500" r="1.600"/><circle cx="20.500" cy="27.500" r="1.600"/><circle cx="27.500" cy="27.500" r="1.600"/>',
  die: '<path d="M9 16 26 8l14 9v17l-16 8-15-9Z"/><path d="M9 16l15 8 16-7M24 24v18"/><circle cx="16" cy="27" r="1.300"/><circle cx="19" cy="33" r="1.300"/><circle cx="32" cy="26" r="1.300"/><circle cx="24.500" cy="15" r="1.300"/>',
  key: '<circle cx="13" cy="15" r="7"/><circle cx="13" cy="15" r="2.500"/><path d="M18 20 38 40M31 33l-4 4M35 37l-3 3"/>',
  thimble: '<path d="M14 38c0-17 3-27 10-27s10 10 10 27ZM11 38h26"/><path d="M19 22h.1M24 20h.1M29 22h.1M21 27h.1M27 27h.1M19 32h.1M24 31h.1M29 32h.1" stroke-linecap="round"/>',
  moth: '<path d="M24 15v19M24 19c-5-9-16-9-15-1 1 6 8 9 15 5M24 19c5-9 16-9 15-1-1 6-8 9-15 5M24 27c-5 0-9 4-7 8 2 3 6 1 7-4M24 27c5 0 9 4 7 8-2 3-6 1-7-4M22 14l-3-5M26 14l3-5"/>',
};
export const CRITTERS = Object.keys(S);
export const critterSprite = () => `<svg class="sprite" aria-hidden="true" focusable="false">${Object.entries(S).map(([k, d]) => `<symbol id="c-${k}" viewBox="0 0 48 48">${d.replace(/(\d)\.(\d)00\b/g, '$1.$2')}</symbol>`).join('')}</svg>`;
export const critterSvg = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${S[k].replace(/(\d)\.(\d)00\b/g, '$1.$2')}</svg>`;
