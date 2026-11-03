(function () {
  'use strict';
  const box = document.getElementById('tg-lightbox');
  if (!box) return;
  const photos = Array.from(document.querySelectorAll('[data-tg-photo]'));
  if (!photos.length) return;
  const image = box.querySelector('.tg-lightbox-image');
  const counter = box.querySelector('.tg-lightbox-count');
  const closeButton = box.querySelector('.tg-lightbox-close');
  const prevButton = box.querySelector('.tg-lightbox-prev');
  const nextButton = box.querySelector('.tg-lightbox-next');
  let index = 0;
  let opener = null;
  let background = [];
  let previousPosition = '';
  let previousTop = '';
  let previousWidth = '';
  let scrollY = 0;

  function show(next) {
    index = (next + photos.length) % photos.length;
    const photo = photos[index].querySelector('img');
    image.src = photos[index].dataset.tgPhoto;
    image.alt = photo.alt;
    image.width = Number(photos[index].dataset.width);
    image.height = Number(photos[index].dataset.height);
    counter.textContent = (index + 1) + ' de ' + photos.length;
  }

  function open(next, source) {
    opener = source;
    show(next);
    scrollY = window.scrollY;
    previousPosition = document.body.style.position;
    previousTop = document.body.style.top;
    previousWidth = document.body.style.width;
    document.body.classList.add('tg-lightbox-open');
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.width = '100%';
    background = Array.from(document.body.children).filter(el => el !== box && !['SCRIPT', 'STYLE'].includes(el.tagName));
    background.forEach(el => { el.dataset.tgWasInert = String(el.inert); el.inert = true; });
    box.setAttribute('aria-hidden', 'false');
    closeButton.focus({preventScroll:true});
  }

  function close() {
    if (box.getAttribute('aria-hidden') === 'true') return;
    box.setAttribute('aria-hidden', 'true');
    background.forEach(el => { el.inert = el.dataset.tgWasInert === 'true'; delete el.dataset.tgWasInert; });
    document.body.classList.remove('tg-lightbox-open');
    document.body.style.position = previousPosition;
    document.body.style.top = previousTop;
    document.body.style.width = previousWidth;
    const behavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollY);
    document.documentElement.style.scrollBehavior = behavior;
    opener?.focus({preventScroll:true});
  }

  photos.forEach((photo, i) => photo.addEventListener('click', event => {
    event.preventDefault();
    open(i, photo);
  }));
  document.querySelectorAll('[data-tg-open]').forEach(photo => photo.addEventListener('click', event => {
    event.preventDefault();
    open(Number(photo.dataset.tgOpen), photo);
  }));
  closeButton.addEventListener('click', close);
  prevButton.addEventListener('click', () => show(index - 1));
  nextButton.addEventListener('click', () => show(index + 1));
  box.addEventListener('click', event => { if (event.target === box) close(); });
  document.addEventListener('keydown', event => {
    if (box.getAttribute('aria-hidden') === 'true') return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    if (event.key === 'Tab') {
      const buttons = [closeButton, prevButton, nextButton];
      const current = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });
  let touch = null;
  box.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
  }, {passive:true});
  box.addEventListener('touchend', event => {
    if (!touch || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    touch = null;
  }, {passive:true});
  box.addEventListener('touchcancel', () => { touch = null; }, {passive:true});
})();
