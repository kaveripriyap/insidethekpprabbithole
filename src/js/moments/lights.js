// A light switch on the case. Flip it and the room goes dark around the thing.
// The photograph itself is never changed.
export default function lights(art) {
  const kase = art.querySelector('.case');
  if (!kase) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'lightswitch'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Flip the lights off and on');
  kase.appendChild(b);
  b.addEventListener('click', () => { const off = document.body.classList.toggle('lights-out'); b.setAttribute('aria-pressed', String(off)); });
}
