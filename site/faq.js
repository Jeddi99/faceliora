'use strict';
// R28 FAQ behaviour (options A and B; option C needs no script). No network, no storage.
// Without this file every answer still opens and closes (native <details>), group links still jump, and Chrome's
// find-in-page opens a closed answer that holds the match. This file only adds:
//  • a link to #question opens that answer (on load and on hash change) and scrolls it into view
//  • "ลิงก์ไปคำถามนี้" puts the address in the bar and copies it when the browser allows (message for 2 s)
//  • A: the group rail marks the group on screen (on phones the rail is a sticky scrolling row); "เปิดทุกคำตอบ / ปิดทุกคำตอบ"
//  • B: filter by words in the questions and answers on this page + group chips, a live count, an empty state with
//    suggestions; matches are painted with the CSS Highlight API (text is never rewritten)
(() => {
 const rows=[...document.querySelectorAll('details.qa-row')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const listeners=[];
 function reveal(id,{scroll=true}={}){
  if(!id)return;
  let el;try{el=document.getElementById(decodeURIComponent(id));}catch(e){return;}
  if(!el)return;
  for(const f of listeners)f(el);
  const d=el.matches('details')?el:el.closest('details.qa-row');
  if(d)d.open=true;
  if(scroll)requestAnimationFrame(()=>el.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'}));
 }
 addEventListener('hashchange',()=>reveal(location.hash.slice(1)));
 addEventListener('DOMContentLoaded',()=>{if(location.hash)reveal(location.hash.slice(1),{scroll:true});});

 // permalink: update the address, copy when allowed, say so politely
 const live=document.createElement('p');live.className='sr';live.setAttribute('aria-live','polite');
 addEventListener('DOMContentLoaded',()=>document.body.append(live));
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[data-qlink]');if(!a)return;
  e.preventDefault();e.stopPropagation();
  const id=a.getAttribute('href').slice(1);
  history.replaceState(null,'','#'+id);
  const done=()=>{const s=a.querySelector('span');const was=s.textContent;s.textContent=a.closest('[data-copied]')?.dataset.copied||document.documentElement.dataset.copied||was;
   a.dataset.done='';live.textContent=s.textContent;setTimeout(()=>{s.textContent=was;delete a.dataset.done;},2000);};
  if(navigator.clipboard&&isSecureContext)navigator.clipboard.writeText(location.href).then(done,()=>{});
 },true);

 // A: rail marks the group on screen + open/close all
 const rail=document.querySelector('[data-rail]');
 if(rail){
  // the group whose heading has passed 35% of the screen height is current; above the first group, the first one
  const links=new Map([...rail.querySelectorAll('a[href^="#"]')].map(a=>[a.getAttribute('href').slice(1),a]));
  const secs=[...document.querySelectorAll('section[data-group]')].filter(s=>links.has(s.id));
  let raf=0,last=null;
  const mark=()=>{raf=0;const line=innerHeight*.35;let cur=secs[0]?.id;
   for(const s of secs)if(s.getBoundingClientRect().top<=line)cur=s.id;
   if(cur===last)return;last=cur;
   for(const [id,a] of links){if(id===cur)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
   // phone bar: keep the current link in view inside the scrolling row
   const a=links.get(cur),row=a&&a.closest('ol');
   if(row&&row.scrollWidth>row.clientWidth){const r=a.getBoundingClientRect(),q=row.getBoundingClientRect();
    if(r.left<q.left||r.right>q.right)row.scrollTo({left:a.offsetLeft-24,behavior:reduce?'auto':'smooth'});}};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(mark);},{passive:true});
  addEventListener('resize',()=>{last=null;mark();});
  addEventListener('DOMContentLoaded',mark);mark();
 }
 const alls=[...document.querySelectorAll('[data-toggle-all]')];
 if(alls.length){
  const sync=()=>{const open=rows.every(d=>d.open);for(const b of alls){b.textContent=open?b.dataset.close:b.dataset.open;b.setAttribute('aria-pressed',String(open));}};
  for(const b of alls){b.hidden=false;b.addEventListener('click',()=>{const open=!rows.every(d=>d.open);for(const d of rows)d.open=open;sync();});}
  rows.forEach(d=>d.addEventListener('toggle',sync));sync();
 }

 // B: filter on this page's text
 const box=document.querySelector('[data-find]');
 if(box){
  box.hidden=false;
  const q=box.querySelector('input[type=search]'),count=document.querySelector('[data-count]'),clear=box.querySelector('[data-clear]');count.hidden=false;
  const empty=document.querySelector('[data-empty]'),word=empty.querySelector('[data-word]');
  const chipNav=document.querySelector('[data-chips]');
  const groups=[...document.querySelectorAll('section[data-group]')];
  const label=count.dataset.label;
  // group links become toggle buttons (one pressed at a time, "all" first)
  const chips=[...chipNav.querySelectorAll('a[data-filter]')].map(a=>{
   const b=document.createElement('button');b.type='button';b.className=a.className;b.dataset.filter=a.dataset.filter;b.innerHTML=a.innerHTML;
   b.setAttribute('aria-pressed',String(a.dataset.filter==='all'));a.replaceWith(b);return b;});
  let group='all';
  const norm=s=>s.normalize('NFC').toLowerCase().replace(/[\u200b-\u200d\u00ad]/g,'').replace(/\s+/g,' ').trim();
  const text=new Map(rows.map(d=>{const c=d.cloneNode(true);c.querySelectorAll('[data-review],.from,.q-link').forEach(x=>x.remove());return [d,norm(c.textContent)];}));
  const was=new Map(rows.map(d=>[d,d.open]));
  const HL='CSS' in window&&CSS.highlights&&typeof Highlight==='function';
  function paint(terms){
   if(!HL)return;CSS.highlights.delete('faq-find');if(!terms.length)return;
   const ranges=[];
   for(const d of rows){if(d.hidden)continue;
    const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('[data-review],.from,.q-link')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    let n;while((n=w.nextNode())){const s=n.textContent.toLowerCase();for(const t of terms){let i=s.indexOf(t);while(i>-1){const r=new Range();r.setStart(n,i);r.setEnd(n,i+t.length);ranges.push(r);i=s.indexOf(t,i+t.length);}}}}
   CSS.highlights.set('faq-find',new Highlight(...ranges));
  }
  function run(){
   const raw=q.value,terms=norm(raw).split(' ').filter(Boolean);
   let n=0;
   for(const d of rows){
    const g=d.closest('section[data-group]').dataset.group;
    const ok=(group==='all'||g===group)&&terms.every(t=>text.get(d).includes(t));
    d.hidden=!ok;if(ok)n++;
    if(terms.length)d.open=ok;else d.open=was.get(d);
   }
   for(const s of groups)s.hidden=!s.querySelector('details.qa-row:not([hidden])');
   // chip counts follow the words typed (group choice aside); a chip with nothing to show is dimmed, still pressable
   for(const b of chips){const k=b.dataset.filter;const m=rows.filter(d=>(k==='all'||d.closest('section[data-group]').dataset.group===k)&&terms.every(t=>text.get(d).includes(t))).length;
    b.querySelector('.b-n').textContent=m;b.classList.toggle('is-zero',m===0);}
   count.textContent=`${n} ${n===1?count.dataset.one:label}`;
   clear.hidden=!raw;
   empty.hidden=n>0;word.textContent=raw.trim();
   empty.querySelector('[data-has-word]').hidden=!raw.trim();
   paint(terms);
  }
  q.addEventListener('input',run);
  q.addEventListener('keydown',e=>{if(e.key==='Escape'&&q.value){e.preventDefault();q.value='';run();}});
  clear.addEventListener('click',()=>{q.value='';run();q.focus();});
  for(const b of chips)b.addEventListener('click',()=>{group=b.dataset.filter;for(const x of chips)x.setAttribute('aria-pressed',String(x===b));run();});
  document.querySelectorAll('[data-suggest]').forEach(b=>{b.hidden=false;b.addEventListener('click',()=>{q.value=b.dataset.suggest;group='all';for(const x of chips)x.setAttribute('aria-pressed',String(x.dataset.filter==='all'));run();q.focus();});});
  empty.querySelector('[data-reset]')?.addEventListener('click',()=>{q.value='';group='all';for(const x of chips)x.setAttribute('aria-pressed',String(x.dataset.filter==='all'));run();q.focus();});
  rows.forEach(d=>d.addEventListener('toggle',()=>{if(!q.value)was.set(d,d.open);}));
  // a deep link to a question the filter hides clears the filter first
  listeners.push(el=>{const d=el.closest('details.qa-row')||el;if(d.hidden||el.closest('[hidden]')){q.value='';group='all';for(const x of chips)x.setAttribute('aria-pressed',String(x.dataset.filter==='all'));run();}});
  run();
 }
})();
