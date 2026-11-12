'use strict';
// R20: Clinic / For-you / Pricing keep R14's <base href="../../"> (intro.js and entry.js read document.baseURI),
// so their in-page links are written base-relative (th/clinic/index.html#ch-1), the R14 convention.
// Without JS that loads the page at the section. With JS, a link inside <main> that points at this same page
// stays in the document: no reload. Same rule as R18 b-jump.js, for every in-page link in <main>.
(() => {
 const norm = p => p.replace(/index\.html$/, '');
 document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('main a[href*="#"]');
  if (!a || a.target) return;
  const u = new URL(a.href);
  if (u.origin !== location.origin || norm(u.pathname) !== norm(location.pathname) || u.hash.length < 2) return;
  if (!document.getElementById(decodeURIComponent(u.hash.slice(1)))) return;
  e.preventDefault();
  location.hash = u.hash;
 });
})();
