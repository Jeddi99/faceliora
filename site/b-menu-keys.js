'use strict';
// R18: arrow keys for the Products menu (native <details class="drop">). Enter/Space open and close natively;
// Escape, outside click, focus-leave and resize stay in b-menu.js (the approved R15 menu.js, unchanged).
// ArrowDown on the trigger opens the panel and focuses its first link; ArrowUp/ArrowDown/Home/End move between
// the panel's links. No storage, no network.
(() => {
 const drop=document.querySelector('details.drop');if(!drop)return;
 const sum=drop.querySelector('summary');if(!sum)return;
 const links=()=>[...drop.querySelectorAll('.panel a[href]')].filter(a=>a.getClientRects().length>0);
 sum.addEventListener('keydown',e=>{
  if(e.key!=='ArrowDown')return;
  e.preventDefault();
  if(!drop.open)drop.open=true;
  links()[0]?.focus();
 });
 drop.addEventListener('keydown',e=>{
  if(!drop.open||e.target===sum||!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  const l=links(),i=l.indexOf(document.activeElement);if(i<0)return;
  e.preventDefault();
  const n=e.key==='Home'?0:e.key==='End'?l.length-1:(i+(e.key==='ArrowDown'?1:-1)+l.length)%l.length;
  l[n].focus();
 });
})();
