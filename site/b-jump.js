'use strict';
// R18_D1: Home has <base href="../">, so its in-page jump link is written base-relative
// (th/index.html#system). Without JS that loads Home at the section. With JS, when the link
// points at this same page (/th/ or /th/index.html), stay in the document: no reload, no intro.
(() => {
 const norm = p => p.replace(/index\.html$/, '');
 document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a.jump[href*="#"]');
  if (!a) return;
  const u = new URL(a.href);
  if (u.origin !== location.origin || norm(u.pathname) !== norm(location.pathname) || u.hash.length < 2) return;
  if (!document.getElementById(decodeURIComponent(u.hash.slice(1)))) return;
  e.preventDefault();
  location.hash = u.hash;
 });
})();
