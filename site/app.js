// Local review interactions. No endpoint, storage or analytics.
function setLanguage(lang) {
  if (!['th', 'en'].includes(lang)) return;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-th][data-en]').forEach(el => { el.textContent = el.dataset[lang]; });
  document.querySelectorAll('[data-alt-th]').forEach(el => { el.setAttribute('aria-label', el.getAttribute('data-alt-' + lang)); });
  document.querySelectorAll('[data-lang]').forEach(el => { el.setAttribute('aria-pressed', String(el.dataset.lang === lang)); });
  document.title = lang === 'th' ? 'Faceliora | เห็นภาพก่อนตัดสินใจ' : 'Faceliora | See the same possibility';
  document.querySelector('meta[name="description"]').content = lang === 'th' ? 'สำรวจภาพ 2D สำหรับคุณ และภาพจำลอง 3D เพื่อคุยร่วมกับคลินิก แบบออกแบบเพื่อพิจารณาเท่านั้น' : 'Explore 2D views for yourself and 3D simulation for clinic consultations. Design preview only.';
  document.getElementById('language-status').textContent = lang === 'th' ? 'แสดงภาษาไทย' : 'English selected';
}
document.querySelectorAll('[data-lang]').forEach(el => el.addEventListener('click', () => setLanguage(el.dataset.lang)));
document.querySelectorAll('[aria-disabled="true"]').forEach(el => el.addEventListener('click', event => event.preventDefault()));
if (new URLSearchParams(location.search).get('lang') === 'en') setLanguage('en');
