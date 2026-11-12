'use strict';
// Public entry only. Relative base preserves the static site's mount.
(() => {
 try {
  const base=new URL('./',document.baseURI);
  if(location.pathname!==base.pathname&&location.pathname!==base.pathname+'index.html')return;
  let locale='en';
  const values=new URLSearchParams(location.search).getAll('lang');
  if(values.length===1&&/^(th|en)$/i.test(values[0]))locale=values[0].toLowerCase();
  else {
   try {
    const list=navigator.languages;
    const preferences=Array.isArray(list)&&list.length?list:[navigator.language];
    for(const tag of preferences){
     if(typeof tag==='string'&&/^(th|en)(?:-[a-z0-9]{1,8})*$/i.test(tag)){locale=tag.split('-')[0].toLowerCase();break;}
    }
   } catch { locale='en'; }
  }
  const target=new URL(locale+'/',base);
  if(location.hash==='#main')target.hash='main';
  location.replace(target);
 } catch { /* Static bilingual links stay usable. No retries. */ }
})();
