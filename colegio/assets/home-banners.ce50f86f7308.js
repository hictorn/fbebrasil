(() => {
  const carousel = document.querySelector('.home-banners');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.banner');
  const previous = carousel.querySelector('.home-banners__previous');
  const next = carousel.querySelector('.home-banners__next');
  if (slides.length < 2 || !previous || !next) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;

  function schedule() {
    window.clearTimeout(timer);
    if (document.hidden || reducedMotion.matches || carousel.querySelector(':focus-visible')) return;
    timer = window.setTimeout(() => showSlide(1), 10_000);
  }

  function showSlide(offset) {
    slides[current].hidden = true;
    current = (current + offset + slides.length) % slides.length;
    slides[current].hidden = false;
    schedule();
  }

  previous.hidden = false;
  next.hidden = false;
  previous.addEventListener('click', () => showSlide(-1));
  next.addEventListener('click', () => showSlide(1));
  carousel.addEventListener('focusin', schedule);
  carousel.addEventListener('focusout', () => window.setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
})();
