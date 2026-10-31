// A legacy #topo identifies the hero, not the top of the document.
// Remove it before native fragment scrolling, preserving course interest parameters.
(() => {
  const url = new URL(location.href);
  if ((url.pathname === '/faculdade/' || url.pathname === '/faculdade/index.html') && url.hash === '#topo') {
    url.hash = '';
    history.replaceState(history.state, '', url);
  }
})();

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
    if (id === 'ingresso') {
      location.assign('/faculdade/ingresso/');
      return;
    }
    views.forEach(view => view.style.display = 'none');
    home.style.display = '';
    closeMenu();
    if (updateAddress) address(null, id);
    const section = document.getElementById(id) || document.getElementById('cursos');
    const target = id === 'cursos' ? section.querySelector('.home-section-heading') || section : section;
    const gap = id === 'cursos' ? 32 : 20;
    const offset = (document.querySelector('.site-header')?.getBoundingClientRect().height || 0) + gap;
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
    if (!home) return;
    if (location.hash === '#topo') {
      history.replaceState(history.state, '', location.pathname + location.search);
    }
    if (location.hash === '#ingresso') {
      location.replace('/faculdade/ingresso/');
      return;
    }
    const slug = new URLSearchParams(location.search).get('curso')?.toLowerCase().trim();
    if (slug && graduationNames[slug]) {
      const url = new URL(location.href);
      url.pathname = '/faculdade/graduacao/' + graduationPaths[slug] + '/';
      url.searchParams.delete('curso');
      url.hash = '';
      location.replace(url);
      return;
    }
    showSection(location.hash.slice(1) || 'topo', false);
  }

  const graduationNames = { direito:'Direito', enfermagem:'Enfermagem', odontologia:'Odontologia', psicologia:'Psicologia', administracao:'Administração', 'eng-civil':'Engenharia Civil', 'eng-producao':'Engenharia de Produção', 'eng-computacao':'Engenharia de Computação' };
  const graduationPaths = { direito:'direito', enfermagem:'enfermagem', odontologia:'odontologia', psicologia:'psicologia', administracao:'administracao', 'eng-civil':'engenharia-civil', 'eng-producao':'engenharia-de-producao', 'eng-computacao':'engenharia-de-computacao' };
  const form = document.getElementById('hero-form');
  if (form) {
    const formation = form.querySelector('[name="curso"]');
    const origin = form.querySelector('[name="curso_origem"]');
    const context = document.getElementById('hf-curso-origem-text');
    const courseName = graduationNames[new URLSearchParams(location.search).get('interesse')];
    if (courseName && origin && context) {
      formation.value = 'Graduação';
      origin.value = courseName;
      context.textContent = 'Curso escolhido: ' + courseName;
      context.hidden = false;
    }
    formation.addEventListener('change', () => {
      if (formation.value !== 'Graduação' && origin && context) {
        origin.value = '';
        context.hidden = true;
      }
    });
    form.addEventListener('reset', () => {
      if (context) context.hidden = true;
      if (origin) origin.value = '';
    });
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
    if (!home) return;
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
  if (home && !location.hash) {
    window.addEventListener('pageshow', () => {
      if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, { once: true });
  }
});

(function () {
  'use strict';
  function enhanceFormationSelect() {
    const select = document.getElementById('hf-formacao');
    if (!select || select.classList.contains('formation-select-native')) return;
    const label = document.querySelector('label[for="hf-formacao"]');
    const wrapper = document.createElement('div');
    wrapper.className = 'formation-select';
    select.before(wrapper);
    wrapper.append(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'hf-formacao-trigger';
    trigger.className = 'formation-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-controls', 'hf-formacao-options');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-required', String(select.required));
    const value = document.createElement('span');
    value.id = 'hf-formacao-value';
    value.className = 'formation-select-value';
    trigger.append(value);
    trigger.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>');
    if (label) {
      label.id ||= 'hf-formacao-label';
      label.htmlFor = trigger.id;
      trigger.setAttribute('aria-labelledby', label.id + ' ' + value.id);
    } else trigger.setAttribute('aria-label', 'Formação de interesse');

    const popup = document.createElement('div');
    popup.id = 'hf-formacao-options';
    popup.className = 'formation-select-popup';
    popup.setAttribute('role', 'listbox');
    popup.setAttribute('aria-label', 'Formação de interesse');
    popup.hidden = true;
    const error = document.createElement('p');
    error.id = 'hf-formacao-error';
    error.className = 'formation-select-error';
    error.textContent = 'Selecione a formação de interesse.';
    error.hidden = true;
    error.setAttribute('aria-live', 'polite');
    wrapper.append(trigger, popup, error);

    let activeIndex = 0;
    const choices = Array.from(select.options).filter(option => option.value && !option.disabled);
    const options = choices.map((choice, index) => {
      const option = document.createElement('div');
      option.id = 'hf-formacao-option-' + index;
      option.className = 'formation-select-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      const text = document.createElement('span');
      text.textContent = choice.textContent;
      option.append(text);
      option.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>');
      option.addEventListener('click', () => choose(index));
      popup.append(option);
      return option;
    });

    function clearError() {
      wrapper.classList.remove('is-invalid');
      error.hidden = true;
      trigger.removeAttribute('aria-invalid');
      trigger.removeAttribute('aria-describedby');
    }
    function sync() {
      value.textContent = select.selectedOptions[0]?.textContent || 'Selecione a formação';
      value.classList.toggle('is-placeholder', !select.value);
      options.forEach((option, index) => option.setAttribute('aria-selected', String(choices[index].value === select.value)));
      trigger.disabled = select.disabled;
      if (select.value) clearError();
    }
    function setActive(index) {
      activeIndex = (index + options.length) % options.length;
      options.forEach((option, index) => option.classList.toggle('is-active', index === activeIndex));
      trigger.setAttribute('aria-activedescendant', options[activeIndex].id);
    }
    function open(index) {
      if (trigger.disabled) return;
      popup.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const selected = choices.findIndex(choice => choice.value === select.value);
      setActive(index ?? Math.max(0, selected));
    }
    function close(restoreFocus = false) {
      popup.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      if (restoreFocus) trigger.focus({ preventScroll:true });
    }
    function choose(index) {
      select.value = choices[index].value;
      select.dispatchEvent(new Event('change', { bubbles:true }));
      close(true);
    }
    trigger.addEventListener('click', () => popup.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
      const key = event.key;
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
        event.preventDefault();
        if (popup.hidden) open(key === 'End' || key === 'ArrowUp' ? options.length - 1 : 0);
        else setActive(key === 'Home' ? 0 : key === 'End' ? options.length - 1 : activeIndex + (key === 'ArrowDown' ? 1 : -1));
      } else if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (popup.hidden) open();
        else choose(activeIndex);
      } else if (key === 'Escape') {
        event.preventDefault();
        close();
      } else if (key === 'Tab') close();
      else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const index = choices.findIndex(choice => choice.textContent.trim().toLocaleLowerCase('pt-BR').startsWith(key.toLocaleLowerCase('pt-BR')));
        if (index >= 0) { event.preventDefault(); open(index); }
      }
    });
    document.addEventListener('click', event => { if (!wrapper.contains(event.target)) close(); });
    wrapper.addEventListener('focusout', event => { if (event.relatedTarget && !wrapper.contains(event.relatedTarget)) close(); });
    select.addEventListener('change', sync);
    select.addEventListener('invalid', event => {
      event.preventDefault();
      wrapper.classList.add('is-invalid');
      error.hidden = false;
      trigger.setAttribute('aria-invalid', 'true');
      trigger.setAttribute('aria-describedby', error.id);
      trigger.focus();
      open();
    });
    select.form?.addEventListener('reset', () => {
      close();
      clearError();
      requestAnimationFrame(sync);
    });
    // Progressive enhancement: without JavaScript, the original field stays usable.
    select.classList.add('formation-select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceFormationSelect, { once:true });
  else enhanceFormationSelect();
})();
