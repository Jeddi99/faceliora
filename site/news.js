'use strict';
// R26 shared (design review): the event gallery strip. Without script the strip scrolls natively (scroll-snap, focusable,
// labelled); with script previous / next buttons appear and the live count follows the photo at the start of the strip.
(() => {
 for (const g of document.querySelectorAll('.gal')) {
  const track = g.querySelector('.gal-track'), ctl = g.querySelector('.gal-ctl');
  if (!track || !ctl) continue;
  const items = [...track.children], cur = ctl.querySelector('[data-cur]');
  const [prev, next] = ctl.querySelectorAll('.gal-btn');
  const fits = () => track.scrollWidth <= track.clientWidth + 2;
  const index = () => {
   const x = track.scrollLeft, w = track.scrollWidth - track.clientWidth;
   if (x >= w - 2) return items.length - 1;
   let best = 0, d = Infinity;
   items.forEach((li, i) => { const e = Math.abs(li.offsetLeft - track.offsetLeft - x); if (e < d) { d = e; best = i; } });
   return best;
  };
  const sync = () => {
   ctl.hidden = fits();
   const i = index();
   cur.textContent = String(i + 1);
   prev.disabled = track.scrollLeft <= 2;
   next.disabled = i >= items.length - 1 || track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const go = dir => {
   const i = Math.min(items.length - 1, Math.max(0, index() + dir));
   track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
  let t = 0;
  track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
  addEventListener('resize', sync);
  sync();
 }
})();
