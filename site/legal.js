'use strict';
// R30 legal-page behaviour (A: both pages; B: credits; C: credits). Option B privacy and option C privacy need nothing
// beyond menu.js. No network, no storage. Without this file every section, row, card and detail is on the page and
// every in-page link jumps. This file only adds:
//  • A: the contents rail / group rail marks the section whose heading passed 160px (or 35% of a short screen) (phones: a sticky sideways row kept in view)
//  • B credits: the cards' details start closed (the HTML ships them open), "เปิด/ปิดรายละเอียดทุกภาพ", group links become
//    filter buttons; a link to #img-… opens that card and clears the filter if it hid it
//  • C credits: an on-page text filter over the rows already on the page, a live count, per-group counts, an empty state
//    with suggestions; matches are painted with the CSS Highlight API (text is never rewritten)
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const hashEl=()=>{if(!location.hash)return null;try{return document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch(e){return null;}};
 const hooks=[];
 const reveal=({scroll=true}={})=>{const el=hashEl();if(!el)return;for(const f of hooks)f(el);if(scroll)requestAnimationFrame(()=>el.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'}));};
 addEventListener('hashchange',()=>reveal());

 // A: rail marks the section whose heading has passed 35% of the screen height (above the first, the first)
 const rail=document.querySelector('[data-spy]');
 if(rail){
  const links=new Map([...rail.querySelectorAll('a[href^="#"]')].map(a=>[a.getAttribute('href').slice(1),a]));
  const secs=[...links.keys()].map(id=>document.getElementById(id)).filter(Boolean);
  let raf=0,last=null;
  const mark=()=>{raf=0;const line=Math.min(innerHeight*.35,160);let cur=secs[0]?.id;
   for(const s of secs)if(s.getBoundingClientRect().top<=line)cur=s.id;
   if(cur===last)return;last=cur;
   for(const [id,a] of links){if(id===cur)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
   const a=links.get(cur),row=a&&a.closest('ol');
   if(row&&row.scrollWidth>row.clientWidth){const r=a.getBoundingClientRect(),q=row.getBoundingClientRect();
    if(r.left<q.left||r.right>q.right)row.scrollTo({left:a.offsetLeft-24,behavior:reduce?'auto':'smooth'});}};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(mark);},{passive:true});
  addEventListener('resize',()=>{last=null;mark();});
  mark();
 }

 // B: image wall
 const dets=[...document.querySelectorAll('details[data-det]')];
 if(dets.length){
  const target=hashEl();
  for(const d of dets)d.open=!!(target&&d.closest('li')===target);
  const alls=[...document.querySelectorAll('[data-toggle-det]')];
  const sync=()=>{const open=dets.every(d=>d.open);for(const all of alls){all.textContent=open?all.dataset.close:all.dataset.open;all.setAttribute('aria-pressed',String(open));}};
  for(const all of alls){all.hidden=false;all.addEventListener('click',()=>{const open=!dets.every(d=>d.open);for(const d of dets)d.open=open;sync();});}
  dets.forEach(d=>d.addEventListener('toggle',sync));sync();
  const nav=document.querySelector('[data-chips]'),groups=[...document.querySelectorAll('section[data-group]')];
  const chips=[...nav.querySelectorAll('a[data-filter]')].map(a=>{const b=document.createElement('button');b.type='button';b.className=a.className;b.dataset.filter=a.dataset.filter;b.innerHTML=a.innerHTML;
   b.setAttribute('aria-pressed',String(a.dataset.filter==='all'));a.replaceWith(b);return b;});
  const live=document.createElement('p');live.className='sr';live.setAttribute('aria-live','polite');document.body.append(live);
  const pick=k=>{for(const s of groups)s.hidden=!(k==='all'||s.dataset.group===k);for(const x of chips)x.setAttribute('aria-pressed',String(x.dataset.filter===k));
   const b=chips.find(x=>x.dataset.filter===k);live.textContent=b?b.textContent.replace(/\s+/g,' ').trim():'';};
  // after a pick, bring the first group shown up under the sticky bar (only when the list has scrolled past it)
  for(const b of chips)b.addEventListener('click',()=>{pick(b.dataset.filter);const first=groups.find(s=>!s.hidden),bar=nav.closest('.b-bar');
   if(first&&first.getBoundingClientRect().top<bar.getBoundingClientRect().bottom+8)first.scrollIntoView({block:'start',behavior:'auto'});});
  hooks.push(el=>{const li=el.closest('li.b-img');if(!li)return;if(li.closest('[hidden]'))pick('all');li.querySelector('details').open=true;});
  if(target)reveal();
 }

 // C: on-page text filter
 const box=document.querySelector('[data-find]');
 if(box){
  box.hidden=false;
  const q=box.querySelector('input'),clear=box.querySelector('[data-clear]'),count=box.querySelector('[data-count]');
  const empty=document.querySelector('[data-empty]'),word=empty.querySelector('[data-word]');
  const items=[...document.querySelectorAll('li.c-item')],groups=[...document.querySelectorAll('section[data-group]')];
  const norm=s=>s.normalize('NFC').toLowerCase().replace(/[\u200b-\u200d\u00ad]/g,'').replace(/\s+/g,' ').trim();
  const text=new Map(items.map(li=>[li,norm(li.dataset.text)]));
  const used=new Map(items.map(li=>[li,li.querySelector('details.c-used')]));
  const HL='CSS' in window&&CSS.highlights&&typeof Highlight==='function';
  const paint=terms=>{if(!HL)return;CSS.highlights.delete('cred-find');if(!terms.length)return;const ranges=[];
   for(const li of items){if(li.hidden)continue;const w=document.createTreeWalker(li,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){const s=n.textContent.toLowerCase();for(const t of terms){let i=s.indexOf(t);while(i>-1){const r=new Range();r.setStart(n,i);r.setEnd(n,i+t.length);ranges.push(r);i=s.indexOf(t,i+t.length);}}}}
   CSS.highlights.set('cred-find',new Highlight(...ranges));};
  const run=()=>{
   const raw=q.value,terms=norm(raw).split(' ').filter(Boolean);let n=0;
   for(const li of items){const ok=terms.every(t=>text.get(li).includes(t));li.hidden=!ok;if(ok)n++;
    const d=used.get(li);if(d){if(terms.length){d.dataset.was??=String(d.open);d.open=ok&&terms.some(t=>norm(d.textContent).includes(t))||d.dataset.was==='true';}else if(d.dataset.was){d.open=d.dataset.was==='true';delete d.dataset.was;}}}
   for(const s of groups){const m=s.querySelectorAll('li.c-item:not([hidden])').length;s.hidden=m===0;
    const c=document.querySelector(`[data-n="${s.dataset.group}"]`);if(c){c.textContent=m;c.classList.toggle('is-zero',m===0);}}
   count.textContent=count.dataset.tpl.replace('{n}',n).replace('{t}',count.dataset.total);
   clear.hidden=!raw;empty.hidden=n>0;word.textContent=raw.trim();paint(terms);
  };
  q.addEventListener('input',run);
  q.addEventListener('keydown',e=>{if(e.key==='Escape'&&q.value){e.preventDefault();q.value='';run();}});
  clear.addEventListener('click',()=>{q.value='';run();q.focus();});
  document.querySelectorAll('[data-suggest]').forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.suggest;run();q.focus();}));
  hooks.push(el=>{if(el.closest('[hidden]')){q.value='';run();}const d=el.matches('li.c-item')&&el.querySelector('details.c-used');if(d)d.open=true;});
  run();
  if(hashEl())reveal();
 }
})();
