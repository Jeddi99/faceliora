'use strict';
// Product-only per-tab opportunity. No locale, identifiers or timestamps stored.
// R13 Option A hand-off (ux-r13-intro-handoff-v1): trigger rules unchanged from R12; only the
// hand-off builder, finish() cleanup and the complete/safety timers (2050/2400 ms) change.
(() => {
 const overlay=document.getElementById('intro');
 const root=document.documentElement;
 const EASE='cubic-bezier(.16,1,.3,1)',SOFT='cubic-bezier(.4,0,.2,1)';
 const COMPLETE=2050,SAFETY=2400,BUILD=600,RETARGET=1290;
 let active=false,timer=0,safety=0,build=0,retarget=0,t0=null,anims=[],spans=null,img=null,imgStyle=null;
 // Undo every hand-off trace: animations, line wrappers, run class, intro <img> inline style.
 function cleanup(){
  clearTimeout(build);clearTimeout(retarget);
  for(const a of anims){try{a.cancel();}catch{}}
  anims=[];unwrap();root.classList.remove('r13-run');
  if(img){imgStyle===null?img.removeAttribute('style'):img.setAttribute('style',imgStyle);img=null;}
 }
 function finish(reason,focus=false){
  const wasActive=active;active=false;
  clearTimeout(timer);clearTimeout(safety);
  try{cleanup();}catch{}
  if(overlay)overlay.hidden=true;
  document.documentElement.dataset.introState=reason;
  if(wasActive&&focus){
   // Home initializes before destination parsing: resolve the target on dismissal.
   const focusMain=()=>document.getElementById('main')?.focus({preventScroll:true});
   if(document.getElementById('main'))focusMain();
   else document.addEventListener('DOMContentLoaded',focusMain,{once:true});
  }
 }

 // ---- Option A hand-off: the photo window lands on the hero photo's real box and crop. ----
 function anim(el,keyframes,timing,pseudo){
  if(!el)return null;
  const a=el.animate(keyframes,{fill:'both',...timing,...(pseudo?{pseudoElement:pseudo}:{})});
  a.startTime=t0;anims.push(a);return a;
 }
 const rise=dy=>[{opacity:0,transform:`translateY(${dy}px)`},{opacity:1,transform:'none'}];
 function natural(el,fallback){
  const w=el.naturalWidth||fallback.naturalWidth||+el.getAttribute('width')||2;
  const h=el.naturalHeight||fallback.naturalHeight||+el.getAttribute('height')||3;
  return [w,h];
 }
 // Rendered object-fit:cover box of an image inside `box` (object-position from computed style).
 function cover(box,el,fallback){
  const [px,py]=getComputedStyle(el).objectPosition.split(' ').map(v=>parseFloat(v)/100);
  const [nw,nh]=natural(el,fallback),s=Math.max(box.width/nw,box.height/nh);
  return {w:nw*s,h:nh*s,x:box.left+(box.width-nw*s)*px,y:box.top+(box.height-nh*s)*py};
 }
 function unwrap(){
  if(!spans)return;
  for(const s of spans){while(s.firstChild)s.parentNode.insertBefore(s.firstChild,s);s.remove();}
  spans=null;
 }
 function lineBoxes(el){
  const rects=[],walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  for(let n;(n=walk.nextNode());){const r=document.createRange();r.selectNodeContents(n);rects.push(...r.getClientRects());}
  const out=[];
  for(const b of rects){
   if(b.width<.5)continue;
   const hit=out.find(x=>Math.abs(x.top-b.top)<3);
   if(hit){hit.left=Math.min(hit.left,b.left);hit.right=Math.max(hit.right,b.right);hit.bottom=Math.max(hit.bottom,b.bottom);}
   else out.push({left:b.left,right:b.right,top:b.top,bottom:b.bottom});
  }
  return out.sort((x,y)=>x.top-y.top).map(x=>[x.left,x.right,x.top,x.bottom].map(v=>Math.round(v*4)/4));
 }
 // Per-line wrappers (runtime only) are kept only if the headline geometry is identical; else the h1 moves whole.
 function wrapLines(h1){
  const geo=()=>JSON.stringify([lineBoxes(h1),h1.getBoundingClientRect().height,h1.parentNode.getBoundingClientRect().height]);
  const before=geo(),made=[];let cur=null;
  for(const n of [...h1.childNodes]){
   if(n.nodeName==='BR'){cur=null;continue;}
   if(!cur){cur=document.createElement('span');cur.className='r13-line';h1.insertBefore(cur,n);made.push(cur);}
   cur.appendChild(n);
  }
  spans=made;
  if(made.length<2||geo()!==before){unwrap();return [h1];}
  return made;
 }
 function measure(){
  const hero=document.querySelector('.hero'),photo=hero.querySelector('.hero-photo');
  const stage=overlay.querySelector('.intro-stage').getBoundingClientRect(),box=photo.getBoundingClientRect();
  return {phone:matchMedia('(max-width:699px)').matches,stage,box,
   win:overlay.querySelector('.photo-window'),introImg:overlay.querySelector('.photo-window img'),heroImg:photo.querySelector('img'),
   header:document.querySelector('.header'),h1:hero.querySelector('h1'),lead:hero.querySelector('.lead'),
   actions:hero.querySelector('.actions'),caption:photo.querySelector('figcaption')};
 }
 const land=(S,H)=>`inset(${Math.max(0,H.top-S.top).toFixed(1)}px ${Math.max(0,S.right-H.right).toFixed(1)}px ${Math.max(0,S.bottom-H.bottom).toFixed(1)}px ${Math.max(0,H.left-S.left).toFixed(1)}px)`;
 // translate/scale that turns the intro crop into the hero crop. The intro <img> is first re-expressed once at its
 // full cover size (identical pixels while still a band) so scaling never exposes the element edge.
 function mapping(m,B){
  const a=cover(B,m.introImg,m.introImg),b=cover(m.box,m.heroImg,m.introImg);
  if(!img){img=m.introImg;imgStyle=img.getAttribute('style');}
  // Attribute string, not img.style: Chrome re-creates an empty style="" after removal once the CSSOM object was used.
  img.setAttribute('style',`${imgStyle?imgStyle+';':''}position:absolute;max-width:none;object-fit:fill;left:${a.x-B.left}px;top:${a.y-B.top}px;width:${a.w}px;height:${a.h}px`);
  return `translate(${(b.x-a.x).toFixed(2)}px,${(b.y-a.y).toFixed(2)}px) scale(${(b.w/a.w).toFixed(5)})`;
 }
 function handoff(){
  if(!active)return;
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',handoff,{once:true});return;}
  try{
   // One timeline: every hand-off animation starts at the overlay's own CSS animation start.
   const css=overlay.getAnimations().find(a=>a.startTime!==null);
   const now=document.timeline.currentTime;
   t0=css?css.startTime:now-BUILD;
   const m=measure(),B=m.introImg.getBoundingClientRect(),band=m.phone?'inset(38% 0% 21% 0%)':'inset(35% 0% 15% 0%)';
   const to=mapping(m,B);
   const win=anim(m.win,[{clipPath:band},{clipPath:land(m.stage,m.box)}],{delay:800,duration:600,easing:EASE,fill:'forwards'});
   const photo=anim(m.introImg,[{transform:'none'},{transform:to}],{delay:800,duration:600,easing:EASE,fill:'forwards'});
   anim(m.win,[{opacity:0},{opacity:1}],{delay:900,duration:450,easing:SOFT,fill:'forwards'},'::after');
   anim(overlay,[{opacity:1},{opacity:0}],{delay:1300,duration:200,fill:'forwards'},'::before');
   for(const s of ['.intro-locale','#skip'])anim(overlay.querySelector(s),[{opacity:1},{opacity:0}],{delay:1300,duration:200,fill:'forwards'});
   anim(overlay,[{visibility:'hidden'},{visibility:'hidden'}],{delay:1500,duration:1,fill:'forwards'});
   anim(m.header,rise(-12),{delay:1330,duration:360,easing:EASE});
   const L=wrapLines(m.h1),stagger=L.length>1?Math.min(70,120/(L.length-1)):0;
   L.forEach((el,i)=>anim(el,rise(28),{delay:1400+i*stagger,duration:480,easing:EASE}));
   anim(m.lead,rise(20),{delay:1540,duration:440,easing:EASE});
   anim(m.actions,rise(16),{delay:1610,duration:400,easing:EASE});
   anim(m.caption,[{opacity:0},{opacity:1}],{delay:1660,duration:340,easing:SOFT});
   root.classList.add('r13-run');  // same task as the animations: CSS hold -> timeline, no frame in between
   const elapsed=now-t0;
   clearTimeout(timer);timer=setTimeout(()=>finish('complete'),Math.max(0,COMPLETE-elapsed));
   // SPEC §7 A: if the hero box moved after measuring (late font swap), retarget the landing before it ends.
   retarget=setTimeout(()=>{
    if(!active)return;
    try{
     const box=m.heroImg.closest('.hero-photo').getBoundingClientRect();
     if(Math.abs(box.top-m.box.top)+Math.abs(box.height-m.box.height)+Math.abs(box.left-m.box.left)+Math.abs(box.width-m.box.width)<.5)return;
     m.box=box;
     win.effect.setKeyframes([{clipPath:band},{clipPath:land(m.stage,box)}]);
     photo.effect.setKeyframes([{transform:'none'},{transform:mapping(m,B)}]);
    }catch{finish('error');}
   },Math.max(0,RETARGET-elapsed));
  }catch{finish('error');}
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
  timer=setTimeout(()=>finish('complete'),COMPLETE);
  safety=setTimeout(()=>finish('safety'),SAFETY);
  build=setTimeout(handoff,BUILD);
  active=true;overlay.hidden=false;document.documentElement.dataset.introState='playing';
 } catch {finish('error');}
})();
