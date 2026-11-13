// Two meshing gears behind the case that turn as you scroll.
const GEAR = '<circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="3.5"/><path d="M22 6h4v5h-4zM22 37h4v5h-4zM6 22h5v4H6zM37 22h5v4h-5zM10 12.8l2.8-2.8 3.6 3.6-2.8 2.8zM31.6 34.4l2.8-2.8 3.6 3.6-2.8 2.8zM10 35.2l3.6-3.6 2.8 2.8-3.6 3.6zM31.6 13.6l3.6-3.6 2.8 2.8-3.6 3.6z"/>';
export default function gears(art, { reduce }) {
  const kase = art.querySelector('.case');
  if (!kase) return;
  const box = document.createElement('div');
  box.className = 'gearbox'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `<svg viewBox="0 0 48 48">${GEAR}</svg><svg viewBox="0 0 48 48">${GEAR}</svg>`;
  kase.appendChild(box);
  const [a, b] = box.children;
  const turn = () => { const d = scrollY * 0.18; a.style.transform = `rotate(${d}deg)`; b.style.transform = `rotate(${-d * (60 / 42) + 22}deg)`; };
  turn();
  if (!reduce) addEventListener('scroll', turn, { passive: true });
}
