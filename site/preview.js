(() => {
  function setLanguage(value) {
    const lang = value === 'en' ? 'en' : 'th';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-th][data-en]').forEach(element => {
      element.innerHTML = element.dataset[lang];
    });
    document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    document.title = lang === 'th' ? 'Faceliora | เห็นภาพก่อนตัดสินใจ' : 'Faceliora | See your options before you decide';
    document.querySelector('meta[name="description"]').content = lang === 'th' ? 'Faceliora ภาพนิ่ง 2D สำหรับคุณ และ Clinic 3D สำหรับการปรึกษาร่วมกัน' : 'Faceliora: static 2D facial simulation for you and shared Clinic 3D consultation.';
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  document.querySelectorAll('[aria-disabled="true"]').forEach(button => {
    button.addEventListener('click', event => event.preventDefault());
    button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); });
  });
  setLanguage(new URLSearchParams(location.search).get('lang'));
})();
