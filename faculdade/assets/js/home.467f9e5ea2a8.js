document.addEventListener('DOMContentLoaded', () => {
  const home = document.getElementById('view-home');
  const views = Array.from(document.querySelectorAll('[id^="view-"]')).filter(el => el !== home);
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.nav-toggle');
  const coursesButton = document.querySelector('.nav-courses-toggle');
  const coursesMenu = document.querySelector('.nav-courses-menu');

  function closeCourses() {
    if (!coursesMenu) return;
    coursesMenu.hidden = true;
    coursesButton.setAttribute('aria-expanded', 'false');
  }
  function closeMenu() {
    nav.classList.remove('open');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    closeCourses();
  }
  function address(course, section) {
    const url = new URL(location.href);
    if (course) url.searchParams.set('curso', course);
    else url.searchParams.delete('curso');
    url.hash = section && section !== 'topo' ? section : '';
    if (url.href !== location.href) history.pushState(null, '', url);
  }
  function showSection(id = 'topo', updateAddress = true) {
    views.forEach(view => view.style.display = 'none');
    home.style.display = '';
    closeMenu();
    if (updateAddress) address(null, id);
    const target = document.getElementById(id) || document.getElementById('cursos');
    const offset = (document.querySelector('.site-header')?.getBoundingClientRect().height || 0) + 20;
    requestAnimationFrame(() => window.scrollTo({
      top: id === 'topo' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset),
      behavior: 'instant'
    }));
  }
  function showCourse(slug, updateAddress = true, origin = 'card') {
    const selected = views.find(view => view.id === 'view-' + slug);
    if (!selected) return false;
    home.style.display = 'none';
    views.forEach(view => view.style.display = view === selected ? '' : 'none');
    closeMenu();
    if (updateAddress) address(slug);
    window.scrollTo(0, 0);
    const name = selected.querySelector('h1')?.textContent.trim() || slug;
    try {
      if (typeof gtag === 'function') gtag('event', 'view_curso', { curso: name, origem: origin });
      if (typeof fbq === 'function') fbq('track', 'ViewContent', { content_name: name, content_category: 'curso' });
    } catch (_) {}
    return true;
  }
  function restoreAddress() {
    const slug = new URLSearchParams(location.search).get('curso')?.toLowerCase().trim();
    if (slug && showCourse(slug, false, 'url')) return;
    showSection(location.hash.slice(1) || 'topo', false);
  }

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.textContent = open ? '✕' : '☰';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  coursesButton?.addEventListener('click', () => {
    coursesMenu.hidden = !coursesMenu.hidden;
    coursesButton.setAttribute('aria-expanded', String(!coursesMenu.hidden));
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-courses')) closeCourses();
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute('data-open-pos')) return;
    if (link.classList.contains('js-open-curso')) {
      event.preventDefault();
      showCourse(link.dataset.curso);
      return;
    }
    if (link.classList.contains('js-back-home') || link.getAttribute('href')?.startsWith('#')) {
      event.preventDefault();
      if (link.dataset.curso) {
        const select = document.querySelector('#hero-form [name="curso"]');
        select.value = 'Graduação';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        try {
          if (link.classList.contains('sc-cta') && typeof gtag === 'function') gtag('event', 'clique_inscreva_se', { curso: link.dataset.curso });
        } catch (_) {}
      }
      showSection(link.dataset.scroll || link.getAttribute('href').slice(1) || 'topo');
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.querySelectorAll('.faq-question').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const wasOpen = button.classList.contains('open');
      document.querySelectorAll('.faq-question.open').forEach(other => {
        other.classList.remove('open');
        other.nextElementSibling.classList.remove('open');
        other.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        button.classList.add('open');
        button.nextElementSibling.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
  window.addEventListener('popstate', restoreAddress);
  window.addEventListener('hashchange', restoreAddress);
  restoreAddress();
});
