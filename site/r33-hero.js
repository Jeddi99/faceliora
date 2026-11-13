'use strict';
// R34 Home video band behaviour. Poster is the first frame of the loop, so a missing/blocked video leaves the poster.
// Plays only when: not reduced-motion, intro finished (or no intro), tab visible, >= 25% in view, user has not paused.
// preload="none": the video file is requested only when play() is first called (never under reduced motion). Same-origin files only.
(() => {
 const root = document.documentElement;
 const rm = matchMedia('(prefers-reduced-motion: reduce)');
 for (const fig of document.querySelectorAll('.r33-media')) {
  const v = fig.querySelector('video'), btn = fig.querySelector('.r33-pause');
  if (!v) continue;
  let paused = false, inView = false;
  const introDone = () => root.dataset.introState !== 'playing';
  const can = () => !rm.matches && !paused && inView && introDone() && !document.hidden;
  const sync = () => {
   if (can()) { const p = v.play(); if (p) p.then(() => v.classList.add('is-on')).catch(() => {}); }
   else v.pause();
   if (btn) {
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', (paused ? btn.dataset.labelPlay : btn.dataset.labelPause) || '');
   }
  };
  if (btn) {
   // R40: control is transparent until hover/focus/paused. On touch, the first tap (anywhere on the video, incl. the hidden control) only reveals it for ~3 s.
   let peekT = 0, hiddenAtTouch = false;
   const peek = () => { fig.classList.add('is-peek'); clearTimeout(peekT); peekT = setTimeout(() => fig.classList.remove('is-peek'), 3000); };
   fig.addEventListener('pointerdown', e => { hiddenAtTouch = e.pointerType !== 'mouse' && !paused && !fig.classList.contains('is-peek'); }, true);
   fig.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') peek(); });
   btn.addEventListener('click', () => {
    if (hiddenAtTouch) { hiddenAtTouch = false; return; }
    paused = !paused; sync();
    if (fig.classList.contains('is-peek')) peek();
   });
  }
  new IntersectionObserver(es => { inView = es[es.length - 1].isIntersecting; sync(); }, { threshold: .25 }).observe(fig);
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-intro-state'] });
  document.addEventListener('visibilitychange', sync);
  rm.addEventListener('change', sync);
  sync();
 }
})();
