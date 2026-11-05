// GitHub Pages compatibility for previously shared ?pagina= and ?post= URLs.
// Keep campaign parameters and anchors while replacing only the old route selector.
(function () {
  'use strict';
  const pages = {"home": "/colegio/", "dependencia": "/colegio/dependencia/", "fundamental": "/colegio/ensino-fundamental-ii/", "medio": "/colegio/ensino-medio/", "sae": "/colegio/sae-digital/", "proposta": "/colegio/proposta-pedagogica/", "estrutura": "/colegio/estrutura/", "laboratorios": "/colegio/laboratorios/", "localizacao": "/colegio/localizacao/", "esportes": "/colegio/atividades-esportivas/", "enem": "/colegio/preparacao-enem/", "admissao": "/colegio/admissao/", "galeria": "/colegio/galeria/"};
  const posts = {"sarau-2026-samba": "/colegio/mural/sarau-2026-samba/", "aldeia-casa-da-fonte": "/colegio/mural/aldeia-casa-da-fonte/", "sao-joao-2026": "/colegio/mural/sao-joao-2026/", "doacoes": "/colegio/mural/doacoes/", "jifube2026": "/colegio/mural/jifube2026/", "pl-pagador-promessas": "/colegio/mural/pl-pagador-promessas/", "volta-aulas": "/colegio/mural/volta-aulas/", "carnaval": "/colegio/mural/carnaval/", "pascoa": "/colegio/mural/pascoa/"};
  const target = new URL(window.location.href);
  const canonical = document.querySelector('link[rel="canonical"]');
  let route = null;
  const page = target.searchParams.get('pagina');
  const post = target.searchParams.get('post');
  if (Object.prototype.hasOwnProperty.call(pages, page)) {
    route = pages[page];
    target.searchParams.delete('pagina');
  } else if (target.pathname.startsWith('/colegio/mural/') && Object.prototype.hasOwnProperty.call(posts, post)) {
    route = posts[post];
    target.searchParams.delete('post');
  } else if (canonical && target.pathname.endsWith('/index.html')) {
    route = new URL(canonical.href).pathname;
  }
  if (!route) return;
  target.pathname = route;
  if (canonical) canonical.href = 'https://www.fbebrasil.com.br' + route;
  const socialUrl = document.querySelector('meta[property="og:url"]');
  if (socialUrl) socialUrl.setAttribute('content', 'https://www.fbebrasil.com.br' + route);
  if (target.href !== window.location.href) window.location.replace(target.href);
})();
