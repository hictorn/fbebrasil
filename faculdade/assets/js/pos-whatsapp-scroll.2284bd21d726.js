(() => {
  const card = document.querySelector('.course-layout-with-contact > .whatsapp-admissions');
  const sectionBar = document.querySelector('.course-subnav');
  const faq = document.getElementById('curso-duvidas');
  if (!card || !sectionBar || !faq) return;

  const desktop = window.matchMedia('(min-width: 1001px)');
  const gapBelowBar = 16;
  let offset = 0;
  let frame = 0;

  function updateCard() {
    frame = 0;
    if (!desktop.matches) {
      card.style.removeProperty('position');
      card.style.removeProperty('top');
      offset = 0;
      return;
    }

    if (card.style.position !== 'relative') {
      card.style.position = 'relative';
      card.style.top = '0px';
    }

    const cardBounds = card.getBoundingClientRect();
    const naturalTop = cardBounds.top - offset;
    const start = sectionBar.getBoundingClientRect().bottom + gapBelowBar;
    const end = faq.getBoundingClientRect().bottom - cardBounds.height;
    const nextOffset = Math.max(0, Math.min(start, end) - naturalTop);

    if (nextOffset !== offset) {
      card.style.top = `${nextOffset}px`;
      offset = nextOffset;
    }
  }

  function scheduleUpdate() {
    if (!frame) frame = window.requestAnimationFrame(updateCard);
  }

  window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleUpdate);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleUpdate);
    [card, card.parentElement, faq, sectionBar].forEach(element => observer.observe(element));
  }
  updateCard();
})();
