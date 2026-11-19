'use strict';
// R66 hero 3D controller. Same-origin only. The three.js module (~157 KB gz) and the GLB (~0.8 MB) are requested ONLY by start():
//   desktop (hover + >=1000px + motion allowed + no save-data + not 2g): after window load AND an idle slot, if the stage is in view -> start({auto:true})
//   everything else (phones, tablets, reduced-motion, save-data, slow link): poster only until the visitor presses the button.
(() => {
 const SRC = document.currentScript.src, VIEWER = new URL('viewer/r66-viewer.min.js', SRC).href;
 const root = document.documentElement; root.classList.add('h3-js');
 const D = Math.PI / 180, YAW0 = 15 * D, SPAN = 75 * D, STEP = 15 * D;       // start pose = model +15° (frontal); the scan is clean from -60° to +90° (= ±75° around the start pose)
 const rm = matchMedia('(prefers-reduced-motion: reduce)');
 let modPromise = null; const loadMod = () => modPromise || (modPromise = import(VIEWER));
 const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
 const conn = navigator.connection || {}; const slow = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
 function init(el) {
  const stage = el.querySelector('.h3-stage'), btn = el.querySelector('.h3-go'), note = el.querySelector('.h3-note');
  const ctl = el.querySelector('.h3-ctl'), deg = el.querySelector('.h3-deg'), pause = el.querySelector('.h3-pause');
  let api = null, busy = false, paused = false;
  const say = (s, extra) => { el.dataset.state = s; if (note) { note.dataset.s = s; note.textContent = (el.dataset['msg' + s[0].toUpperCase() + s.slice(1)] || '') + (extra || ''); } };
  const rel = () => Math.round((api.yaw - YAW0) / D);
  const readout = () => { if (!api) return; const d = rel(); if (deg) deg.textContent = (el.dataset.lblAngle || '') + ' ' + (d > 0 ? '+' : '') + d + '°'; ctl.querySelectorAll('[data-rot]').forEach(b => b.setAttribute('aria-disabled', String(Math.abs(d + (+b.dataset.rot) * 15) > 75.5))); };
  const busyBtn = v => { if (!btn) return; btn.setAttribute('aria-busy', String(v)); if (v) { btn.dataset.label = btn.textContent; btn.textContent = el.dataset.lblLoading; } else if (btn.dataset.label) btn.textContent = btn.dataset.label; };
  async function start(o = {}) {
   if (api || busy) return;
   if (!gl) { say('nowebgl'); if (btn) btn.hidden = true; return; }
   busy = true; busyBtn(true); say('loading');
   try {
    const m = await loadMod();
    api = await m.mountViewer(stage, { glb: el.dataset.glb, yaw0: YAW0, yawMin: YAW0 - SPAN, yawMax: YAW0 + SPAN, sway: 20 * D, swayPeriod: 14, auto: !!o.auto && !rm.matches, cls: 'r66-canvas', onProgress: f => say('loading', ' ' + Math.round(f * 100) + '%') });
    el.classList.add('is-live'); stage.tabIndex = 0; if (btn) btn.hidden = true; if (ctl) ctl.hidden = false; if (pause) pause.hidden = !(o.auto && !rm.matches);
    say('live'); readout();
    stage.addEventListener('r66:interact', () => { if (api && api.auto) { api.setAuto(false); paused = true; if (pause) { pause.setAttribute('aria-pressed', 'true'); pause.setAttribute('aria-label', pause.dataset.labelPlay); } } readout(); });
    stage.addEventListener('r66:lost', () => { stop(); say('error'); if (btn) btn.hidden = false; }, { once: true });
   } catch (e) { api = null; say(e && e.message === 'nowebgl' ? 'nowebgl' : 'error'); if (btn && e && e.message !== 'nowebgl') btn.hidden = false; }
   finally { busy = false; busyBtn(false); if (el.dataset.state === 'live' && btn) btn.hidden = true; }
  }
  function stop() { if (api) { api.dispose(); api = null; el.classList.remove('is-live'); stage.removeAttribute('tabindex'); if (ctl) ctl.hidden = true; if (pause) pause.hidden = true; if (btn) btn.hidden = false; say('idle'); } }
  el.h3 = { start, stop, get api() { return api; } };
  if (btn) btn.addEventListener('click', () => start({ auto: false }));
  ctl && ctl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !api) return; if (b.dataset.rot) { if (b.getAttribute('aria-disabled') !== 'true') api.rotate(+b.dataset.rot * STEP); } else if (b.hasAttribute('data-reset')) api.reset(); readout(); });
  stage.addEventListener('keydown', e => { if (!api) return; if (e.key === 'ArrowLeft') api.rotate(-STEP); else if (e.key === 'ArrowRight') api.rotate(STEP); else if (e.key === 'Home') api.reset(); else return; e.preventDefault(); readout(); });
  if (pause) {   // R40 rule: hidden until hover / focus / paused / touch peek; the first touch tap only reveals it
   let peekT = 0, hiddenAtTouch = false; const peek = () => { stage.classList.add('is-peek'); clearTimeout(peekT); peekT = setTimeout(() => stage.classList.remove('is-peek'), 3000); };
   stage.addEventListener('pointerdown', e => { hiddenAtTouch = e.pointerType !== 'mouse' && !paused && !stage.classList.contains('is-peek'); }, true);
   stage.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') peek(); });
   pause.addEventListener('click', () => { if (hiddenAtTouch) { hiddenAtTouch = false; return; } paused = !paused; api && api.setAuto(!paused); pause.setAttribute('aria-pressed', String(paused)); pause.setAttribute('aria-label', paused ? pause.dataset.labelPlay : pause.dataset.labelPause); });
  }
  if (!gl) { say('nowebgl'); if (btn) btn.hidden = true; } else say('idle');
  if (gl && !rm.matches && !slow && matchMedia('(hover:hover) and (min-width:1000px)').matches) {
   const go = () => new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); start({ auto: true }); } }, { threshold: .35 }).observe(stage);
   const afterIntro = () => { if (root.dataset.introState !== 'playing') return go(); const mo = new MutationObserver(() => { if (root.dataset.introState !== 'playing') { mo.disconnect(); go(); } }); mo.observe(root, { attributes: true, attributeFilter: ['data-intro-state'] }); };   // R67: wait for the home intro (<=1 s) to end
   const idle = () => (window.requestIdleCallback ? requestIdleCallback(afterIntro, { timeout: 2500 }) : setTimeout(afterIntro, 1200));
   if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
  }
 }
 document.querySelectorAll('.h3').forEach(init);
})();
