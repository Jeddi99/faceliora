'use strict';
// R41 controller. Same-origin only. The three.js module (≈157 KB gz) and the GLB (≈1.1 MB) are requested ONLY by start():
//   data-mode="click"  → user presses "หมุนดูแบบ 3D"                       (A)
//   data-mode="inview" → desktop with hover + wide screen + motion allowed: when ≥35% in view; else behaves as click (B)
//   data-mode="modal"  → user presses the chip → <dialog> opens → start()  (C)
(() => {
 const SRC = document.currentScript.src;
 const VIEWER = new URL('r41-viewer.min.js', SRC).href;
 const root = document.documentElement; root.classList.add('r41-js');
 const rm = matchMedia('(prefers-reduced-motion: reduce)');
 const STEP = 15 * Math.PI / 180;
 let modPromise = null;
 const loadMod = () => modPromise || (modPromise = import(VIEWER));
 const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
 const saveData = !!(navigator.connection && navigator.connection.saveData);

 function init(el) {
  const stage = el.querySelector('.r41-stage'), btn = el.querySelector('.r41-go'), note = el.querySelector('.r41-note');
  const ctl = el.querySelector('.r41-ctl'), deg = el.querySelector('.r41-deg'), pause = el.querySelector('.r41-pause');
  const mode = el.dataset.mode;
  let api = null, busy = false, paused = false;
  const say = (s, extra) => { el.dataset.state = s; if (note) { note.dataset.s = s; note.textContent = (el.dataset['msg' + s[0].toUpperCase() + s.slice(1)] || '') + (extra || ''); } };
  const readout = () => { if (api && deg) { const d = Math.round(api.yaw * 180 / Math.PI); deg.textContent = (el.dataset.lblAngle || '') + ' ' + d + '°'; const lim = Math.round(105); ctl.querySelectorAll('[data-rot]').forEach(b => b.setAttribute('aria-disabled', String((+b.dataset.rot) * api.yaw >= 1.83 - 0.002))); } };
  const setBtnBusy = v => { if (!btn) return; btn.setAttribute('aria-busy', String(v)); btn.toggleAttribute('disabled', false); btn.dataset.busy = v ? '1' : ''; if (v) { btn.dataset.label = btn.textContent; btn.textContent = el.dataset.lblLoading; } else if (btn.dataset.label) btn.textContent = btn.dataset.label; };

  async function start(opts = {}) {
   if (api || busy) return;
   if (!gl) { say('nowebgl'); if (btn) btn.hidden = true; return; }
   busy = true; setBtnBusy(true); say('loading');
   try {
    const m = await loadMod();
    api = await m.mountViewer(stage, { glb: el.dataset.glb, yaw0: 0.3, auto: !!opts.auto && !rm.matches, onProgress: f => say('loading', ' ' + Math.round(f * 100) + '%') });
    el.classList.add('is-live'); stage.tabIndex = 0; if (btn) btn.hidden = true; if (ctl) ctl.hidden = false; if (pause) pause.hidden = !opts.auto; if (deg) deg.hidden = !!(opts.auto && !rm.matches);   // swaying: an angle readout would be stale
    say('live'); readout();
    if (opts.focus) stage.focus({ preventScroll: true });
    stage.addEventListener('r41:interact', readout);
    stage.addEventListener('r41:lost', () => { stop(); say('error'); if (btn) btn.hidden = false; }, { once: true });
   } catch (e) {
    api = null; say(e && e.message === 'nowebgl' ? 'nowebgl' : 'error');
    if (btn && (e && e.message !== 'nowebgl')) { btn.hidden = false; }
   } finally { busy = false; setBtnBusy(false); if (el.dataset.state === 'live' && btn) btn.hidden = true; }
  }
  function stop() { if (api) { api.dispose(); api = null; el.classList.remove('is-live'); stage.removeAttribute('tabindex'); if (ctl) ctl.hidden = true; if (btn) btn.hidden = false; say('idle'); } }
  el.r41 = { start, stop, get api() { return api; } };

  if (btn) btn.addEventListener('click', () => start({ focus: true, auto: false }));
  ctl && ctl.addEventListener('click', e => {
   const b = e.target.closest('button'); if (!b || !api) return;
   if (b.dataset.rot) { if (b.getAttribute('aria-disabled') !== 'true') api.rotate(+b.dataset.rot * STEP); }
   else if (b.hasAttribute('data-reset')) api.reset();
   readout();
  });
  stage.addEventListener('keydown', e => {
   if (!api) return;
   if (e.key === 'ArrowLeft') { api.rotate(-STEP); e.preventDefault(); }
   else if (e.key === 'ArrowRight') { api.rotate(STEP); e.preventDefault(); }
   else if (e.key === 'Home') { api.reset(); e.preventDefault(); }
   else return; readout();
  });

  if (pause) {   // R40 hover rule: hidden → visible on hover / focus / paused; first touch tap only reveals it
   let peekT = 0, hiddenAtTouch = false;
   const peek = () => { stage.classList.add('is-peek'); clearTimeout(peekT); peekT = setTimeout(() => stage.classList.remove('is-peek'), 3000); };
   stage.addEventListener('pointerdown', e => { hiddenAtTouch = e.pointerType !== 'mouse' && !paused && !stage.classList.contains('is-peek'); }, true);
   stage.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') peek(); });
   pause.addEventListener('click', () => {
    if (hiddenAtTouch) { hiddenAtTouch = false; return; }
    paused = !paused; api && api.setAuto(!paused);
    pause.setAttribute('aria-pressed', String(paused)); pause.setAttribute('aria-label', paused ? pause.dataset.labelPlay : pause.dataset.labelPause);
    if (deg) { deg.hidden = !paused; readout(); }
    if (stage.classList.contains('is-peek')) peek();
   });
   stage.addEventListener('r41:interact', () => { /* user took over: stop sway but keep the pause state truthful */
    if (api && api.auto) { api.setAuto(false); paused = true; pause.setAttribute('aria-pressed', 'true'); pause.setAttribute('aria-label', pause.dataset.labelPlay); }
    if (deg) { deg.hidden = false; readout(); }
   });
  }

  if (!gl) { say('nowebgl'); if (btn) btn.hidden = true; } else say('idle');
  if (mode === 'inview' && gl && !rm.matches && !saveData && matchMedia('(hover:hover) and (min-width:1000px)').matches) {
   new IntersectionObserver((es, io) => { if (es[0].isIntersecting && root.dataset.introState !== 'playing') { io.disconnect(); start({ auto: true }); } }, { threshold: .35 }).observe(stage);
  }
 }
 document.querySelectorAll('.r41').forEach(init);

 // C: chip + dialog
 const chip = document.querySelector('.r41-open'), dlg = document.querySelector('.r41-dlg');
 if (chip && dlg) {
  const host = dlg.querySelector('.r41');
  const showChip = new IntersectionObserver(es => chip.classList.toggle('is-on', es[0].isIntersecting), { threshold: .08 });
  const sys = document.querySelector('.lane-clinic') || document.getElementById('system');
  // chip shows only while the clinic / 3D lane is on screen
  if (sys) showChip.observe(sys); else chip.classList.add('is-on');
  chip.addEventListener('click', () => { dlg.showModal(); document.documentElement.classList.add('r41-lock'); chip.setAttribute('aria-expanded', 'true'); host.r41.start({ focus: false }); });
  const close = () => { dlg.close(); };
  dlg.querySelector('.r41-x').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => { host.r41.stop(); document.documentElement.classList.remove('r41-lock'); chip.setAttribute('aria-expanded', 'false'); });
 }
})();
