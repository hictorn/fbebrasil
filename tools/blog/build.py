#!/usr/bin/env python3
"""Render the Blog FBE as plain HTML for GitHub Pages; Python standard library only."""
import argparse
import datetime as dt
import html
import json
import math
from pathlib import Path
import re
from string import Template
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
BASE = "https://www.fbebrasil.com.br"
BLOG = "/faculdade/blog/"
INSTITUTION = {"@type": "CollegeOrUniversity", "@id": BASE + "/faculdade/#instituicao",
               "name": "Faculdade FBE", "url": BASE + "/faculdade/"}
CATEGORIES = {
    "graduacao": ("Graduação", "Escolha seu curso com informação e planeje os próximos passos da sua formação."),
    "pos-graduacao": ("Pós-graduação", "Conheça caminhos para aprofundar conhecimentos e continuar sua formação."),
    "vida-academica": ("Vida acadêmica", "Ideias práticas para organizar os estudos e aproveitar a experiência na faculdade."),
    "carreira": ("Carreira", "Reflexões sobre competências, aprendizagem e desenvolvimento profissional."),
}
COURSES = {
    "graduacao/administracao": "Graduação em Administração",
    "graduacao/direito": "Graduação em Direito",
    "graduacao/engenharia-de-computacao": "Graduação em Engenharia de Computação",
    "graduacao/enfermagem": "Graduação em Enfermagem",
    "graduacao/psicologia": "Graduação em Psicologia",
    "pos-graduacao/educacao-afrocentrada-tecnologias-e-territorios": "Pós em Educação Afrocentrada, Tecnologias e Territórios",
    "pos-graduacao/enfermagem-em-saude-da-mulher-alta-complexidade-e-cuidado-integral": "Pós em Enfermagem em Saúde da Mulher",
    "pos-graduacao/penal-e-processo-penal-constitucional-teoria-e-pratica": "Pós em Penal e Processo Penal Constitucional",
}


def esc(value):
    return html.escape(str(value), quote=True)


def render(name, **values):
    return Template((SOURCE / "templates" / name).read_text()).substitute(values)


def url(article):
    return BLOG + article["slug"] + "/"


def category_url(key):
    return BLOG + "categoria/" + key + "/"


def display_date(value):
    day = dt.date.fromisoformat(value)
    return day.strftime("%d/%m/%Y")


def minutes(article):
    text = " ".join(section["html"] for section in article["sections"])
    return max(1, math.ceil(len(re.sub(r"<[^>]+>", " ", text).split()) / 200))


def metadata(article):
    return f'<time datetime="{article["date"]}">{display_date(article["date"])}</time><span aria-hidden="true">·</span><span>{minutes(article)} min de leitura</span>'


def card(article):
    return f'''<article class="blog-card">
<a class="blog-card-image" href="{url(article)}" tabindex="-1" aria-hidden="true"><img src="{article['image']}" alt="" width="640" height="400" loading="lazy" decoding="async"></a>
<div class="blog-card-copy"><a class="blog-category" href="{category_url(article['category'])}">{CATEGORIES[article['category']][0]}</a>
<h3><a href="{url(article)}">{esc(article['title'])}</a></h3><p>{esc(article['description'])}</p>
<div class="blog-meta">{metadata(article)}</div><a class="blog-text-link" href="{url(article)}" aria-label="Ler artigo: {esc(article['title'])}">Ler artigo →</a></div></article>'''


def breadcrumb(items):
    visual = '<nav aria-label="Você está aqui"><ol>'
    graph = []
    for i, (name, path) in enumerate(items, 1):
        current = i == len(items)
        visual += f'<li><span aria-current="page">{esc(name)}</span></li>' if current else f'<li><a href="{path}">{esc(name)}</a></li>'
        graph.append({"@type": "ListItem", "position": i, "name": name, "item": BASE + path})
    return visual + "</ol></nav>", {"@type": "BreadcrumbList", "itemListElement": graph}


def page(path, title, description, body, nodes, *, article=None):
    image = article["image"] if article else "/faculdade/assets/institucional/fachada-fbe.png"
    image_alt = article["image_alt"] if article else "Fachada da Faculdade FBE em Salvador."
    article_meta = ""
    if article:
        article_meta = f'<meta property="article:published_time" content="{article["date"]}T09:00:00-03:00">\n<meta property="article:modified_time" content="{article.get("updated", article["date"])}T09:00:00-03:00">\n<meta property="article:section" content="{CATEGORIES[article["category"]][0]}">\n<meta name="author" content="Equipe FBE">'
    data = {"@context": "https://schema.org", "@graph": [INSTITUTION] + nodes}
    return render("page.html", title=esc(title), description=esc(description), canonical=BASE + path,
                  og_type="article" if article else "website", image=BASE + image, image_alt=esc(image_alt),
                  structured_data=json.dumps(data, ensure_ascii=False).replace("<", "\\u003c"),
                  article_meta=article_meta, body=body,
                  header=(SOURCE / "templates/header.html").read_text(),
                  footer=(SOURCE / "templates/footer.html").read_text())


def listing(articles, category=None):
    path = category_url(category) if category else BLOG
    name, intro = CATEGORIES[category] if category else ("Conhecimento para o seu próximo passo.", "Graduação, pós-graduação, vida acadêmica e carreira. Conteúdos para ajudar você a decidir, aprender e seguir em frente.")
    selected = [a for a in articles if a["category"] == category] if category else articles
    crumbs = [("Faculdade FBE", "/faculdade/"), ("Blog FBE", BLOG)]
    if category:
        crumbs.append((name, path))
    visual, schema = breadcrumb(crumbs)
    tabs = [("Todos os artigos", BLOG, category is None)] + [(n, category_url(k), category == k) for k, (n, _) in CATEGORIES.items()]
    nav = ''.join(f'<a href="{p}"' + (' aria-current="page"' if active else '') + f'>{esc(n)}</a>' for n, p, active in tabs)
    feature = ""
    if not category:
        a = selected[0]
        feature = f'''<article class="blog-feature"><a class="blog-feature-image" href="{url(a)}" tabindex="-1" aria-hidden="true"><img src="{a['image']}" width="800" height="600" alt="" fetchpriority="high"></a><div class="blog-feature-copy"><a class="blog-category" href="{category_url(a['category'])}">Em destaque · {CATEGORIES[a['category']][0]}</a><h2><a href="{url(a)}">{esc(a['title'])}</a></h2><p>{esc(a['description'])}</p><div class="blog-meta">{metadata(a)}</div><a class="blog-text-link" href="{url(a)}">Ler o guia completo →</a></div></article>'''
    cards = selected if category else selected[1:]
    heading = f"Artigos sobre {name.lower()}" if category else "Explore os conteúdos"
    body = f'''<div class="container blog-breadcrumb">{visual}</div>
<section class="blog-hero"><div class="container blog-hero-inner"><div><span class="eyebrow">Blog FBE</span><h1>{esc(name)}</h1><p>{esc(intro)}</p></div><div class="blog-hero-note"><strong>Aprender transforma caminhos.</strong><span>Informação para as escolhas de hoje e as possibilidades de amanhã.</span></div></div></section>
<div class="container"><nav class="blog-category-nav" aria-label="Categorias do blog">{nav}</nav>{feature}
<section class="blog-listing" aria-labelledby="artigos"><div class="blog-section-heading"><div><span class="eyebrow">{'Categoria' if category else 'Novas leituras'}</span><h2 id="artigos">{esc(heading)}</h2></div><span class="blog-meta">{len(selected)} {'artigo' if len(selected) == 1 else 'artigos'}{' nesta categoria' if category else ' no blog'}</span></div><div class="blog-grid">{''.join(card(a) for a in cards)}</div></section>
<aside class="blog-callout" aria-labelledby="formacao"><div><span class="eyebrow">Faculdade FBE · Salvador</span><h2 id="formacao">Transforme interesse em formação.</h2><p>Encontre uma graduação para começar sua trajetória ou uma pós-graduação para aprofundar seus conhecimentos.</p></div><div class="blog-callout-actions"><a class="btn btn-primary" href="/faculdade/#cursos">Ver graduações</a><a class="btn blog-secondary" href="/faculdade/pos-graduacao/">Ver pós-graduações</a></div></aside></div>'''
    collection = {"@type": "CollectionPage", "@id": BASE + path + "#pagina", "url": BASE + path,
                  "name": "Blog FBE" if not category else name + " | Blog FBE", "description": intro, "inLanguage": "pt-BR",
                  "isPartOf": {"@id": BASE + BLOG + "#blog"},
                  "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i, "url": BASE + url(a), "name": a["title"]} for i, a in enumerate(selected, 1)]}}
    blog = {"@type": "Blog", "@id": BASE + BLOG + "#blog", "name": "Blog FBE", "url": BASE + BLOG, "inLanguage": "pt-BR", "publisher": {"@id": INSTITUTION["@id"]}}
    title = f"{name} | Blog FBE" if category else "Blog FBE | Graduação, pós-graduação e carreira em Salvador"
    return path, page(path, title, intro, body, [blog, collection, schema])


def article_page(article, articles):
    a = article
    category = CATEGORIES[a["category"]][0]
    crumbs, schema = breadcrumb([("Faculdade FBE", "/faculdade/"), ("Blog FBE", BLOG), (category, category_url(a["category"])), (a["title"], url(a))])
    toc = ''.join(f'<a href="#{s["id"]}">{esc(s["title"])}</a>' for s in a["sections"])
    sections = ''.join(f'<section aria-labelledby="{s["id"]}"><h2 id="{s["id"]}">{esc(s["title"])}</h2>{s["html"]}</section>' for s in a["sections"])
    related = sorted([other for other in articles if other != a], key=lambda other: other["category"] != a["category"])[:3]
    body = render("article.html", breadcrumbs=crumbs, category_url=category_url(a["category"]), category=category,
                  headline=esc(a["title"]), description=esc(a["description"]), date=a["date"], display_date=display_date(a["date"]),
                  reading_time=minutes(a), cover=a["image"], image_alt=esc(a["image_alt"]), toc=toc, sections=sections,
                  course_links=''.join(f'<li><a href="/faculdade/{course}/">{COURSES[course]}</a></li>' for course in a["courses"]), related=''.join(card(other) for other in related))
    node = {"@type": "BlogPosting", "@id": BASE + url(a) + "#artigo", "mainEntityOfPage": BASE + url(a),
            "headline": a["title"], "description": a["description"], "image": BASE + a["image"],
            "datePublished": a["date"] + "T09:00:00-03:00", "dateModified": a.get("updated", a["date"]) + "T09:00:00-03:00",
            "author": {"@type": "Organization", "name": "Equipe FBE", "url": BASE + "/faculdade/"},
            "publisher": {"@id": INSTITUTION["@id"]}, "articleSection": category, "inLanguage": "pt-BR",
            "isPartOf": {"@type": "Blog", "@id": BASE + BLOG + "#blog", "name": "Blog FBE", "url": BASE + BLOG}}
    return url(a), page(url(a), a["title"] + " | Blog FBE", a["description"], body, [node, schema], article=a)


def build(check=False):
    articles = json.loads((SOURCE / "content/articles.json").read_text())
    slugs = set()
    for a in articles:
        assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", a["slug"]), a["slug"]
        assert a["slug"] not in slugs, "Repeated slug"
        slugs.add(a["slug"])
        assert a["category"] in CATEGORIES
        assert (ROOT / a["image"].lstrip("/")).is_file()
        assert a["title"] and a["description"] and a["image_alt"] and a["sections"] and a["courses"]
        assert len({s["id"] for s in a["sections"]}) == len(a["sections"])
        dt.date.fromisoformat(a["date"])
        if "updated" in a:
            assert dt.date.fromisoformat(a["updated"]) >= dt.date.fromisoformat(a["date"])
        for course in a["courses"]:
            assert course in COURSES and (ROOT / "faculdade" / course / "index.html").is_file()
    # Stable sorting preserves the editorial order when publication dates are equal.
    articles.sort(key=lambda a: a["date"], reverse=True)
    outputs = dict([listing(articles)] + [listing(articles, category) for category in CATEGORIES] + [article_page(a, articles) for a in articles])
    files = {ROOT / path.lstrip("/") / "index.html": content for path, content in outputs.items()}
    sitemap = ROOT / "faculdade/sitemap.xml"
    previous = sitemap.read_text()
    # Preserve every non-blog sitemap entry, including future changes outside this tool.
    previous = re.sub(r"\s*<url>\s*<loc>https://www\.fbebrasil\.com\.br/faculdade/blog/.*?</url>", "", previous, flags=re.S)
    additions = []
    by_path = {url(a): a for a in articles}
    for path in outputs:
        date = by_path[path].get("updated", by_path[path]["date"]) if path in by_path else max(a.get("updated", a["date"]) for a in articles)
        additions.append(f'  <url><loc>{BASE + path}</loc><lastmod>{date}</lastmod></url>')
    files[sitemap] = previous.replace("</urlset>", "\n".join(additions) + "\n</urlset>")
    ET.fromstring(files[sitemap])
    stale = set((ROOT / "faculdade/blog").rglob("index.html")) - set(files)
    if stale:
        raise SystemExit("Remove or redirect retired blog URLs explicitly: " + ", ".join(str(p.relative_to(ROOT)) for p in stale))
    differences = [str(path.relative_to(ROOT)) for path, content in files.items() if not path.exists() or path.read_text() != content]
    if check and differences:
        raise SystemExit("Generated files need rebuilding:\n" + "\n".join(differences))
    if not check:
        for path, content in files.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    print(f"{'Verified' if check else 'Generated'} {len(outputs)} blog pages and sitemap.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify generated files without writing.")
    build(parser.parse_args().check)
