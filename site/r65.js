/* R65 layout B, phones only (max-width:699px). Above that nothing is touched, so desktop / tablet keep the shipped markup.
   1) floating bottom CTA (the markup is in the HTML: <div class="fl-sticky" data-after data-hide>): shown once the hero CTA has scrolled away,
      hidden while the consent card is open, near the closing band / form / footer; inert + visibility:hidden when hidden. Not on /demo/ (no markup there).
   2) folded reference blocks: clinic "what we need" rows + 3 notes, article table of contents, pricing "how it is calculated", demo optional fields.
      The existing heading / term becomes a <button aria-expanded aria-controls>; the content stays in the DOM (hidden="until-found" while folded, so find-in-page opens it).
      Without JS nothing is folded. It MOVES the live nodes (never re-creates them) so the page scripts (form, ROI calculator) keep their listeners.
   Resizing across 700px applies / reverts everything. No network, no storage, no tracking. */
(function () {
  'use strict';
  var d = document, r = d.documentElement, mq = window.matchMedia('(max-width:699px)');
  var undo = [], folds = [], uid = 0, on = false;
  var mk = function (tag, cls) { var e = d.createElement(tag); if (cls) e.className = cls; return e; };
  var q = function (s) { return d.querySelector(s); };
  var qa = function (s) { return [].slice.call(d.querySelectorAll(s)); };

  /* head: element whose children become the button label; body: element that is folded; host: element that gets .is-open */
  function fold(head, body, host) {
    var btn = mk('button', 'fl-btn'), had = !!body.id;
    btn.type = 'button';
    if (!had) body.id = 'fl-b-' + (++uid);
    btn.setAttribute('aria-controls', body.id);
    while (head.firstChild) btn.appendChild(head.firstChild);
    head.appendChild(btn);
    var f = { body: body, btn: btn, host: host || head };
    f.set = function (open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) body.removeAttribute('hidden'); else body.setAttribute('hidden', 'until-found');
      f.host.classList.toggle('is-open', open);
    };
    f.toggle = function () { f.set(btn.getAttribute('aria-expanded') !== 'true'); };
    btn.addEventListener('click', f.toggle);
    body.addEventListener('beforematch', function () { f.set(true); });      /* find-in-page / fragment navigation into folded text */
    f.set(false);
    folds.push(f);
    undo.push(function () {
      while (btn.firstChild) head.insertBefore(btn.firstChild, btn);
      head.removeChild(btn);
      body.removeAttribute('hidden');
      if (!had) body.removeAttribute('id');
      f.host.classList.remove('is-open');
    });
    return f;
  }
  /* wrap a list of sibling nodes in a new element placed where the first one was; reverted by unwrap */
  function wrap(nodes, el) {
    nodes[0].parentNode.insertBefore(el, nodes[0]);
    nodes.forEach(function (n) { el.appendChild(n); });
    undo.push(function () { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.parentNode.removeChild(el); });
    return el;
  }
  function addClass(el, c) { if (!el.classList.contains(c)) { el.classList.add(c); undo.push(function () { el.classList.remove(c); }); } }
  function noAttr(el, a) { if (el.hasAttribute(a)) { var v = el.getAttribute(a); el.removeAttribute(a); undo.push(function () { el.setAttribute(a, v); }); } }

  function setupFolds() {
    /* clinic: "what we need" (dl.c-facts): each row dt = button, dd = body */
    var facts = q('dl.c-facts');
    if (facts) {
      addClass(facts, 'fl-accs');
      [].slice.call(facts.children).forEach(function (row) {
        var dt = row.querySelector('dt'), dd = row.querySelector('dd');
        if (!dt || !dd) return;
        addClass(row, 'fl-acc'); addClass(dd, 'fl-acc-body'); fold(dt, dd, row);
      });
      /* clinic: the three notes (PDPA / accuracy / what can be sent): the question is the button */
      qa('aside.c-note').forEach(function (a) {
        var h = a.querySelector('h3'); if (!h || h.parentNode !== a) return;
        var rest = [].slice.call(a.children).filter(function (x) { return x !== h; });
        if (!rest.length) return;
        addClass(a, 'fl-note'); addClass(h, 'fl-h');
        var box = wrap([h].concat(rest), mk('div', 'fl-acc'));
        var body = wrap(rest, mk('div', 'fl-acc-body'));
        fold(h, body, box);
      });
    }
    /* article: table of contents */
    var toc = q('nav.a-toc');
    if (toc) {
      var h2 = toc.querySelector('h2'), ol = toc.querySelector('ol');
      if (h2 && ol && h2.parentNode === toc) {
        addClass(toc, 'fl-toc'); addClass(h2, 'fl-h');
        var tbox = wrap([h2, ol], mk('div', 'fl-acc fl-acc-toc'));
        var tbody = wrap([ol], mk('div', 'fl-acc-body'));
        fold(h2, tbody, tbox);
      }
    }
    /* pricing: how it is calculated */
    var roi = q('.roi-formula');
    if (roi) {
      var h4 = roi.querySelector('h4');
      if (h4 && h4.parentNode === roi) {
        var rest2 = [].slice.call(roi.children).filter(function (x) { return x !== h4; });
        if (rest2.length) {
          addClass(roi, 'fl-roi'); addClass(h4, 'fl-h');
          var rbox = wrap([h4].concat(rest2), mk('div', 'fl-acc fl-acc-roi'));
          var rbody = wrap(rest2, mk('div', 'fl-acc-body'));
          fold(h4, rbody, rbox);
        }
      }
    }
    /* demo: optional fields. The required ones stay open; the group opens by itself if something in it is invalid */
    var gt = q('p.r43-group-t');
    if (gt) {
      var sibs = [], n = gt.nextElementSibling;
      while (n && !n.classList.contains('r43-hp')) { sibs.push(n); n = n.nextElementSibling; }
      if (sibs.length) {
        var obody = wrap(sibs, mk('div', 'fl-opt-body'));
        var obox = wrap([gt, obody], mk('div', 'fl-opt'));
        var f = fold(gt, obody, obox);
        var openIfBad = function () { if (obody.querySelector('[aria-invalid="true"]')) f.set(true); };
        var mo = new MutationObserver(openIfBad);
        mo.observe(obody, { subtree: true, attributes: true, attributeFilter: ['aria-invalid'] });
        var inv = function () { f.set(true); };
        obody.addEventListener('invalid', inv, true);
        undo.push(function () { mo.disconnect(); obody.removeEventListener('invalid', inv, true); });
      }
    }
    revealHash();
  }
  function revealHash() {
    var id = decodeURIComponent((location.hash || '').slice(1)); if (!id) return;
    var t = d.getElementById(id); if (!t) return;
    folds.forEach(function (f) { if (f.body.contains(t) || f.body === t) f.set(true); });
  }

  /* ---------- floating CTA ---------- */
  var bar = q('.fl-sticky'), upd = null;
  /* Focus Not Obscured (WCAG 2.2 / 2.4.11): while the bar is on, <html> gets .fl-bar-on + --fl-bar-h (CSS: scroll-padding-bottom), so the browser scrolls a focused
     element to above the bar. This guard covers the two cases the browser does not: the bar appearing while a keyboard-focused element already sits in its area,
     and focus moves that did not scroll (script focus with preventScroll). Only scrolls when the element is fully under the bar. */
  function reveal(a) {
    if (!bar || !a || a === d.body || a === d.documentElement || bar.contains(a) || !a.scrollIntoView) return;
    var rc = a.getBoundingClientRect(), vh = window.innerHeight, top = vh - bar.offsetHeight;
    if (rc.width > 0 && rc.height > 0 && rc.bottom > 0 && rc.top < vh && rc.top >= top - 0.5) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function setupBar() {
    if (!bar) return;
    var trig = bar.getAttribute('data-after') ? q(bar.getAttribute('data-after')) : null;
    var stops = qa(bar.getAttribute('data-hide') || 'footer'), was = false, kb = false;
    upd = function () {
      var vh = window.innerHeight, out = trig ? trig.getBoundingClientRect().bottom < 0 : (window.scrollY || 0) > 600, hide = false;
      stops.forEach(function (s) { var b = s.getBoundingClientRect(); if (b.top < vh && b.bottom > 0) hide = true; });
      var cc = d.getElementById('cc'), open = !!(cc && !cc.hidden), show = out && !hide && !open;
      if (show) r.style.setProperty('--fl-bar-h', bar.offsetHeight + 'px');
      r.classList.toggle('fl-bar-on', show); bar.classList.toggle('is-on', show); bar.inert = !show;
      if (show && !was && kb) reveal(d.activeElement);                 /* the bar just appeared over the element the keyboard user is on */
      was = show;
    };
    var onKey = function () { kb = true; }, onPtr = function () { kb = false; };
    var onFocus = function (e) { if (was) window.requestAnimationFrame(function () { reveal(e.target); }); };
    window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd);
    d.addEventListener('keydown', onKey, true); d.addEventListener('pointerdown', onPtr, true); d.addEventListener('focusin', onFocus);
    var mo = new MutationObserver(upd);
    mo.observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    undo.push(function () {
      window.removeEventListener('scroll', upd); window.removeEventListener('resize', upd);
      d.removeEventListener('keydown', onKey, true); d.removeEventListener('pointerdown', onPtr, true); d.removeEventListener('focusin', onFocus);
      mo.disconnect(); bar.classList.remove('is-on'); bar.inert = false; r.classList.remove('fl-bar-on'); r.style.removeProperty('--fl-bar-h'); upd = null;
    });
    bar.inert = true; upd();
  }

  function setup() { if (on) return; on = true; r.classList.add('fl-js'); setupFolds(); setupBar(); }
  function teardown() { if (!on) return; on = false; while (undo.length) undo.pop()(); folds = []; r.classList.remove('fl-js'); }
  function sync() { if (mq.matches) setup(); else teardown(); }
  if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync);
  window.addEventListener('hashchange', function () { if (on) revealHash(); });
  sync();
})();
