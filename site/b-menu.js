'use strict';
// R15 header menus. Each menu is a native <details>, so it opens and closes with no script at all;
// this file only adds: one open menu at a time, Escape returns focus to its trigger, outside click and
// focus-leave close, and closing on resize. No storage, no network.
(() => {
 const menus=[...document.querySelectorAll('details.drop, details.sheet')];
 const close=(d,{restore=false}={})=>{if(!d.open)return;d.open=false;if(restore)d.querySelector('summary')?.focus({preventScroll:true});};
 for(const d of menus){
  d.addEventListener('toggle',()=>{
   const s=d.querySelector('summary');s?.setAttribute('aria-expanded',String(d.open));
   if(d.open)for(const o of menus)if(o!==d)close(o);
  });
  d.querySelector('summary')?.setAttribute('aria-expanded',String(d.open));
 }
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const open=menus.find(d=>d.open);if(!open)return;
  e.preventDefault();close(open,{restore:true});
 });
 document.addEventListener('pointerdown',e=>{for(const d of menus)if(d.open&&!d.contains(e.target))close(d);});
 document.addEventListener('focusin',e=>{for(const d of menus)if(d.open&&!d.contains(e.target))close(d);});
 addEventListener('resize',()=>{for(const d of menus)close(d);});
 addEventListener('pageshow',()=>{for(const d of menus)close(d);});
 // Pending intentions have no endpoint, collection or success state.
 document.querySelectorAll('[aria-disabled="true"]').forEach(b=>b.addEventListener('click',e=>e.preventDefault()));
 document.documentElement.classList.add('js');
})();
