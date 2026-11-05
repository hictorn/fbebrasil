document.addEventListener('DOMContentLoaded',()=>{
  const t=document.getElementById('navToggle'),n=document.getElementById('mainNav');

  // Mantém o menu mobile começando exatamente onde o header (topbar+logo) termina,
  // em vez de um valor fixo em px que não bate em todo breakpoint/dispositivo.
  const headerEl=document.querySelector('.site-header');
  function syncHeaderH(){
    if(headerEl)document.documentElement.style.setProperty('--header-h',headerEl.getBoundingClientRect().bottom+'px');
  }
  syncHeaderH();
  window.addEventListener('resize',syncHeaderH);
  window.addEventListener('orientationchange',syncHeaderH);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(syncHeaderH);

  let navScrollY = 0;
  function lockScroll(){
    navScrollY = window.scrollY;
    document.documentElement.classList.add('nav-locked');
    document.body.classList.add('nav-locked');
  }
  function unlockScroll(){
    if(!document.body.classList.contains('nav-locked'))return;
    document.documentElement.classList.remove('nav-locked');
    document.body.classList.remove('nav-locked');
    window.scrollTo({top:navScrollY,left:0,behavior:'instant'});
  }
  // Reforço pra touch (iOS): bloqueia o arraste da página por trás do menu/lightbox,
  // deixando passar apenas o scroll dentro do próprio menu (#mainNav) ou o swipe no lightbox.
  document.addEventListener('touchmove',(e)=>{
    if(document.body.classList.contains('nav-locked')&&!e.target.closest('#mainNav')&&!e.target.closest('#lightbox')){
      e.preventDefault();
    }
  },{passive:false});

  if(t){t.addEventListener('click',()=>{
    syncHeaderH();
    n.classList.toggle('open');
    const isOpen=n.classList.contains('open');
    t.textContent=isOpen?'\u2715':'\u2630';
    if(isOpen)lockScroll();else unlockScroll();
  })}

  function closeNav(){if(n)n.classList.remove('open');if(t)t.textContent='\u2630';unlockScroll();document.querySelectorAll('.nav-drop[open]').forEach(d=>d.removeAttribute('open'))}

  // Each page now has its own HTML; links use normal browser navigation.
  try {
    if(typeof gtag==='function')gtag('event','view_pagina',{pagina:document.body.dataset.page,origem:'url'});
  } catch (_) { /* O formulário continua disponível se a medição falhar. */ }

  // botão "Conheça o ensino" - rola até a seção de segmentos, calculando a posição na hora do clique
  document.querySelectorAll('.js-scroll-ensino').forEach(el=>{
    el.addEventListener('click',e=>{
      e.preventDefault();
      const alvo=document.getElementById('ensino');
      if(!alvo)return;
      const y=alvo.getBoundingClientRect().top+window.pageYOffset-110;
      window.scrollTo({top:y,behavior:'smooth'});
    });
  });

  document.addEventListener('click',e=>{
    document.querySelectorAll('.nav-drop[open]').forEach(d=>{
      if(!d.contains(e.target))d.removeAttribute('open');
    });
    if(n.classList.contains('open')&&!e.target.closest('#mainNav')&&!e.target.closest('#navToggle')){
      closeNav();
    }
  });

  document.querySelectorAll('.faq-question').forEach(b=>{b.addEventListener('click',()=>{const a=b.nextElementSibling,o=b.classList.contains('open');document.querySelectorAll('.faq-question').forEach(x=>{x.classList.remove('open');x.nextElementSibling.classList.remove('open')});if(!o){b.classList.add('open');a.classList.add('open')}})});

  const f=document.getElementById('contatoForm');
  if(f){f.addEventListener('submit',e=>{
    e.preventDefault();
    const b=f.querySelector('button[type="submit"]');
    b.disabled=true;b.textContent='Enviando...';
    emailjs.sendForm('service_n40ybhn','template_w4e1kod',f).then(()=>{
      f.querySelector('.form-success').style.display='block';
      f.reset();b.disabled=false;b.textContent='Enviar';
      setTimeout(()=>{f.querySelector('.form-success').style.display='none'},5000);
    }).catch(()=>{
      alert('Não foi possível enviar sua mensagem. Tente novamente ou fale conosco pelo WhatsApp.');
      b.disabled=false;b.textContent='Enviar';
    });
  })}

  // ═══ GALERIA DE FOTOS ═══
  const GAL_CATS={
    salas:{label:'Salas de aula',c1:'#2b3a72',c2:'#455a9e'},
    lab:{label:'Laboratórios',c1:'#0e7c86',c2:'#14a3af'},
    biblioteca:{label:'Biblioteca',c1:'#8B222A',c2:'#c2303c'},
    quadra:{label:'Quadra poliesportiva',c1:'#1a7a3d',c2:'#2fa85a'},
    refeitorio:{label:'Cantina',c1:'#b8860b',c2:'#e0a72b'},
    auditorio:{label:'Auditório',c1:'#5a3e28',c2:'#8a6641'},
    lazer:{label:'Área de lazer',c1:'#1a7a3d',c2:'#2fa85a'},
    elevador:{label:'Elevador',c1:'#3d5a80',c2:'#5d7fa8'},
    recepcao:{label:'Recepção',c1:'#8B222A',c2:'#c2303c'},
    geral:{label:'Colégio FBE',c1:'#1E264A',c2:'#2a3364'}
  };
  function galPlaceholder(cat,n,w,h){
    const c=GAL_CATS[cat];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g${cat}${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g${cat}${n})"/><circle cx="${w*0.82}" cy="${h*0.18}" r="${Math.min(w,h)*0.12}" fill="rgba(255,255,255,.08)"/><circle cx="${w*0.15}" cy="${h*0.85}" r="${Math.min(w,h)*0.18}" fill="rgba(255,255,255,.06)"/></svg>`;
    return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
  }
  const GAL_PHOTOS=[
    {cat:'geral',title:'Entrada',url:'/colegio/galeria-fachada-1.jpg'},
    {cat:'recepcao',title:'Recepção',url:'/colegio/galeria-recepcao-1.jpg'},
    {cat:'recepcao',title:'Recepção',url:'/colegio/galeria-recepcao-2.jpg'},
    {cat:'recepcao',title:'Recepção',url:'/colegio/galeria-recepcao-3.jpg'},
    {cat:'geral',title:'Catracas de acesso',url:'/colegio/galeria-catracas-1.jpg'},
    {cat:'geral',title:'Pátio interno',url:'/colegio/galeria-patio-1.jpg'},
    {cat:'geral',title:'Pátio interno',url:'/colegio/galeria-patio-2.jpg'},
    {cat:'geral',title:'Pátio interno',url:'/colegio/galeria-patio-3.jpg'},
    {cat:'geral',title:'Pátio interno',url:'/colegio/galeria-patio-4.jpg'},
    {cat:'geral',title:'Pátio interno',url:'/colegio/galeria-patio-5.jpg'},
    {cat:'elevador',title:'Elevador',url:'/colegio/galeria-elevador-1.jpg'},
    {cat:'salas',title:'Sala de aula equipada',url:'/colegio/galeria-sala-1.jpg'},
    {cat:'salas',title:'Sala climatizada',url:'/colegio/galeria-sala-3.jpg'},
    {cat:'biblioteca',title:'Biblioteca',url:'/colegio/galeria-biblioteca-1.jpg'},
    {cat:'biblioteca',title:'Espaço de leitura',url:'/colegio/galeria-biblioteca-2.jpg'},
    {cat:'lab',title:'Laboratório de robótica',url:'/colegio/galeria-lab-robotica-1.jpg'},
    {cat:'lab',title:'Laboratório de robótica',url:'/colegio/galeria-lab-robotica-2.jpg'},
    {cat:'lab',title:'Laboratório de robótica',url:'/colegio/galeria-lab-robotica-3.jpg'},
    {cat:'lab',title:'Espaço Maker',url:'/colegio/galeria-lab-maker-1.jpg'},
    {cat:'lab',title:'Espaço Maker',url:'/colegio/galeria-lab-maker-2.jpg'},
    {cat:'lab',title:'Laboratório de informática',url:'/colegio/galeria-lab-informatica-1.jpg'},
    {cat:'lab',title:'Laboratório de informática',url:'/colegio/galeria-lab-informatica-2.jpg'},
    {cat:'auditorio',title:'Auditório',url:'/colegio/galeria-auditorio-1.jpg'},
    {cat:'auditorio',title:'Auditório',url:'/colegio/galeria-auditorio-2.jpg'},
    {cat:'lazer',title:'Área de lazer',url:'/colegio/galeria-lazer-1.jpg'},
    {cat:'lazer',title:'Área de lazer',url:'/colegio/galeria-lazer-2.jpg'},
    {cat:'lazer',title:'Área de lazer',url:'/colegio/galeria-lazer-3.jpg'},
    {cat:'quadra',title:'Quadra poliesportiva',url:'/colegio/galeria-quadra-1.jpg'},
    {cat:'refeitorio',title:'Cantina',url:'/colegio/galeria-refeitorio-1.jpg'}
  ];
  const GAL_SRC=GAL_PHOTOS.map(p=>p.url?p:{...p,url:galPlaceholder(p.cat,p.n,p.w,p.h)});

  function galCardHTML(p){
    const idx=GAL_SRC.indexOf(p);
    return `<div class="gal-photo" style="background-image:url('${p.url}')" onclick="openGalLightbox(${idx})" title="${p.title}"></div>`;
  }

  const galPreviewEl=document.getElementById('galPreview');
  if(galPreviewEl){
    galPreviewEl.innerHTML=GAL_SRC.slice(0,6).map(p=>galCardHTML(p)).join('');
    const prevBtn=document.getElementById('galPrevBtn'),nextBtn=document.getElementById('galNextBtn');
    function galScrollStep(){
      const card=galPreviewEl.querySelector('.gal-photo');
      if(!card)return 300;
      const gap=parseFloat(getComputedStyle(galPreviewEl).gap)||16;
      return card.getBoundingClientRect().width+gap;
    }
    if(prevBtn)prevBtn.addEventListener('click',()=>galPreviewEl.scrollBy({left:-galScrollStep(),behavior:'smooth'}));
    if(nextBtn)nextBtn.addEventListener('click',()=>galPreviewEl.scrollBy({left:galScrollStep(),behavior:'smooth'}));
  }

  function renderGalFull(){
    const el=document.getElementById('galFull');
    if(!el)return;
    el.innerHTML=GAL_SRC.map(p=>galCardHTML(p)).join('');
  }
  renderGalFull();

  // Lightbox
  let galIdx=0;
  let galActiveList=null; // quando null, usa GAL_SRC (galeria principal); senão, uma lista própria (ex: fotos de um post do Mural)
  window.openGalLightbox=function(idx,list){
    galIdx=idx;
    galActiveList=list||null;
    updateGalLightbox();
    document.getElementById('lightbox').classList.add('open');
    lockScroll();
  };
  function closeGalLightbox(){
    document.getElementById('lightbox').classList.remove('open');
    unlockScroll();
  }
  function updateGalLightbox(){
    const list=galActiveList||GAL_SRC;
    const p=list[galIdx];
    document.getElementById('lbImg').innerHTML=`<img src="${p.url}" alt="${p.title||''}">`;
    const captionEl=document.querySelector('.lightbox-caption');
    if(p.title){
      captionEl.style.display='';
      document.getElementById('lbTitle').textContent=p.title;
      document.getElementById('lbCat').textContent=`${galIdx+1} de ${list.length}`;
    }else{
      captionEl.style.display='none';
    }
  }
  const lbClose=document.getElementById('lbClose');
  const lbPrev=document.getElementById('lbPrev');
  const lbNext=document.getElementById('lbNext');
  const lightboxEl=document.getElementById('lightbox');
  if(lbClose){
    lbClose.addEventListener('click',closeGalLightbox);
    lbPrev.addEventListener('click',()=>{const list=galActiveList||GAL_SRC;galIdx=(galIdx-1+list.length)%list.length;updateGalLightbox()});
    lbNext.addEventListener('click',()=>{const list=galActiveList||GAL_SRC;galIdx=(galIdx+1)%list.length;updateGalLightbox()});
    // Clicar em qualquer área fora da foto/controles (o fundo escurecido) fecha o lightbox.
    lightboxEl.addEventListener('click',e=>{
      if(e.target.id==='lightbox'||e.target.id==='lbImg')closeGalLightbox();
    });
    document.addEventListener('keydown',e=>{
      if(!lightboxEl.classList.contains('open'))return;
      if(e.key==='Escape')closeGalLightbox();
      if(e.key==='ArrowLeft')lbPrev.click();
      if(e.key==='ArrowRight')lbNext.click();
    });
    // Swipe horizontal no touch: arrastar pra esquerda avança, pra direita volta.
    let touchStartX=0,touchStartY=0,touchMoved=false;
    lightboxEl.addEventListener('touchstart',e=>{
      touchStartX=e.touches[0].clientX;
      touchStartY=e.touches[0].clientY;
      touchMoved=false;
    },{passive:true});
    lightboxEl.addEventListener('touchmove',()=>{touchMoved=true},{passive:true});
    lightboxEl.addEventListener('touchend',e=>{
      if(!touchMoved)return;
      const dx=e.changedTouches[0].clientX-touchStartX;
      const dy=e.changedTouches[0].clientY-touchStartY;
      // só conta como swipe se o movimento horizontal for claramente maior que o vertical
      if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){
        if(dx<0)lbNext.click();else lbPrev.click();
      }
    },{passive:true});
  }

  // ═══ MURAL: galeria de fotos dentro de um post ═══
  // Título é usado só como tooltip (atributo title do HTML); no lightbox, sem legenda.
  document.querySelectorAll('[data-post-gallery]').forEach(wrap=>{
    const photos=Array.from(wrap.querySelectorAll('.gal-photo')).map(el=>({
      url:el.style.backgroundImage.slice(5,-2), // extrai a URL de background-image:url('...')
      title:''
    }));
    wrap.querySelectorAll('.gal-photo').forEach((el,i)=>{
      el.style.cursor='pointer';
      el.addEventListener('click',()=>window.openGalLightbox(i,photos));
    });
  });

  // ═══ LABORATÓRIOS MODERNOS ═══
  const LAB_DATA={
    informatica:{
      title:'Laboratório de Informática',
      photo:'/colegio/lab-informatica-view.jpg',
      text:'Computadores atualizados e internet de alta velocidade para aulas de tecnologia, pesquisa orientada e acesso à plataforma SAE Digital dentro do próprio Colégio.',
      items:['Computadores individuais atualizados','Internet de alta velocidade','Softwares educacionais e de produtividade','Acesso à plataforma SAE Digital e ao AVA','Suporte técnico durante as aulas']
    },
    robotica:{
      title:'Laboratório de Robótica',
      photo:'/colegio/lab-robotica-view.jpg',
      text:'Kits de montagem e programação para o aluno aprender lógica computacional na prática, construindo e programando seus próprios projetos, com foco em mostras e competições.',
      items:['Kits de montagem e programação','Projetos com Arduino e sensores','Turmas por faixa etária e nível','Preparação para mostras e competições','Desenvolvimento de raciocínio lógico e trabalho em equipe']
    }
  };
  function renderLabPanel(key){
    const panel=document.getElementById('labPanel');
    if(!panel)return;
    const d=LAB_DATA[key];
    panel.innerHTML=`
      <div class="lab-panel-photo"><img src="${d.photo}" alt="${d.title}" loading="lazy"></div>
      <div class="lab-panel-body">
        <h2>${d.title}</h2>
        <p>${d.text}</p>
        <ul class="lab-panel-list">${d.items.map(i=>`<li>${i}</li>`).join('')}</ul>
      </div>`;
  }
  const labTabsEl=document.getElementById('labTabs');
  if(labTabsEl){
    renderLabPanel('informatica');
    labTabsEl.addEventListener('click',e=>{
      const btn=e.target.closest('.lab-tab');
      if(!btn)return;
      labTabsEl.querySelectorAll('.lab-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderLabPanel(btn.dataset.lab);
    });
  }

  // ═══ VÍDEO INSTITUCIONAL: capa própria clicável, <video> local só carrega após o clique ═══
  const videoInstCoverEl=document.getElementById('videoInstCover');
  if(videoInstCoverEl){
    videoInstCoverEl.addEventListener('click',()=>{
      const wrap=document.getElementById('videoInstWrap');
      if(!wrap)return;
      const video=document.createElement('video');
      video.src='/colegio/videoinstitucionalfbe.mp4';
      video.controls=true;
      video.autoplay=true;
      video.playsInline=true;
      wrap.innerHTML='';
      wrap.appendChild(video);
      if(typeof gtag==='function'){gtag('event','play_video_institucional')}
    });
  }

  // ═══ PREPARAÇÃO ENEM: acordeão das 5 frentes ═══
  const enemAccEl=document.getElementById('enemAcc');
  if(enemAccEl){
    enemAccEl.addEventListener('click',e=>{
      const btn=e.target.closest('.enem-row-head');
      if(!btn)return;
      const row=btn.closest('.enem-row');
      const wasOpen=row.classList.contains('open');
      enemAccEl.querySelectorAll('.enem-row').forEach(r=>r.classList.remove('open'));
      if(!wasOpen)row.classList.add('open');
    });
  }

  // ═══ ADMISSÃO 2027 ═══
  // FAQ acordeão
  const admFaqEl=document.getElementById('admFaq');
  if(admFaqEl){
    admFaqEl.addEventListener('click',e=>{
      const btn=e.target.closest('.adm-faq-q');
      if(!btn)return;
      const item=btn.closest('.adm-faq-item');
      const wasOpen=item.classList.contains('open');
      admFaqEl.querySelectorAll('.adm-faq-item').forEach(i=>i.classList.remove('open'));
      if(!wasOpen)item.classList.add('open');
    });
  }
  // botões que rolam suavemente até uma seção da mesma página (ex.: formulário)
  document.querySelectorAll('[data-adm-scroll]').forEach(el=>{
    el.addEventListener('click',e=>{
      e.preventDefault();
      const alvo=document.getElementById(el.getAttribute('data-adm-scroll'));
      if(alvo)alvo.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
  // Pré-inscrição: mantém o envio original e mede somente a confirmação de sucesso.
  const admF=document.getElementById('admissaoForm');
  if(admF){admF.addEventListener('submit',e=>{
    e.preventDefault();
    const b=admF.querySelector('button[type="submit"]');
    if(b.disabled)return;
    b.disabled=true;b.textContent='Enviando...';
    emailjs.sendForm('service_n40ybhn','template_ax5qtqc',admF).then(()=>{
      admF.querySelector('.form-success').style.display='block';
      try {
        if(window.fbeAdmissionsTracking)window.fbeAdmissionsTracking.preRegistrationSucceeded();
      } catch (_) { /* Falha na medição não altera o resultado do envio. */ }
      admF.reset();b.disabled=false;b.textContent='Enviar pré-inscrição';
      setTimeout(()=>{admF.querySelector('.form-success').style.display='none'},6000);
    }).catch(()=>{
      alert('Não foi possível enviar sua pré-inscrição. Tente novamente ou fale conosco pelo WhatsApp.');
      b.disabled=false;b.textContent='Enviar pré-inscrição';
    });
  })}

  // ═══ LOCALIZAÇÃO: horário de atendimento (aberto/fechado) ═══
  const locHoursStatus=document.getElementById('locHoursStatus');
  if(locHoursStatus){
    const now=new Date();
    const day=now.getDay(); // 0=domingo, 6=sábado
    const minutesNow=now.getHours()*60+now.getMinutes();
    let isOpen=false;
    if(day>=1&&day<=5){ isOpen = minutesNow>=7*60 && minutesNow<22*60; }
    else if(day===6){ isOpen = minutesNow>=7*60 && minutesNow<12*60; }
    const statusText=document.getElementById('locHoursStatusText');
    if(isOpen){
      locHoursStatus.classList.add('open');
      statusText.textContent='Aberto agora';
    }else{
      locHoursStatus.classList.add('closed');
      statusText.textContent='Fechado agora';
    }
  }
});

// A página interna do Mural define a ordem das quatro notícias da home.
(async function syncLatestMural(){
  const grid=document.getElementById('muralLatest');
  if(!grid)return;
  try{
    const base=new URL('/colegio/mural/',location.origin);
    const response=await fetch(base,{cache:'no-cache'});
    if(!response.ok)return;
    const source=await response.text();
    const doc=new DOMParser().parseFromString(source,'text/html');
    const latest=Array.from(doc.querySelectorAll('#view-mural .dest-grid > .dest-card')).slice(0,4);
    if(latest.length!==4)return;
    const fragment=document.createDocumentFragment();
    for(const original of latest){
      const image=original.querySelector('.dest-img');
      const title=original.querySelector('h4');
      const category=original.querySelector('.dest-body > span');
      const linkTarget=original.querySelector('a[href]');
      const match=image&&image.style.backgroundImage.match(/url\(["']?(.*?)["']?\)$/);
      if(!linkTarget||!title||!category||!match)return;
      const target=new URL(linkTarget.getAttribute('href'),base).href;
      const card=document.createElement('div');card.className='dest-card';
      const cover=document.createElement('a');cover.className='dest-img';cover.href=target;
      cover.setAttribute('aria-label',title.textContent.trim());cover.style.display='block';
      cover.style.backgroundImage='url("'+new URL(match[1],base).href+'")';
      const body=document.createElement('div');body.className='dest-body';
      const label=category.cloneNode(false);label.textContent=category.textContent;
      const heading=document.createElement('h4');heading.style.marginTop='4px';heading.textContent=title.textContent;
      const link=document.createElement('a');link.href=target;link.textContent='Ler mais →';
      body.append(label,heading,link);card.append(cover,body);fragment.append(card);
    }
    grid.replaceChildren(fragment);
  }catch(error){ /* Mantém os quatro cards publicados caso a consulta falhe. */ }
})();
