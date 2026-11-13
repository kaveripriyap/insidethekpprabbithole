// What time it is where we are.
const els = [...document.querySelectorAll('time[data-tz]')];
function tick() {
  const now = new Date();
  for (const el of els) {
    try { el.textContent = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', weekday: 'short', timeZone: el.dataset.tz }).format(now); el.dateTime = now.toISOString(); }
    catch { el.textContent = ''; }
  }
}
if (els.length) { tick(); setInterval(tick, 20000); }
