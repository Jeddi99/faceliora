'use strict';
// R15-B signature: the map's connecting lines draw in once when the map first scrolls into view.
// Lines are visible by default (no JS, reduced motion, no IntersectionObserver).
(() => {
 const map=document.querySelector('.map');
 if(!map||!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){map?.classList.add('in');return;}
 const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){map.classList.add('in');io.disconnect();}},{threshold:.35});
 map.classList.add('armed');io.observe(map);
})();
