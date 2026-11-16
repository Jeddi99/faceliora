/* R58 landing form (/th/lp/clinic-demo/, /en/lp/clinic-demo/). Plain JS. Same endpoint contract as /demo/ (r43.js):
 *   POST text/plain JSON to FACELIORA_SITE_CONFIG.LEAD_ENDPOINT_URL, success only when the answer is {ok:true}. Empty endpoint -> notice, nothing sent.
 * Keys sent (= lead-form/apps-script/Code.gs): name, clinic, phone (TH) | email (EN), consent, consent_version, lang, source_page, source_cta, country (TH only), utm_source/medium/campaign/content, website (honeypot). */
(function () {
  'use strict';
  var root = document.querySelector('.lf'); if (!root) return;
  var form = root.querySelector('form'), L = root.dataset;
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'th';
  var TR = window.FLTrack || { utm: function () { return {}; }, lead: function () {} };
  var btn = form.querySelector('.btn'), idleLabel = btn.textContent;
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  /* TH phone: 0812345678, 081-234-5678, +66 81 234 5678, 02 123 4567 -> national 0xxxxxxxxx or '' (same rule as /demo/) */
  function thPhone(raw) {
    var s = String(raw || '').replace(/[\s().-]/g, '');
    if (/^\+66/.test(s)) s = '0' + s.slice(3); else if (/^66\d{8,9}$/.test(s)) s = '0' + s.slice(2);
    if (/^0[689]\d{8}$/.test(s)) return s;
    if (/^0[2-57]\d{7}$/.test(s)) return s;
    return '';
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function endpoint() {
    var cfg = window.FACELIORA_SITE_CONFIG || {}, url = typeof cfg.LEAD_ENDPOINT_URL === 'string' ? cfg.LEAD_ENDPOINT_URL.trim() : '';
    return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : '';
  }
  function setState(s) { root.dataset.state = s; }
  function el(n) { return form.elements[n]; }

  /* hidden fields: lang, source_page, source_cta, utm_* */
  function fillHidden() {
    var u = TR.utm();
    el('source_page').value = location.pathname;
    el('source_cta').value = /^[a-z0-9][a-z0-9-]{0,59}$/.test(u.from || '') ? u.from : 'lp-clinic-demo';
    UTM.forEach(function (k) { if (el(k)) el(k).value = u[k] || ''; });
  }
  fillHidden();

  if (!endpoint()) { setState('off'); btn.disabled = true; }

  function fieldBox(input) { return input.closest('.fld'); }
  function validateField(f) {
    var i = f.querySelector('input'), v = norm(i.value), ok = !!v, msg = L.errReq + ' ' + f.dataset.name;
    if (ok && i.name === 'phone') { ok = !!thPhone(v); msg = L.errPhone; }
    if (ok && i.name === 'email') { ok = EMAIL.test(v); msg = L.errEmail; }
    if (ok && (i.name === 'name' || i.name === 'clinic')) { ok = v.length >= 2; }
    f.classList.toggle('bad', !ok); i.setAttribute('aria-invalid', ok ? 'false' : 'true');
    f.querySelector('.err').textContent = ok ? '' : msg;
    return ok ? null : i;
  }
  form.querySelectorAll('.fld[data-req] input').forEach(function (i) {
    i.addEventListener('blur', function () { if (i.value !== '' || i.dataset.touched) validateField(fieldBox(i)); i.dataset.touched = '1'; });
    i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') validateField(fieldBox(i)); });
  });
  var chk = form.querySelector('.chk'), ci = chk.querySelector('input');
  ci.addEventListener('change', function () { if (ci.checked) { chk.classList.remove('bad'); ci.setAttribute('aria-invalid', 'false'); } });

  function payload() {
    var u = TR.utm(), p = {
      name: norm(el('name').value), clinic: norm(el('clinic').value),
      consent: true, consent_version: 'r58-' + LANG + '-1', lang: LANG,
      source_page: location.pathname, source_cta: el('source_cta').value, website: el('website').value
    };
    if (LANG === 'th') { p.phone = thPhone(el('phone').value); p.country = 'Thailand'; } else { p.email = norm(el('email').value).toLowerCase(); }
    UTM.forEach(function (k) { if (u[k]) p[k] = u[k]; });
    return p;
  }
  function send(p, url) {
    var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 15000);
    /* text/plain = "simple" request: no CORS pre-flight, which Apps Script cannot answer */
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p), signal: ctl.signal, redirect: 'follow', credentials: 'omit' })
      .then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error('rejected'); }, function (e) { clearTimeout(to); throw e; });
  }
  function busy(on) { btn.disabled = on || !endpoint(); btn.setAttribute('aria-busy', on ? 'true' : 'false'); btn.textContent = on ? L.sending : idleLabel; }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (btn.disabled) return;
    var url = endpoint(); if (!url) { setState('off'); return; }
    fillHidden();
    var bad = [];
    form.querySelectorAll('.fld[data-req]').forEach(function (f) { var b = validateField(f); if (b) bad.push(b); });
    chk.classList.toggle('bad', !ci.checked); ci.setAttribute('aria-invalid', ci.checked ? 'false' : 'true');
    if (!ci.checked) bad.push(ci);
    var sum = root.querySelector('.sumerr');
    if (bad.length) { sum.textContent = L.errSum.replace('{n}', bad.length); setState('error'); bad[0].focus(); return; }
    var p = payload();
    if (p.website) { setState('success'); return; }   /* honeypot filled (bot): send nothing, no tracking event */
    busy(true); setState('sending');
    send(p, url).then(function () {
      busy(false); setState('success');
      TR.lead('landing');
      var d = root.querySelector('.done'); d.setAttribute('tabindex', '-1'); d.focus();
    }, function () {
      busy(false); setState('neterror');
      var n = root.querySelector('.net'); n.focus(); if (n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
    });
  });
})();
