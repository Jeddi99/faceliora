'use strict';
// Product-only per-tab opportunity. No locale, identifiers or timestamps stored.
(() => {
 const overlay=document.getElementById('intro');
 let active=false,timer=0,safety=0;
 function finish(reason,focus=false){
  const wasActive=active;active=false;
  clearTimeout(timer);clearTimeout(safety);
  if(overlay)overlay.hidden=true;
  document.documentElement.dataset.introState=reason;
  if(wasActive&&focus){
   // Home initializes before destination parsing: resolve the target on dismissal.
   const focusMain=()=>document.getElementById('main')?.focus({preventScroll:true});
   if(document.getElementById('main'))focusMain();
   else document.addEventListener('DOMContentLoaded',focusMain,{once:true});
  }
 }
 try {
  const base=new URL('./',document.baseURI),url=new URL(location.href);
  if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
  const route=url.pathname.slice(base.pathname.length);
  const known=/^(th|en)\/(?:(?:for-you|clinic|pricing|faq)\/)?(?:index\.html)?$/.test(route);
  if(!known)return;
  if(window.__facelioraIntroSeen){finish('already-seen');return;}
  window.__facelioraIntroSeen=true;
  const key='faceliora:intro:r11-b:seen';
  const storage=window.sessionStorage;
  const seen=storage.getItem(key)==='1';
  storage.setItem(key,'1');
  const home=/^(th|en)\/(?:index\.html)?$/.test(route);
  if(!home||!overlay){finish('detail');return;}
  // Timing alone survives some restores. Require a fresh Navigation API
  // activation too; absent/ambiguous signals fail open, without tracking.
  const timing=performance.getEntriesByType('navigation')[0];
  const activation=window.navigation?.activation;
  const from=activation?.from,entry=activation?.entry;
  if(document.wasDiscarded!==false||document.prerendering||!timing||!activation||!entry){finish('uncertain-entry');return;}
  const reload=timing.type==='reload'&&activation.navigationType==='reload'&&
   !!from&&!!from.id&&!!from.key&&from.id===entry.id&&from.key===entry.key&&from.url===url.href;
  const initial=timing.type==='navigate'&&['push','replace'].includes(activation.navigationType);
  if(!reload&&!initial){finish('restore-or-uncertain');return;}
  if(seen&&!reload){finish('already-seen');return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||document.hidden){finish(reduced.matches?'reduced-motion':'background');return;}
  document.getElementById('skip').addEventListener('click',()=>finish('skip',true));
  document.addEventListener('keydown',e=>{
   if(!active||['Shift','Control','Alt','Meta'].includes(e.key))return;
   if(e.key==='Tab'){finish('focus-continue');return;}
   if(['Escape','Enter',' '].includes(e.key))e.preventDefault();
   finish('keyboard',true);
  });
  document.addEventListener('focusin',e=>{if(active&&!overlay.contains(e.target))finish('focus-continue');});
  for(const event of ['pointerdown','touchstart','wheel','touchmove','scroll'])addEventListener(event,()=>{if(active)finish('input',true);},{passive:true});
  addEventListener('pagehide',()=>finish('pagehide'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish('background');});
  reduced.addEventListener('change',()=>{if(reduced.matches)finish('reduced-motion');});
  addEventListener('error',()=>finish('error'));
  addEventListener('unhandledrejection',()=>finish('error'));
  timer=setTimeout(()=>finish('complete'),1600);
  safety=setTimeout(()=>finish('safety'),2100);
  active=true;overlay.hidden=false;document.documentElement.dataset.introState='playing';
 } catch {finish('error');}
})();
