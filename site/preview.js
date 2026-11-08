'use strict';
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const trigger=document.querySelector('.menu-toggle');
 const panel=document.querySelector('.product-panel');
 let menuAnimation=null, menuOpen=false, serial=0;
 function menu(next,{restore=false,immediate=false}={}){
  if(!trigger||!panel)return;
  const wasHidden=panel.hidden;
  const before=wasHidden?{opacity:'0',transform:'translateY(-8px)'}:{opacity:getComputedStyle(panel).opacity,transform:getComputedStyle(panel).transform};
  menuOpen=next;const n=++serial;
  menuAnimation?.cancel();menuAnimation=null;
  trigger.setAttribute('aria-expanded',String(next));
  panel.inert=!next;
  if(restore)trigger.focus({preventScroll:true});
  if(next)panel.hidden=false;
  if(reduce.matches||immediate){panel.hidden=!next;return;}
  if(wasHidden&&!next){panel.hidden=true;return;}
  menuAnimation=panel.animate([before,{opacity:next?1:0,transform:next?'translateY(0)':'translateY(-8px)'}],{duration:next?280:180,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  menuAnimation.finished.then(()=>{
   if(n!==serial)return;
   if(!menuOpen)panel.hidden=true;
   menuAnimation.cancel();menuAnimation=null;
  }).catch(()=>{});
 }
 if(trigger&&panel){
  panel.hidden=true;panel.inert=true;trigger.hidden=false;
  trigger.addEventListener('click',()=>menu(!menuOpen));
  trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();menu(true);[...panel.querySelectorAll('a')].find(a=>a.getClientRects().length>0)?.focus();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen){e.preventDefault();menu(false,{restore:true});}});
  document.addEventListener('pointerdown',e=>{if(menuOpen&&!panel.contains(e.target)&&!trigger.contains(e.target))menu(false);});
  document.addEventListener('focusin',e=>{if(menuOpen&&!panel.contains(e.target)&&!trigger.contains(e.target))menu(false);});
  panel.addEventListener('click',e=>{if(e.target.closest('a'))menu(false,{immediate:true});});
  addEventListener('pagehide',()=>menu(false,{immediate:true}));
  addEventListener('pageshow',()=>menu(false,{immediate:true}));
  addEventListener('resize',()=>{if(menuOpen)menu(false,{immediate:true});});
 }
 document.querySelectorAll('details').forEach(details=>{
  const summary=details.querySelector('summary'), answer=details.querySelector('.answer');
  if(!summary||!answer)return;
  let wanted=details.open, animation=null, revision=0;
  summary.setAttribute('aria-expanded',String(wanted));answer.inert=!wanted;
  summary.addEventListener('click',e=>{
   e.preventDefault();wanted=!wanted;const n=++revision;
   const wasClosed=!details.open;
   const previous=wasClosed?{opacity:'0',transform:'translateY(-4px)'}:{opacity:getComputedStyle(answer).opacity,transform:getComputedStyle(answer).transform};
   animation?.cancel();animation=null;
   summary.setAttribute('aria-expanded',String(wanted));answer.inert=!wanted;
   if(wanted)details.open=true;
   if(reduce.matches){details.open=wanted;return;}
   animation=answer.animate([previous,{opacity:wanted?1:0,transform:wanted?'translateY(0)':'translateY(-4px)'}],{duration:wanted?200:140,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
   animation.finished.then(()=>{if(n!==revision)return;if(!wanted)details.open=false;animation.cancel();animation=null;}).catch(()=>{});
  });
  reduce.addEventListener('change',()=>{revision++;animation?.cancel();animation=null;details.open=wanted;answer.inert=!wanted;});
 });
 reduce.addEventListener('change',()=>{if(trigger)menu(menuOpen,{immediate:true});document.getAnimations().forEach(a=>a.cancel());});
 // Pending intentions have no endpoint, collection, persistence or synthetic success.
 document.querySelectorAll('[aria-disabled="true"]').forEach(b=>b.addEventListener('click',e=>e.preventDefault()));
 document.documentElement.classList.add('js');
})();
