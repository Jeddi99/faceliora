/* R47 demo lead form (design R43 option A). Plain JS, no library, no third-party request, nothing is stored in the browser.
 * Config: window.FACELIORA_SITE_CONFIG.LEAD_ENDPOINT_URL (site-config.js). https:// Apps Script Web App URL.
 *   Empty / invalid  -> the form shows a notice (LINE / email), the submit button is disabled and NOTHING is sent. No fake success.
 * Source of the lead: ?from=<cta-id> (a-z 0-9 hyphen, <= 60 chars), else "direct". */
(function () {
  'use strict';
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'th';
  var M = {
    th: {
      name: 'กรอกชื่อ-นามสกุลของคุณ',
      clinic: 'กรอกชื่อคลินิกหรือองค์กร',
      phone_empty: 'กรอกเบอร์โทรให้ทีมติดต่อกลับ',
      phone_bad: 'เบอร์โทรไม่ถูกต้อง ลองแบบ 081 234 5678 หรือ 02 123 4567',
      email_empty: 'กรอกอีเมลให้ทีมติดต่อกลับ',
      email_bad: 'อีเมลไม่ถูกต้อง ลองแบบ name@gmail.com',
      line: 'LINE ID ใช้ได้ 4–20 ตัว เป็น a–z ตัวเลข จุด ขีดล่าง หรือขีดกลาง',
      consent: 'ติ๊กยินยอมเพื่อให้ทีมติดต่อกลับได้', consent_l: 'ยินยอมให้ติดต่อกลับ',
      sum_one: 'ยังกรอกไม่ครบ 1 ช่อง', sum_n: function (n) { return 'ยังกรอกไม่ครบ ' + n + ' ช่อง'; },
      sum_hint: 'กดชื่อช่องเพื่อไปแก้',
      send: 'ส่งข้อมูล นัดสาธิต', sending: 'กำลังส่ง…',
      count: function (n, max) { return n + '/' + max; }
    },
    en: {
      name: 'Enter your full name',
      clinic: 'Enter your clinic or organisation name',
      phone_empty: 'Enter a phone number so the team can call you back',
      phone_bad: 'That phone number looks wrong. Try 081 234 5678 or 02 123 4567',
      email_empty: 'Enter your email so the team can reply',
      email_bad: 'That email looks wrong. Try name@gmail.com',
      line: 'LINE ID: 4–20 characters, a–z, digits, dot, underscore or hyphen',
      consent: 'Tick the box so the team can contact you', consent_l: 'Consent to be contacted',
      sum_one: '1 field still needs attention', sum_n: function (n) { return n + ' fields still need attention'; },
      sum_hint: 'Select a field name to jump to it',
      send: 'Send demo request', sending: 'Sending…',
      count: function (n, max) { return n + '/' + max; }
    }
  }[LANG];

  var qs = new URLSearchParams(location.search);
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  /* TH phone: accepts 0812345678, 081-234-5678, +66 81 234 5678, 02 123 4567. Returns national 0xxxxxxxxx or ''. */
  function thPhone(raw) {
    var s = String(raw || '').replace(/[\s().-]/g, '');
    if (/^\+66/.test(s)) s = '0' + s.slice(3); else if (/^66\d{8,9}$/.test(s)) s = '0' + s.slice(2);
    if (/^0[689]\d{8}$/.test(s)) return s;       /* mobile: 06x 08x 09x + 8 digits */
    if (/^0[2-57]\d{7}$/.test(s)) return s;      /* landline: 02 / 03 / 04 / 05 / 07 + 7 digits */
    return '';
  }
  var RULES = {
    name: function (v) { return norm(v).length >= 2 ? '' : M.name; },
    clinic: function (v) { return norm(v).length >= 2 ? '' : M.clinic; },
    phone: function (v) { return !norm(v) ? M.phone_empty : (thPhone(v) ? '' : M.phone_bad); },
    email: function (v) { v = norm(v); return !v ? M.email_empty : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : M.email_bad); },
    line_id: function (v) { v = norm(v); return !v || /^[A-Za-z0-9._-]{4,20}$/.test(v.replace(/^@/, '')) ? '' : M.line; }
  };
  var ORDER = ['name', 'clinic', 'phone', 'email', 'line_id', 'consent'];

  function endpoint() {
    var cfg = window.FACELIORA_SITE_CONFIG || {}, url = typeof cfg.LEAD_ENDPOINT_URL === 'string' ? cfg.LEAD_ENDPOINT_URL.trim() : '';
    return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : '';
  }

  function init(root) {
    var form = root.querySelector('form.r43-form');
    if (!form || root.__r43) return; root.__r43 = 1;
    var summary = root.querySelector('.r43-summary');
    var net = root.querySelector('.r43-net');
    var ok = root.querySelector('.r43-ok');
    var off = root.querySelector('.r43-off');
    var btn = form.querySelector('.r43-submit');
    var lbl = btn.querySelector('.r43-lbl');
    var day = form.elements.preferred_day;
    var msg = form.elements.message, cnt = root.querySelector('.r43-count');
    var from = String(qs.get('from') || '').toLowerCase();
    var source = /^[a-z0-9][a-z0-9-]{0,59}$/.test(from) ? from : 'direct';
    function setState(s) { root.setAttribute('data-state', s); root.dispatchEvent(new CustomEvent('r43:state', { detail: s, bubbles: true })); }
    function f(id) { return form.querySelector('[name="' + id + '"]'); }
    function errEl(id) { return root.querySelector('[data-err="' + id + '"]'); }
    function labelOf(id) {
      var el = f(id); if (!el) return id;
      if (id === 'consent') return M.consent_l;
      var l = form.querySelector('label[for="' + el.id + '"] .r43-lt');
      return norm(l ? l.textContent : id);
    }
    function validateOne(id) {
      if (id === 'consent') return f('consent').checked ? '' : M.consent;
      return RULES[id](f(id).value);
    }
    function showErr(id, m) {
      var el = f(id), e = errEl(id); if (!el || !e) return;
      if (m) { e.textContent = m; e.hidden = false; el.setAttribute('aria-invalid', 'true'); }
      else { e.textContent = ''; e.hidden = true; el.removeAttribute('aria-invalid'); }
    }
    function renderSummary(list) {
      if (!list.length) { summary.hidden = true; summary.innerHTML = ''; return; }
      var h = '<p class="r43-sum-t">' + (list.length === 1 ? M.sum_one : M.sum_n(list.length)) + '</p><p class="r43-sum-h">' + M.sum_hint + '</p><ul>';
      list.forEach(function (x) { h += '<li><a href="#' + f(x.id).id + '">' + labelOf(x.id) + '</a><span>' + x.m + '</span></li>'; });
      summary.innerHTML = h + '</ul>'; summary.hidden = false;
    }
    function validateAll() {
      var list = [];
      ORDER.forEach(function (id) { var m = validateOne(id); showErr(id, m); if (m) list.push({ id: id, m: m }); });
      return list;
    }
    /* blur validation for required fields only once the person has left the field; fix-as-you-type once an error shows */
    ORDER.forEach(function (id) {
      var el = f(id); if (!el) return;
      el.addEventListener('blur', function () { if (id === 'consent') return; if (el.value !== '' || el.dataset.touched) showErr(id, validateOne(id)); el.dataset.touched = '1'; });
      el.addEventListener(id === 'consent' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true') {
          showErr(id, validateOne(id));
          if (root.getAttribute('data-state') === 'invalid') { var left = ORDER.filter(function (k) { return f(k).getAttribute('aria-invalid') === 'true'; }); if (!left.length) { summary.hidden = true; setState('idle'); } }
        }
      });
    });
    summary.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return; e.preventDefault();
      var el = form.querySelector(a.getAttribute('href')); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
    });
    if (day) { var d = new Date(); day.min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    if (msg && cnt) { var upd = function () { cnt.textContent = M.count(msg.value.length, msg.maxLength); }; msg.addEventListener('input', upd); upd(); }

    /* Keys = lead-form/apps-script/Code.gs HEADERS (minus received_at, set by the server) + website (honeypot). Nothing else is sent. */
    function payload() {
      var role = form.querySelector('input[name="role"]:checked');
      return {
        name: norm(f('name').value), clinic: norm(f('clinic').value), phone: thPhone(f('phone').value), email: norm(f('email').value).toLowerCase(),
        line_id: norm(f('line_id').value).replace(/^@/, ''), province: f('province').value, role: role ? role.value : '',
        preferred_day: day ? day.value : '', message: norm(msg.value) === '' ? '' : msg.value.trim(),
        consent: true, consent_version: 'r43-' + LANG + '-1', lang: LANG, source_page: location.pathname, source_cta: source,
        website: f('website').value
      };
    }
    function send(p, url) {
      var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 15000);
      /* text/plain keeps this a "simple" request: no CORS pre-flight, which Apps Script cannot answer */
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p), signal: ctl.signal, redirect: 'follow', credentials: 'omit' })
        .then(function (r) { clearTimeout(to); if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (j) { if (!j || j.ok !== true) throw new Error('rejected'); }, function (e) { clearTimeout(to); throw e; });
    }
    function busy(on) { btn.disabled = on || !endpoint(); btn.setAttribute('aria-busy', on ? 'true' : 'false'); lbl.textContent = on ? M.sending : M.send; form.classList.toggle('is-busy', on); }
    /* No endpoint configured: say so, keep the form (data stays), disable the button. Never pretend to send. */
    function applyEndpointState() {
      var has = !!endpoint();
      root.setAttribute('data-endpoint', has ? 'on' : 'off');
      if (off) off.hidden = has;
      btn.disabled = !has; if (!has) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    }
    function success(p) {
      var echo = ok.querySelector('.r43-echo');
      if (echo) { echo.innerHTML = ''; [p.name, p.phone, p.email].forEach(function (v) { var li = document.createElement('li'); li.textContent = v; echo.appendChild(li); }); }
      form.hidden = true; net.hidden = true; summary.hidden = true; if (off) off.hidden = true;
      root.querySelectorAll('.r43-hide-ok').forEach(function (n) { n.hidden = true; });
      ok.hidden = false; setState('success'); var h = ok.querySelector('h2,h3'); h.setAttribute('tabindex', '-1'); h.focus();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (btn.disabled) return;
      var url = endpoint(); if (!url) { applyEndpointState(); return; }
      var list = validateAll(); renderSummary(list); net.hidden = true;
      if (list.length) { setState('invalid'); summary.setAttribute('tabindex', '-1'); summary.focus(); summary.scrollIntoView({ block: 'nearest' }); return; }
      var p = payload();
      if (p.website) { success(p); return; }              /* honeypot filled: look successful, send nothing */
      busy(true); setState('submitting');
      send(p, url).then(function () { busy(false); success(p); }, function () {
        busy(false); net.hidden = false; setState('neterror');
        net.setAttribute('tabindex', '-1'); net.focus(); net.scrollIntoView({ block: 'nearest' });
      });
    });
    var rt = root.querySelector('.r43-retry'); if (rt) rt.addEventListener('click', function () { form.requestSubmit(); });
    root.__r43reset = function () { form.reset(); form.hidden = false; ok.hidden = true; net.hidden = true; summary.hidden = true; root.querySelectorAll('.r43-hide-ok').forEach(function (n) { n.hidden = false; }); ORDER.forEach(function (id) { showErr(id, ''); }); busy(false); applyEndpointState(); setState('idle'); if (cnt) msg.dispatchEvent(new Event('input')); };
    applyEndpointState();
    setState('idle');
  }

  function boot() {
    document.querySelectorAll('.r43').forEach(init);
    document.querySelectorAll('.r43-reset').forEach(function (b) { b.addEventListener('click', function () { b.closest('.r43').__r43reset(); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.R43 = { thPhone: thPhone, rules: RULES };
})();
