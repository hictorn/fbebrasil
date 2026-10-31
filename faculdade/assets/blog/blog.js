/* Only the blog's native courses disclosure; existing course/form scripts stay untouched. */
(() => {
  const courses = document.querySelector('.blog-courses');
  if (!courses) return;
  document.addEventListener('click', event => {
    if (!courses.contains(event.target) || event.target.closest('a')) courses.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && courses.open) {
      courses.open = false;
      courses.querySelector('summary').focus();
    }
  });
})();
