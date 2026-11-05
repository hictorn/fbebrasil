(function(window, document) {
  'use strict';
  if (window.fbeAdmissionsTracking) return;

  const PIXEL_ID = '514422286798390';
  const GA4_ID = 'G-T5VY6DEC5Q';
  function safely(action) {
    try { action(); } catch (_) { /* Medição nunca interrompe a pré-inscrição. */ }
  }

  // Apenas rótulos fixos: nenhum valor de campo do formulário é repassado aqui.
  window.fbeAdmissionsTracking = {
    preRegistrationSucceeded() {
      const eventId = window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : 'fbe-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      safely(() => {
        if (typeof window.fbq === 'function') {
          window.fbq('trackSingle', PIXEL_ID, 'Lead', {
            content_name: 'Pre-inscricao 2027',
            content_category: 'Colegio FBE'
          }, {eventID: eventId});
        }
      });
      safely(() => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', {
            send_to: GA4_ID,
            form_id: 'admissaoForm',
            lead_source: 'colegio_admissao',
            event_id: eventId
          });
        }
      });
    }
  };

  safely(() => {
    if (!window.fbq) {
      const fbq = window.fbq = function() {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
        else fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      const first = document.getElementsByTagName('script')[0];
      if (first && first.parentNode) first.parentNode.insertBefore(script, first);
      else document.head.appendChild(script);
    }
    window.fbq('init', PIXEL_ID);
    window.fbq('trackSingle', PIXEL_ID, 'PageView');
  });
})(window, document);
