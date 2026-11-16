/* R60 header CTA option B: toggles html.is-scrolled after 8px of scroll (outline -> solid). Runs on load too, so an anchor landing mid-page is already solid. No network, no storage. */
(function(){
 var r=document.documentElement;
 function f(){r.classList.toggle('is-scrolled',(window.scrollY||0)>8);}
 f();addEventListener('scroll',f,{passive:true});addEventListener('pageshow',f);
})();
