(() => {
  const dialog = document.getElementById('faculty-profile-dialog');
  if (typeof dialog.showModal !== 'function') return;

  let profile;
  let trigger;
  document.querySelectorAll('.faculty-card-trigger').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) return;
      if (trigger) {
        event.preventDefault();
        return;
      }
      const fallback = document.getElementById(link.hash.slice(1));
      const panel = fallback.querySelector('.faculty-profile-panel');
      dialog.setAttribute('aria-labelledby', fallback.getAttribute('aria-labelledby'));
      dialog.append(panel);
      try {
        dialog.showModal();
      } catch {
        fallback.append(panel);
        return;
      }

      event.preventDefault();
      profile = fallback;
      trigger = link;
      panel.querySelector('.dialog-close').focus({preventScroll: true});
    });
  });

  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.closest('.dialog-close')) {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    profile.append(dialog.firstElementChild);
    trigger.focus({preventScroll: true});
    profile = undefined;
    trigger = undefined;
  });
})();
(() => {
  const facultyTrack = document.getElementById('faculty-portrait-track');
  const facultyPrevious = document.querySelector('[data-faculty-step="-1"]');
  const facultyNext = document.querySelector('[data-faculty-step="1"]');
  const syncFacultyArrows = () => {
    facultyPrevious.disabled = facultyTrack.scrollLeft <= 1;
    facultyNext.disabled = facultyTrack.scrollLeft + facultyTrack.clientWidth >= facultyTrack.scrollWidth - 1;
  };
  [facultyPrevious, facultyNext].forEach(arrow => {
    arrow.addEventListener('click', () => {
      const cardWidth = facultyTrack.firstElementChild.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(facultyTrack).columnGap) || 0;
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      facultyTrack.scrollBy({
        left: Number(arrow.dataset.facultyStep) * (cardWidth + gap),
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
  });
  facultyTrack.addEventListener('scroll', syncFacultyArrows, {passive:true});
  new ResizeObserver(syncFacultyArrows).observe(facultyTrack);
  syncFacultyArrows();
})();
