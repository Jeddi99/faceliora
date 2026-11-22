/* R72 proposal, presentation only (design mockup; Dev may port it as-is or fold it into a page script, NOT into the consent logic).
   While the consent bar #cc is visible, publish its measured height as --r72-cc-h and put .r72-cc-on on <html>.
   r72-bar.css then adds that much bottom padding to <body> and scroll-padding-bottom, so the last lines of the page and any
   keyboard-focused element can always be brought above the bar (WCAG 2.2 SC 2.4.11 Focus Not Obscured).
   No storage, no network, no cookies, no change to what any button means. */
(function () {
  'use strict';
  var r = document.documentElement, tries = 0;
  function hook(cc) {
    function upd() {
      var on = !cc.hidden;
      r.classList.toggle('r72-cc-on', on);
      if (on) r.style.setProperty('--r72-cc-h', cc.offsetHeight + 'px'); else r.style.removeProperty('--r72-cc-h');
    }
    if (window.ResizeObserver) new ResizeObserver(upd).observe(cc);
    new MutationObserver(upd).observe(cc, { attributes: true, attributeFilter: ['hidden', 'class'] });
    window.addEventListener('resize', upd);
    upd();
  }
  function find() { var cc = document.getElementById('cc'); if (cc) hook(cc); else if (++tries < 200) setTimeout(find, 50); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', find); else find();
})();
