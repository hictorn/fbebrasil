(function () {
  'use strict';
  function initializeMobileNavigation() {
    const header = document.querySelector('.site-header,.header');
    if (!header || header.hasAttribute('data-fbe-navigation-ready')) return;
    const nav = header.querySelector('.main-nav');
    const toggle = header.querySelector('.nav-toggle,.mobile-toggle');
    if (!nav || !toggle) return;
    header.setAttribute('data-fbe-navigation-ready', 'true');
    nav.setAttribute('data-fbe-mobile-menu', '');
    toggle.setAttribute('data-fbe-mobile-toggle', '');
    nav.id ||= 'fbe-mobile-menu';
    toggle.setAttribute('aria-controls', nav.id);
    let mobile = false;
    function setState(open, restoreFocus = false) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      toggle.textContent = open ? '✕' : '☰';
      if (!open) {
        nav.querySelectorAll('details[open]').forEach(item => item.open = false);
      }
      if (restoreFocus) toggle.focus({ preventScroll:true });
    }
    function updateAvailableHeight() {
      header.style.setProperty('--fbe-mobile-header-bottom', Math.max(0, header.getBoundingClientRect().bottom) + 'px');
    }
    function syncMode() {
      const next = getComputedStyle(toggle).display !== 'none';
      if (next && !header.hasAttribute('data-fbe-mobile-header')) {
        const panel = getComputedStyle(nav).backgroundColor;
        const background = panel === 'transparent' || panel === 'rgba(0, 0, 0, 0)' ? getComputedStyle(header).backgroundColor : panel;
        nav.style.setProperty('--fbe-mobile-menu-bg', background);
        header.setAttribute('data-fbe-mobile-header', 'true');
      } else if (!next) header.removeAttribute('data-fbe-mobile-header');
      if (mobile !== next) setState(false);
      mobile = next;
      updateAvailableHeight();
    }
    document.addEventListener('click', event => {
      if (!mobile || !(event.target instanceof Element)) return;
      if (toggle.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        updateAvailableHeight();
        setState(!nav.classList.contains('open'));
      } else if (!nav.contains(event.target) || event.target.closest('a[href]')) setState(false);
    }, true);
    document.addEventListener('keydown', event => {
      if (mobile && event.key === 'Escape' && nav.classList.contains('open')) {
        event.preventDefault();
        setState(false, true);
      }
    }, true);
    window.addEventListener('resize', syncMode, { passive:true });
    window.addEventListener('orientationchange', syncMode);
    window.addEventListener('scroll', () => { if (mobile && nav.classList.contains('open')) updateAvailableHeight(); }, { passive:true });
    document.fonts?.ready.then(syncMode);
    setState(false);
    syncMode();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMobileNavigation, { once:true });
  else initializeMobileNavigation();
})();
