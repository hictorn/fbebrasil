(() => {
  const carousel = document.querySelector('.home-banners');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.banner');
  const next = carousel.querySelector('.home-banners__next');
  if (slides.length < 2 || !next) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;

  function schedule() {
    window.clearTimeout(timer);
    if (document.hidden || reducedMotion.matches || carousel.querySelector(':focus-visible')) return;
    timer = window.setTimeout(advance, 10_000);
  }

  function advance() {
    slides[current].hidden = true;
    current = (current + 1) % slides.length;
    slides[current].hidden = false;
    schedule();
  }

  next.hidden = false;
  next.addEventListener('click', advance);
  carousel.addEventListener('focusin', schedule);
  carousel.addEventListener('focusout', () => window.setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
})();
