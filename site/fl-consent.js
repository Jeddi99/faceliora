/* R58 consent (design R57 option B, corner card) + consent-gated tracking + UTM capture. Plain JS, no library.
 * Loads NOTHING from Google or Meta unless: the ID is set in site-config.js AND the visitor said yes to that category.
 *   GA4_MEASUREMENT_ID ("G-XXXXXXXXXX")  -> gtag.js, only after "analytics" consent (Google Consent Mode v2: default denied -> update)
 *   META_PIXEL_ID (digits)               -> fbevents.js, only after "marketing" consent
 * Choice is kept in localStorage "fl_consent" = {v, analytics, marketing, ts}. UTM values are kept in sessionStorage "fl_utm" (no cookies).
 * Events carry no personal data: GA4 generate_lead / contact, Meta Lead / Contact. Lead only after the endpoint answered ok:true. */
(function () {
  'use strict';
  var KEY = 'fl_consent', V = 1, MAX_AGE = 180 * 864e5, UKEY = 'fl_utm';
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'th';
  var cfg = window.FACELIORA_SITE_CONFIG || {};
  var GA_ID = typeof cfg.GA4_MEASUREMENT_ID === 'string' && /^G-[A-Z0-9]{4,20}$/i.test(cfg.GA4_MEASUREMENT_ID.trim()) ? cfg.GA4_MEASUREMENT_ID.trim() : '';
  var PX_ID = typeof cfg.META_PIXEL_ID === 'string' && /^[0-9]{5,20}$/.test(cfg.META_PIXEL_ID.trim()) ? cfg.META_PIXEL_ID.trim() : '';

  /* ---------- storage helpers (never throw) ---------- */
  function sget(st, k) { try { return window[st].getItem(k); } catch (e) { return null; } }
  function sset(st, k, v) { try { window[st].setItem(k, v); return true; } catch (e) { return false; } }

  /* ---------- UTM capture: URL -> sessionStorage ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var UTM_MAX = { utm_source: 100, utm_medium: 100, utm_campaign: 150, utm_content: 150 };
  function clean(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
  function readUtm() {
    var o = {}, raw = sget('sessionStorage', UKEY);
    if (raw) { try { var p = JSON.parse(raw); if (p && typeof p === 'object') o = p; } catch (e) { o = {}; } }
    return o;
  }
  function captureUtm() {
    var o = readUtm(), q, changed = false;
    try { q = new URLSearchParams(location.search); } catch (e) { return o; }
    UTM_KEYS.forEach(function (k) { var v = clean(q.get(k), UTM_MAX[k]); if (v) { o[k] = v; changed = true; } });
    var f = String(q.get('from') || '').toLowerCase();
    if (/^[a-z0-9][a-z0-9-]{0,59}$/.test(f)) { o.from = f; changed = true; }
    if (changed) sset('sessionStorage', UKEY, JSON.stringify(o));
    return o;
  }
  captureUtm();

  /* ---------- consent state ---------- */
  function readConsent() {
    var raw = sget('localStorage', KEY); if (!raw) return null;
    try {
      var o = JSON.parse(raw), t = Date.parse(o.ts);
      if (o && o.v === V && typeof o.analytics === 'boolean' && typeof o.marketing === 'boolean' && t && Date.now() - t < MAX_AGE) return o;
    } catch (e) { /* ignore */ }
    return null;
  }
  var state = { analytics: false, marketing: false };
  var stored = readConsent();
  if (stored) { state.analytics = stored.analytics; state.marketing = stored.marketing; }

  /* ---------- cookies we may have caused ---------- */
  function expire(name) {
    var host = location.hostname, parts = host.split('.'), doms = [''];
    for (var i = 0; i < parts.length - 1; i++) { var d = parts.slice(i).join('.'); doms.push(d, '.' + d); }
    doms.forEach(function (d) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); });
  }
  function dropCookies(re) {
    document.cookie.split(';').forEach(function (c) { var n = c.split('=')[0].trim(); if (n && re.test(n)) expire(n); });
  }

  /* ---------- Google Analytics 4 (Consent Mode v2) ---------- */
  var gaStubbed = false, gaLoaded = false;
  function gaStub() {
    if (gaStubbed || !GA_ID) return; gaStubbed = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  }
  function gaOn() { if (!GA_ID) return; gaStub(); window['ga-disable-' + GA_ID] = false; window.gtag('consent', 'update', { analytics_storage: 'granted' }); if (gaLoaded) return; gaLoaded = true;
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID); document.head.appendChild(s); }
  function gaOff() { if (GA_ID && gaStubbed) { window['ga-disable-' + GA_ID] = true; window.gtag('consent', 'update', { analytics_storage: 'denied' }); } dropCookies(/^(_ga|_gid|_gat)/); }

  /* ---------- Meta Pixel ---------- */
  var pxLoaded = false;
  function pxOn() { if (!PX_ID) return;
    if (pxLoaded) { window.fbq('consent', 'grant'); return; } pxLoaded = true;
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    n('set', 'autoConfig', false, PX_ID);   /* no automatic button/form text collection */
    n('init', PX_ID); n('track', 'PageView');
    var s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(s); }
  function pxOff() { if (PX_ID && pxLoaded && window.fbq) window.fbq('consent', 'revoke'); dropCookies(/^(_fbp|_fbc)$/); }

  var applied = { analytics: null, marketing: null };
  function apply() {
    if (state.analytics !== applied.analytics) { applied.analytics = state.analytics; state.analytics ? gaOn() : (gaStubbed || document.cookie.indexOf('_ga') > -1 ? gaOff() : 0); }
    if (state.marketing !== applied.marketing) { applied.marketing = state.marketing; state.marketing ? pxOn() : (pxLoaded || document.cookie.indexOf('_fbp') > -1 ? pxOff() : 0); }
  }

  /* ---------- events (no PII: only fixed labels) ---------- */
  function gaEvent(name, params) { if (GA_ID && state.analytics && window.gtag) window.gtag('event', name, params); }
  function pxEvent(name) { if (PX_ID && state.marketing && pxLoaded && window.fbq) window.fbq('track', name); }
  function lead(formId) { gaEvent('generate_lead', { form_id: formId === 'landing' ? 'landing' : 'demo', page_lang: LANG }); pxEvent('Lead'); }
  function contact(method) { gaEvent('contact', { method: method, page_lang: LANG }); pxEvent('Contact'); }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var h = a.getAttribute('href') || '';
    var m = /^mailto:/i.test(h) ? 'email' : /^tel:/i.test(h) ? 'tel' : /^https:\/\/(line\.me|lin\.ee)\//i.test(h) ? 'line' : '';
    if (m) contact(m);
  }, true);

  window.FLTrack = {
    utm: readUtm, lead: lead, contact: contact,
    consent: function () { return { analytics: state.analytics, marketing: state.marketing, stored: !!readConsent() }; },
    ids: function () { return { ga4: !!GA_ID, pixel: !!PX_ID }; }
  };

  /* ---------- UI ---------- (R69: friendlier first-layer wording; settings-panel shortcuts keep their own explicit labels pAccept/pReject) */
  var S = {
    th: {
      title: 'ขอใช้คุกกี้หน่อยนะคะ', text: 'เราใช้คุกกี้เพื่อดูว่าหน้าไหนมีประโยชน์ ปรับเว็บให้ดีขึ้น และวัดผลโฆษณา คุณเลือกได้ และเปลี่ยนใจได้ทุกเมื่อ', priv: 'ความเป็นส่วนตัว', privUrl: '/th/privacy/',
      accept: 'ตกลง', reject: 'ไม่เป็นไร', settings: 'เลือกเอง', pAccept: 'เปิดทั้งหมด', pReject: 'ปิดที่ไม่จำเป็น', ptitle: 'ตั้งค่าคุกกี้',
      pintro: 'เลือกได้ว่าจะอนุญาตอะไร เปลี่ยนใจได้ทุกเมื่อที่ลิงก์ “ตั้งค่าคุกกี้” ท้ายหน้า',
      ess: 'จำเป็น', essd: 'ทำให้เว็บและฟอร์มทำงาน ปิดไม่ได้', essOn: 'เปิดตลอด',
      an: 'วิเคราะห์การใช้งาน', and: 'ให้เรารู้ว่ามีคนเปิดหน้าไหน (Google Analytics 4)',
      mk: 'การตลาด', mkd: 'วัดผลโฆษณาของเราบน Facebook และ Instagram (Meta Pixel)', on: 'เปิด', off: 'ปิด',
      save: 'บันทึกที่เลือก', back: 'กลับ', mAccept: 'บันทึกแล้ว: เปิดคุกกี้ทั้งหมด', mReject: 'บันทึกแล้ว: ใช้เฉพาะคุกกี้ที่จำเป็น', mSave: 'บันทึกการตั้งค่าคุกกี้แล้ว'
    },
    en: {
      title: 'Mind if we use cookies?', text: 'We use cookies to see which pages are useful, improve the site and measure our ads. It\'s your choice, and you can change it any time.', priv: 'Privacy', privUrl: '/en/privacy/',
      accept: 'Sure', reject: 'No thanks', settings: 'Let me choose', pAccept: 'Turn all on', pReject: 'Essential only', ptitle: 'Cookie settings',
      pintro: 'Choose what to allow. You can change this any time from “Cookie settings” at the bottom of each page.',
      ess: 'Essential', essd: 'Makes the site and the form work. Cannot be turned off.', essOn: 'Always on',
      an: 'Analytics', and: 'Lets us see which pages people open (Google Analytics 4).',
      mk: 'Marketing', mkd: 'Measures our ads on Facebook and Instagram (Meta Pixel).', on: 'On', off: 'Off',
      save: 'Save my choices', back: 'Back', mAccept: 'Saved: all cookies on', mReject: 'Saved: essential cookies only', mSave: 'Cookie settings saved'
    }
  }[LANG];

  var cc = null, live = null, opener = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sw(k, label, desc) {
    return '<div class="cc-row"><div><b>' + esc(label) + '</b><span class="d">' + esc(desc) + '</span></div><label class="cc-sw"><input type="checkbox" role="switch" data-k="' + k + '" aria-label="' + esc(label) + '"><span class="cc-track" aria-hidden="true"></span><span class="st" data-on="' + esc(S.on) + '" data-off="' + esc(S.off) + '">' + esc(S.off) + '</span></label></div>';
  }
  function build() {
    cc = document.createElement('div'); cc.className = 'cc cc-b'; cc.id = 'cc'; cc.setAttribute('role', 'region'); cc.setAttribute('aria-labelledby', 'cc-t'); cc.hidden = true;
    cc.innerHTML =
      '<div class="cc-main"><h2 class="cc-title" id="cc-t">' + esc(S.title) + '</h2><p class="cc-text">' + esc(S.text) + ' <a href="' + S.privUrl + '">' + esc(S.priv) + '</a></p>' +
      '<div class="cc-actions"><button type="button" class="cc-btn" data-cc="accept">' + esc(S.accept) + '</button><button type="button" class="cc-btn" data-cc="reject">' + esc(S.reject) + '</button><button type="button" class="cc-link" data-cc="settings" aria-haspopup="dialog">' + esc(S.settings) + '</button></div></div>' +
      '<div class="cc-panel"><h2 id="cc-pt">' + esc(S.ptitle) + '</h2><p>' + esc(S.pintro) + '</p>' +
      '<div class="cc-row"><div><b>' + esc(S.ess) + '</b><span class="d">' + esc(S.essd) + '</span></div><span class="cc-sw"><input type="checkbox" role="switch" checked disabled aria-label="' + esc(S.ess + ': ' + S.essOn) + '"><span class="cc-track" aria-hidden="true"></span><span class="st">' + esc(S.essOn) + '</span></span></div>' +
      sw('analytics', S.an, S.and) + sw('marketing', S.mk, S.mkd) +
      '<div class="cc-actions"><button type="button" class="cc-btn save" data-cc="save">' + esc(S.save) + '</button><button type="button" class="cc-btn alt" data-cc="accept">' + esc(S.pAccept) + '</button><button type="button" class="cc-btn alt" data-cc="reject">' + esc(S.pReject) + '</button><button type="button" class="cc-link" data-cc="back">' + esc(S.back) + '</button></div></div>';
    live = document.createElement('div'); live.className = 'cc-live'; live.id = 'cc-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
    var skip = document.querySelector('a.skip');
    if (skip && skip.parentNode) { skip.parentNode.insertBefore(cc, skip.nextSibling); cc.parentNode.insertBefore(live, cc.nextSibling); }
    else { document.body.insertBefore(cc, document.body.firstChild); document.body.appendChild(live); }
    cc.addEventListener('click', onClick);
    cc.addEventListener('change', function (e) { var i = e.target, st = i.parentNode && i.parentNode.querySelector('.st'); if (i.dataset && i.dataset.k && st) st.textContent = i.checked ? st.dataset.on : st.dataset.off; });
  }
  function sync() {
    cc.querySelectorAll('.cc-sw input[data-k]').forEach(function (i) { i.checked = !!state[i.dataset.k]; var st = i.parentNode.querySelector('.st'); if (st) st.textContent = i.checked ? st.dataset.on : st.dataset.off; });
  }
  function setSettings(on) {
    cc.classList.toggle('is-settings', on);
    cc.setAttribute('aria-labelledby', on ? 'cc-pt' : 'cc-t');
    if (on) { var h = cc.querySelector('#cc-pt'); h.setAttribute('tabindex', '-1'); h.focus(); }
  }
  function save(a, m) {
    state.analytics = !!a; state.marketing = !!m;
    sset('localStorage', KEY, JSON.stringify({ v: V, analytics: state.analytics, marketing: state.marketing, ts: new Date().toISOString() }));
    stored = true; apply();
  }
  function close(msg) {
    cc.hidden = true; setSettings(false);
    live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30);
    var back = opener || document.getElementById('main') || document.body;
    if (back.focus) { if (!back.matches('button,a,input')) back.setAttribute('tabindex', '-1'); back.focus({ preventScroll: true }); }
    opener = null;
  }
  function onClick(e) {
    var b = e.target.closest('[data-cc]'); if (!b) return;
    var a = b.dataset.cc;
    if (a === 'accept') { save(true, true); sync(); close(S.mAccept); }
    else if (a === 'reject') { save(false, false); sync(); close(S.mReject); }
    else if (a === 'save') { var r = {}; cc.querySelectorAll('.cc-sw input[data-k]').forEach(function (i) { r[i.dataset.k] = i.checked; }); save(r.analytics, r.marketing); close(S.mSave); }
    else if (a === 'settings') { setSettings(true); }
    else if (a === 'back') { if (opener) close(''); else { setSettings(false); var s = cc.querySelector('[data-cc=settings]'); if (s) s.focus(); } }
  }
  function openFrom(el, settings) {
    opener = el || null; cc.hidden = false; sync(); setSettings(!!settings);
    if (!settings) { var b = cc.querySelector('[data-cc=accept]'); if (b) b.focus({ preventScroll: true }); }
  }
  document.addEventListener('keydown', function (e) {
    if (!cc || cc.hidden || e.key !== 'Escape' || !cc.classList.contains('is-settings')) return;
    e.preventDefault();
    if (opener) close(''); else { setSettings(false); var s = cc.querySelector('[data-cc=settings]'); if (s) s.focus(); }
  });
  document.addEventListener('click', function (e) { var o = e.target.closest && e.target.closest('[data-cc-open]'); if (o && cc) { e.preventDefault(); openFrom(o, true); } });
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return; var c = readConsent(); state.analytics = c ? c.analytics : false; state.marketing = c ? c.marketing : false; apply(); if (cc && c) { cc.hidden = true; }
  });

  function boot() {
    build();
    apply();
    if (stored) return;
    /* first layer: wait until the home intro has finished or been skipped; never show over it */
    var root = document.documentElement;
    if (root.dataset.introState !== 'playing') { cc.hidden = false; return; }
    var mo = new MutationObserver(function () { if (root.dataset.introState !== 'playing') { mo.disconnect(); if (!readConsent()) cc.hidden = false; } });
    mo.observe(root, { attributes: true, attributeFilter: ['data-intro-state'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
