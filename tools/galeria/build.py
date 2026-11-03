#!/usr/bin/env python3
"""Renderiza a galeria estática do FBE Técnico para o GitHub Pages existente."""
from html import escape
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
BASE = 'https://www.fbebrasil.com.br'
GALLERY = '/tecnico/galeria/'


def image(album, filename, **attrs):
    photo = next(p for p in album['photos'] if p['file'] == filename)
    attributes = {'src': GALLERY + album['slug'] + '/fotos/' + filename,
                  'alt': photo['alt'], 'width': photo['width'], 'height': photo['height'],
                  'loading': 'lazy', 'decoding': 'async', **attrs}
    return '<img ' + ' '.join(f'{k}="{escape(str(v), quote=True)}"' for k, v in attributes.items()) + '>'


def card(album, cover):
    title = escape(album['title'])
    return f'''<a class="tg-card" href="{GALLERY}{album['slug']}/">
        <span class="tg-card-image">{image(album, album[cover])}</span>
        <div class="tg-card-body">
          <span class="tg-card-category">{escape(album['category'])}</span>
          <h3>{title}</h3>
          <span class="tg-card-count">{len(album['photos'])} fotos</span>
          <span class="tg-card-link">Ver galeria →</span>
        </div>
      </a>'''


def page(title, description, route, body, share_image, breadcrumbs, album=None):
    header = (SOURCE / 'templates/header.html').read_text()
    header = header.replace('<a href="/tecnico/galeria/">Galeria</a>', '<a href="/tecnico/galeria/" aria-current="' + ('page' if album is None else 'location') + '">Galeria</a>')
    footer = (SOURCE / 'templates/footer.html').read_text()
    structured = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'ImageGallery' if album else 'CollectionPage', 'name': title,
         'description': description, 'url': BASE + route,
         **({'image': [BASE + GALLERY + album['slug'] + '/fotos/' + p['file'] for p in album['photos']]} if album else {})},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': label, 'item': BASE + path}
            for i, (label, path) in enumerate(breadcrumbs)]}
    ]}
    lightbox = '''<div class="tg-lightbox" id="tg-lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Fotos da formatura dos cursos técnicos">
  <button class="tg-lightbox-close" type="button" aria-label="Fechar foto">×</button>
  <button class="tg-lightbox-prev" type="button" aria-label="Foto anterior">‹</button>
  <figure class="tg-lightbox-frame">
    <img class="tg-lightbox-image" alt="">
    <figcaption class="tg-lightbox-count" aria-live="polite" aria-atomic="true"></figcaption>
  </figure>
  <button class="tg-lightbox-next" type="button" aria-label="Próxima foto">›</button>
</div>'''.replace('Fotos da formatura dos cursos técnicos', escape('Fotos - ' + album['title'], quote=True)) if album else ''
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{escape(title)} | FBE Técnico</title>
<meta name="description" content="{escape(description, quote=True)}">
<link rel="canonical" href="{BASE}{route}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{escape(title, quote=True)} | FBE Técnico">
<meta property="og:description" content="{escape(description, quote=True)}">
<meta property="og:url" content="{BASE}{route}">
<meta property="og:image" content="{BASE}{share_image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tecnico/assets/galeria-base.css">
<link rel="stylesheet" href="/tecnico/assets/galeria.css">
<link rel="stylesheet" href="/assets/fbe-mobile-navigation.7b1951be0bff.css">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-T5VY6DEC5Q"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('js',new Date());gtag('config','G-T5VY6DEC5Q');</script>
<script type="application/ld+json">{json.dumps(structured, ensure_ascii=False).replace('</', '<' + chr(92) + '/')}</script>
</head>
<body>
{header}
<main id="conteudo">
{body}
</main>
{footer}
{lightbox}
<script src="/assets/fbe-mobile-navigation.01419eed2a54.js"></script>
{('<script src="/tecnico/assets/galeria.js"></script>' if album else '')}
</body>
</html>
'''


def build():
    albums = json.loads((SOURCE / 'albums.json').read_text())
    assert albums, 'Cadastre pelo menos um álbum.'
    slugs = [a['slug'] for a in albums]
    assert len(slugs) == len(set(slugs)), 'Slugs duplicados.'
    for album in albums:
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', album['slug'])
        files = [p['file'] for p in album['photos']]
        assert len(files) == len(set(files)) and len(files) > 0
        for role in ['home_cover', 'listing_cover', 'hero']:
            assert album[role] in files, role
        for photo in album['photos']:
            assert re.fullmatch(r'[a-z0-9-]+\.(?:jpeg|jpg|png|webp)', photo['file'])
            assert (ROOT / GALLERY.lstrip('/') / album['slug'] / 'fotos' / photo['file']).is_file()

    home_path = ROOT / 'tecnico/index.html'
    home = home_path.read_bytes().decode()
    eol = '\r\n' if '\r\n' in home else '\n'
    preview = f'''<!-- FBE_TECNICO_GALERIA_START -->
<section id="galeria" class="tg-section" aria-labelledby="galeria-titulo">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Galeria</span>
      <h2 id="galeria-titulo">A formação acontece na prática</h2>
      <p>Aulas, conquistas e momentos que fazem parte da nossa história. Conheça o dia a dia da FBE Técnico.</p>
    </div>
    <div class="tg-grid">
      {''.join(card(a, 'home_cover') for a in albums[:4])}
    </div>
    <div class="tg-cta"><a class="btn btn-primary" href="/tecnico/galeria/">Ver todas as galerias →</a></div>
  </div>
</section>
<!-- FBE_TECNICO_GALERIA_END -->'''
    home, count = re.subn(r'<!-- FBE_TECNICO_GALERIA_START -->.*?<!-- FBE_TECNICO_GALERIA_END -->', lambda _: preview.replace('\n', eol), home, flags=re.S)
    assert count == 1, 'Marcadores da prévia ausentes ou duplicados.'
    home_path.write_bytes(home.encode())
    listing = f'''<div class="tg-hero"><div class="container">
  <nav class="tg-breadcrumb" aria-label="Caminho de navegação"><a href="/tecnico/">Início</a> / Galeria</nav>
  <h1>Galeria</h1><p>Conquistas, encontros e momentos da FBE Técnico.</p>
</div></div>
<div class="tg-content"><div class="container"><div class="tg-grid">
  {''.join(card(a, 'listing_cover') for a in albums)}
</div></div></div>'''
    first = albums[0]
    output = ROOT / GALLERY.lstrip('/')
    (output / 'index.html').write_text(page('Galeria', 'Confira as fotos de formaturas, aulas e atividades dos cursos técnicos da FBE em Salvador.', GALLERY, listing, GALLERY + first['slug'] + '/fotos/' + first['home_cover'], [('FBE Técnico', '/tecnico/'), ('Galeria', GALLERY)]))
    for album in albums:
        route = GALLERY + album['slug'] + '/'
        hero_index = next(i for i, p in enumerate(album['photos']) if p['file'] == album['hero'])
        photos = []
        for i, photo in enumerate(album['photos']):
            portrait = {'data-portrait': ''} if photo['height'] > photo['width'] else {}
            photos.append(f'<a class="tg-photo" href="{route}fotos/{photo["file"]}" data-tg-photo="{route}fotos/{photo["file"]}" data-width="{photo["width"]}" data-height="{photo["height"]}" aria-label="Ampliar foto {i+1} de {len(album["photos"])}">{image(album, photo["file"], **portrait)}</a>')
        title = escape(album['title'])
        article_title = album.get('article_title', album['title'])
        article_copy = ''.join('<p>' + escape(paragraph) + '</p>' for paragraph in album.get('paragraphs', [album['description']]))
        body = f'''<div class="tg-hero"><div class="container">
  <nav class="tg-breadcrumb" aria-label="Caminho de navegação"><a href="/tecnico/">Início</a> / <a href="{GALLERY}">Galeria</a> / {title}</nav>
  <h1>{escape(article_title)}</h1>
</div></div>
<article class="tg-content"><div class="container tg-article">
  <a class="tg-hero-photo" href="{route}fotos/{album['hero']}" data-tg-open="{hero_index}" aria-label="Ampliar imagem principal do álbum">{image(album, album['hero'], loading='eager', fetchpriority='high')}</a>
  <div class="tg-intro">{article_copy}</div>
  <h2 class="tg-album-heading">{escape(album.get('gallery_title', 'Fotos do álbum'))}</h2>
  <p class="tg-album-hint">{len(album['photos'])} fotos · Toque ou clique em uma foto para ampliar.</p>
  <div class="tg-photos">{''.join(photos)}</div>
  <div class="tg-back"><a class="btn btn-dark-outline" href="{GALLERY}">← Voltar para a galeria</a></div>
</div></article>'''
        (output / album['slug'] / 'index.html').write_text(page(article_title, album['description'], route, body, route + 'fotos/' + album['hero'], [('FBE Técnico', '/tecnico/'), ('Galeria', GALLERY), (album['title'], route)], album))
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', ns)
    sitemap = ET.Element(f'{{{ns}}}urlset')
    for route in ['/tecnico/', GALLERY] + [GALLERY + a['slug'] + '/' for a in albums]:
        url = ET.SubElement(sitemap, f'{{{ns}}}url')
        ET.SubElement(url, f'{{{ns}}}loc').text = BASE + route
    ET.indent(sitemap, space='  ')
    (ROOT / 'tecnico/sitemap.xml').write_bytes(ET.tostring(sitemap, encoding='UTF-8', xml_declaration=True) + b'\n')
    print(f'Galeria gerada: {len(albums)} álbum(ns), {sum(len(a["photos"]) for a in albums)} fotos.')


if __name__ == '__main__':
    build()
