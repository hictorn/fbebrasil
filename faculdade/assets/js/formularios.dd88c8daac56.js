(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.FBEInquiry = api;
    const start = () => api.init(root.document);
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', start, { once: true });
    } else start();
  }
})(typeof window === 'object' ? window : null, function () {
  'use strict';
  const config = Object.freeze({
    endpoint: 'https://api.emailjs.com/api/v1.0/email/send',
    serviceId: 'service_n40ybhn',
    publicKey: 'qRBryErY3jpIZQthO',
    templates: Object.freeze({ home: 'template_8yyue07', pos: 'template_vao4zjs' })
  });
  const boundForms = new WeakSet();

  function buildPayload(flow, values) {
    const templateId = config.templates[flow];
    if (!templateId) throw new Error('Formulário não configurado.');
    const params = {};
    for (const field of ['nome', 'email', 'telefone', 'curso']) {
      params[field] = String(values[field] || '').trim();
      if (!params[field]) throw new Error('Preencha os campos obrigatórios.');
    }
    if (!values.autorizacao) throw new Error('Autorize o contato para enviar o cadastro.');
    params.autorizacao = 'Sim, autorizo';
    if (flow === 'home') {
      if (!['Graduação', 'Pós-graduação'].includes(params.curso)) {
        throw new Error('Selecione a formação de interesse.');
      }
      params.mensagem = String(values.mensagem || '').trim() || 'Não informada';
    }
    return {
      service_id: config.serviceId,
      template_id: templateId,
      user_id: config.publicKey,
      template_params: params
    };
  }

  async function sendInquiry(flow, values, transport) {
    const payload = buildPayload(flow, values);
    const send = transport || globalThis.fetch.bind(globalThis);
    const response = await send(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = new Error('Falha no envio do cadastro.');
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function clearStatus(form) {
    const status = form.querySelector('[data-fbe-status]');
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
    status.removeAttribute('data-state');
  }

  function trackSuccess(flow, payload, view) {
    try {
      if (typeof view.gtag === 'function') {
        view.gtag('event', flow === 'home' ? 'envio_formulario_inscricao' : 'envio_formulario_pos', {
          formulario: flow === 'home' ? 'banner_vestibular' : 'pos_graduacao',
          formacao: flow === 'home' ? payload.template_params.curso : 'Pós-graduação'
        });
      }
      if (typeof view.fbq === 'function') {
        view.fbq('track', 'Lead', {
          content_name: payload.template_params.curso,
          content_category: flow === 'home' ? 'inscricao_vestibular' : 'pos_graduacao'
        });
      }
    } catch (_) {
      // Analytics must not change the result of an email already accepted.
    }
  }

  function bindForm(form) {
    if (boundForms.has(form)) return;
    const flow = form.dataset.fbeForm;
    if (!config.templates[flow]) return;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-fbe-status]');
    if (!button || !status) return;
    boundForms.add(form);
    const buttonContent = button.innerHTML;
    const view = form.ownerDocument.defaultView;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.dataset.fbeSending === 'true' || !form.reportValidity()) return;
      clearStatus(form);
      let values;
      try {
        values = Object.fromEntries(new view.FormData(form).entries());
        buildPayload(flow, values);
      } catch (error) {
        status.textContent = error.message;
        status.dataset.state = 'error';
        status.hidden = false;
        return;
      }

      form.dataset.fbeSending = 'true';
      form.setAttribute('aria-busy', 'true');
      button.disabled = true;
      button.textContent = 'Enviando...';
      try {
        const payload = await sendInquiry(flow, values, view.fetch.bind(view));
        form.reset();
        if (flow === 'pos') form.querySelector('[name="curso"]').value = payload.template_params.curso;
        form.querySelectorAll('select').forEach(select => {
          select.dispatchEvent(new view.Event('change', { bubbles: true }));
        });
        status.textContent = 'Cadastro enviado! A equipe da Faculdade FBE entrará em contato com você.';
        status.dataset.state = 'success';
        status.hidden = false;
        trackSuccess(flow, payload, view);
      } catch (error) {
        status.textContent = error.status === 429
          ? 'Aguarde alguns instantes e tente enviar novamente. Seus dados continuam preenchidos.'
          : 'Não foi possível enviar o cadastro. Tente novamente ou fale com a FBE pelo WhatsApp. Seus dados continuam preenchidos.';
        status.dataset.state = 'error';
        status.hidden = false;
      } finally {
        delete form.dataset.fbeSending;
        form.removeAttribute('aria-busy');
        button.disabled = false;
        button.innerHTML = buttonContent;
        status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function init(document) {
    document.querySelectorAll('form[data-fbe-form]').forEach(bindForm);
  }

  return Object.freeze({ config, buildPayload, sendInquiry, bindForm, clearStatus, init });
});
