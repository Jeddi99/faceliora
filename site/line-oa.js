/* Renders the LINE button into <template data-line-slot> placeholders when LINE_OA_URL is a valid https URL.
 * No SDK, no external script, no storage. Plain link, same tab. Empty/invalid config -> nothing is rendered. */
(function () {
  'use strict';
  var cfg = window.FACELIORA_SITE_CONFIG || {};
  var url = typeof cfg.LINE_OA_URL === 'string' ? cfg.LINE_OA_URL.trim() : '';
  if (!/^https:\/\/[^\s"'<>]+$/i.test(url)) return;
  var slots = document.querySelectorAll('template[data-line-slot]');
  for (var i = 0; i < slots.length; i++) {
    var t = slots[i], a = document.createElement('a');
    a.className = 'quiet line-oa';
    a.href = url;
    a.setAttribute('data-line-oa', '');
    a.textContent = t.getAttribute('data-label') || '';
    t.parentNode.insertBefore(a, t);
  }
})();
