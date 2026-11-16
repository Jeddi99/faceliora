/* R56 clinic ROI calculator = R38 calculator with a clinic-entered monthly fee (no built-in price).
   Pure arithmetic in the page: no fetch, no storage, no cookies, no analytics. No built-in or borrowed numbers. */
(function () {
  var LIM = { consults: [0, 5000], cur: [0, 100], exp: [0, 100], val: [1, 2000000], fee: [0, 1000000], tcur: [1, 240], texp: [1, 240], cph: [1, 100000] };
  var KEYS = ['consults', 'cur', 'exp', 'val', 'fee', 'tcur', 'texp', 'cph'];
  var INT = { consults: 'int', tcur: 'tint', texp: 'tint' };
  var TH_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
  document.documentElement.classList.remove('no-js'); document.documentElement.classList.add('js');

  function parse(s) {
    s = String(s == null ? '' : s).replace(/[๐-๙]/g, function (d) { return TH_DIGITS.indexOf(d); })
      .replace(/[,\s฿%]/g, '').replace(/^\+/, '');
    if (s === '') return { empty: true };
    if (!/^-?\d+(\.\d+)?$/.test(s)) return { bad: 'nan' };
    return { n: parseFloat(s) };
  }
  function fmt(n, lang, dec) {
    return n.toLocaleString(lang === 'en' ? 'en-US' : 'th-TH', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }
  function baht(n, lang) { return (n < 0 ? '\u2212' : '') + '\u0e3f' + fmt(Math.abs(n), lang, 0); }
  function round1(n) { return Math.round((n + 1e-9) * 10) / 10; }

  /* v.fee is typed by the clinic (from its quote); null/undefined = not entered, nothing fee-related is computed. */
  function compute(v) {
    var r = { be: null, beRaw: null, net: null, extra: null, rev: null, time: null };
    var hasFee = v.fee != null;
    if (hasFee && v.val != null) {
      r.beRaw = v.fee / v.val;
      r.be = v.fee === 0 ? 0 : Math.max(1, Math.ceil(r.beRaw - 1e-9));
    }
    if (v.consults != null && v.cur != null && v.exp != null) {
      r.extra = round1(v.consults * (v.exp - v.cur) / 100);
      if (v.val != null) {
        r.extraRaw = v.consults * (v.exp - v.cur) / 100;
        r.rev = Math.round(r.extraRaw * v.val + 1e-9 * Math.sign(r.extraRaw));
        if (hasFee) r.net = r.rev - v.fee;
      }
    }
    if (v.consults != null && v.tcur != null && v.texp != null) {
      var per = Math.max(0, v.tcur - v.texp);             // minutes saved per consultation, never negative
      var mins = v.consults * per;                          // total minutes saved per month
      var t = { per: per, mins: mins, saves: per > 0 && mins > 0, value: null };
      t.hours = mins / 60;
      t.hoursShown = mins >= 60 ? round1(t.hours) : null;   // under 1 hour we show whole minutes instead of "0.0 h"
      if (t.saves && v.cph != null) t.value = Math.round(t.hours * v.cph + 1e-9);
      r.time = t;
    }
    return r;
  }
  window.ROI = { compute: compute, parse: parse, fmt: fmt, baht: baht, LIM: LIM };

  function init(root) {
    var lang = root.getAttribute('data-lang') || 'th';
    var T = JSON.parse(root.querySelector('script[data-roi-copy]').textContent);
    function beText(n) { return n === 0 && T.be0 ? T.be0 : (n === 1 && T.be1 ? T.be1 : T.be.replace('{x}', fmt(n, lang))); }
    var inputs = {}; KEYS.forEach(function (k) { inputs[k] = root.querySelector('[data-in="' + k + '"]'); });
    var out = function (k) { return root.querySelector('[data-out="' + k + '"]'); };
    var touched = {}; var liveTimer;

    function read(k) {
      var el = inputs[k]; if (!el) return { empty: true };
      var p = parse(el.value);
      if (p.empty) return p;
      if (p.bad) return { err: T.err.nan };
      var lim = LIM[k];
      if (INT[k] && p.n % 1 !== 0) return { err: T.err[INT[k]] };
      if (p.n < lim[0] || p.n > lim[1]) return { err: T.err[k] };
      return { n: p.n };
    }
    function setErr(k, msg) {
      var el = inputs[k]; if (!el) return;
      var box = root.querySelector('[data-err="' + k + '"]');
      if (msg) { el.setAttribute('aria-invalid', 'true'); box.textContent = msg; box.hidden = false; el.closest('.roi-field').classList.add('is-bad'); }
      else { el.removeAttribute('aria-invalid'); box.textContent = ''; box.hidden = true; el.closest('.roi-field').classList.remove('is-bad'); }
    }
    function put(k, text) { root.querySelectorAll('[data-out="' + k + '"]').forEach(function (o) { o.textContent = text; }); }
    function timeText(t) { return t.hoursShown != null ? T.hFmt.replace('{n}', fmt(t.hoursShown, lang, 1)) : T.mFmt.replace('{n}', fmt(t.mins, lang)); }

    function update(final) {
      var v = {}, anyErr = false;
      KEYS.forEach(function (k) {
        if (!inputs[k]) return;
        var r = read(k);
        if (r.err) { v[k] = null; anyErr = true; if (touched[k] || final) setErr(k, r.err); else setErr(k, ''); }
        else { setErr(k, ''); v[k] = r.empty ? null : r.n; }
      });
      var warnLow = v.cur != null && v.exp != null && v.exp < v.cur;
      var w = root.querySelector('[data-warn="low"]'); if (w) w.hidden = !warnLow;
      var warnT = v.tcur != null && v.texp != null && v.texp >= v.tcur;
      var wt = root.querySelector('[data-warn="tlow"]'); if (wt) wt.hidden = !warnT;
      var res = compute(v);

      /* shared consults echo (option A time block) */
      root.querySelectorAll('[data-echo="consults"]').forEach(function (e) { e.textContent = v.consults != null ? T.echoVal.replace('{n}', fmt(v.consults, lang)) : T.echoNone; });

      /* revenue, then the fee block (only when the clinic typed a fee) */
      var full = res.rev != null, hasFee = v.fee != null, hasBe = res.be != null, hasNet = res.net != null;
      root.classList.toggle('has-be', hasBe);
      root.classList.toggle('has-result', full);
      var E = T.empty; put('extra', res.extra != null ? fmt(res.extra, lang, 1) : E);
      put('rev', full ? baht(res.rev, lang) : E);
      ['extra', 'rev'].forEach(function (k) { var o = out(k); if (o) (o.tagName === 'DD' ? o : o.parentNode).classList.toggle('empty', !(k === 'extra' ? res.extra != null : full)); });
      var feeSec = root.querySelector('[data-fee-res]'); if (feeSec) feeSec.hidden = !hasFee;
      put('feeWait', hasFee ? '' : T.feeWait);
      put('feeBe', hasBe ? beText(res.be) : (hasFee ? T.feeNeedVal : ''));
      put('feeBeExact', hasBe && res.be > 0 ? T.beExact.replace('{f}', baht(v.fee, lang)).replace('{v}', baht(v.val, lang)).replace('{r}', fmt(res.beRaw, lang, 1)) : '');
      put('feeNet', hasNet ? baht(res.net, lang) : E);
      var nd = out('feeNet'); if (nd) nd.classList.toggle('empty', !hasNet);
      var nbox = root.querySelector('[data-net-box="fee"]'); if (nbox) nbox.classList.toggle('is-neg', hasNet && res.net < 0);
      var st = '';
      if (hasNet) {
        if (res.net >= 0) st = T.pos.replace('{f}', baht(v.fee, lang));
        else if (res.rev > 0) st = T.short.replace('{n}', fmt(Math.max(0.1, round1(res.beRaw - res.extraRaw)), lang, 1));
        else st = T.none;
      }
      put('feeStatus', st);
      var sh = T.wait;
      if (full) sh = ''; else if (res.extra != null && v.val == null) sh = T.needVal; else if (anyErr) sh = T.fix;
      put('status', sh);
      put('revShort', full ? baht(res.rev, lang) : '');

      /* time */
      var t = res.time;
      root.classList.toggle('has-time', !!t);
      put('tper', t ? T.mFmt.replace('{n}', fmt(t.per, lang)) : E);
      put('thours', t ? (t.saves ? timeText(t) : T.noSave) : E);
      var tp = out('tper'), th = out('thours');
      if (tp) tp.classList.toggle('empty', !t); if (th) th.classList.toggle('empty', !t || !t.saves);
      var tvRow = root.querySelector('[data-time-value]'); var showVal = !!(t && t.saves && t.value != null);
      if (tvRow) tvRow.hidden = !showVal;
      put('tval', showVal ? baht(t.value, lang) : '');
      var ts = T.twait;
      if (t) ts = t.saves ? T.tok.replace('{n}', timeText(t)) : (t.per > 0 ? T.tzero : T.tnone);
      else if (anyErr && (inputs.tcur && read('tcur').err || inputs.texp && read('texp').err)) ts = T.tfix;
      put('tstatus', ts);
      put('timeShort', t && t.saves ? timeText(t) : '');
      var tbox = root.querySelector('[data-time-res]'); if (tbox) tbox.classList.toggle('is-none', !!(t && !t.saves));

      /* polite live message, debounced */
      var live = out('live');
      if (live) {
        clearTimeout(liveTimer);
        liveTimer = setTimeout(function () {
          var s = '';
          if (hasNet) s += T.liveNet.replace('{a}', baht(res.net, lang)) + ' ';
          if (t) s += t.saves ? T.liveTime.replace('{n}', timeText(t)) : T.tnone;
          live.textContent = s;
        }, final ? 0 : 900);
      }
    }

    KEYS.forEach(function (k) {
      var el = inputs[k]; if (!el) return;
      el.addEventListener('input', function () { update(false); });
      el.addEventListener('blur', function () { touched[k] = true; update(true); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); touched[k] = true; update(true); } });
    });
    var reset = root.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () { KEYS.forEach(function (k) { if (inputs[k]) inputs[k].value = ''; touched[k] = false; }); update(false); inputs.consults && inputs.consults.focus(); });
    root.querySelectorAll('form').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });

    /* option C: details toggles whether the time block shows in the result panel */
    var det = root.querySelector('details.roi-det');
    if (det) { var sync = function () { root.classList.toggle('time-open', det.open); }; det.addEventListener('toggle', sync); sync(); }

    root.setAttribute('data-ready', '1');
    update(false);
  }
  function ready() { document.querySelectorAll('[data-roi]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
