'use strict';
// R24 shared: the copy-email button. Without script the button stays hidden and the address is plain visible text.
// No network, no storage. Clipboard API first; if the browser refuses, the address text is selected so ⌘C / Ctrl+C works.
(() => {
 for (const b of document.querySelectorAll('button[data-copy]')) {
  b.hidden = false;
  const label = b.querySelector('span'), idle = label.textContent;
  let t = 0;
  b.addEventListener('click', async () => {
   const v = b.dataset.copy;
   let ok = false;
   try { await navigator.clipboard.writeText(v); ok = true; } catch (e) { ok = false; }
   if (!ok) {
    const a = b.parentElement.querySelector('.addr-link');
    if (a) { const r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    return;
   }
   label.textContent = b.dataset.done; b.classList.add('done');
   clearTimeout(t); t = setTimeout(() => { label.textContent = idle; b.classList.remove('done'); }, 2200);
  });
  // the live label is announced once, politely
  label.setAttribute('aria-live', 'polite');
 }
})();
