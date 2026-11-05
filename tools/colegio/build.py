#!/usr/bin/env python3
"""Render Colégio FBE pages for the existing GitHub Pages hosting (stdlib only)."""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
BASE = "https://www.fbebrasil.com.br"
COLLEGE = "/colegio/"


class Links(HTMLParser):
    """Locate opening tags without reserializing forms or other original markup."""
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.lines = [0]
        self.tags = []
        for match in re.finditer("\n", source):
            self.lines.append(match.end())
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        line, column = self.getpos()
        self.tags.append((self.lines[line - 1] + column,
                          self.get_starttag_text(), tag, dict(attrs)))


def esc(value):
    return html.escape(str(value), quote=True)


def set_attr(tag, name, value):
    pattern = rf'\b{re.escape(name)}\s*=\s*([\'"])(.*?)\1'
    escaped = html.escape(str(value), quote=False).replace('"', '&quot;')
    if re.search(pattern, tag, re.S):
        return re.sub(pattern, lambda _: f'{name}="{escaped}"', tag, count=1, flags=re.S)
    return tag[:-1] + f' {name}="{escaped}">'


def routes():
    return json.loads((SOURCE / "pages.json").read_text())


def rewrite(source, origin, pages):
    by_view = {page["view"]: page["route"] for page in pages}
    by_post = {page["legacy_post"]: page["route"] for page in pages if page.get("legacy_post")}
    # The original cards used empty clickable divs. Real anchors preserve their
    # block layout and make the covers accessible without JavaScript.
    source = re.sub(r'<div\b([^>]*\bdata-view="[^"]+"[^>]*)>\s*</div>',
                    lambda m: '<a' + m.group(1) + '></a>', source)
    changes = []
    for start, original, tag, attrs in Links(source).tags:
        updated = original
        if tag == "a":
            classes = attrs.get("class", "").split()
            href = attrs.get("href", "")
            if attrs.get("data-view") in by_view:
                href = by_view[attrs["data-view"]]
                if "dest-img" in classes:
                    updated = set_attr(updated, "style", attrs.get("style", "").rstrip(";") + ";display:block")
                    label = next(p["label"] for p in pages if p["view"] == attrs["data-view"])
                    updated = set_attr(updated, "aria-label", label)
            elif attrs.get("data-adm-scroll"):
                href = "#" + attrs["data-adm-scroll"]
            elif "js-go-home" in classes:
                href = COLLEGE + (href if href.startswith("#") and len(href) > 1 else "")
            elif "js-scroll-ensino" in classes:
                href = COLLEGE + "#ensino"
            elif href and "@@" not in href and not href.startswith(("#", "mailto:", "tel:", "javascript:")):
                target = urlsplit(urljoin(BASE + origin, href))
                if target.netloc == "www.fbebrasil.com.br":
                    post = parse_qs(target.query).get("post", [None])[0]
                    if target.path.startswith(COLLEGE + "mural/") and post in by_post:
                        href = by_post[post]
                    elif not urlsplit(href).scheme and not href.startswith("/"):
                        href = target.path + ("?" + target.query if target.query else "") + ("#" + target.fragment if target.fragment else "")
            if href:
                updated = set_attr(updated, "href", href)
            # Static links work with JavaScript disabled and support new tabs.
            updated = re.sub(r'\sdata-view="[^"]*"', "", updated)
            classes = [c for c in classes if c not in {"js-open-page", "js-go-home"}]
            if attrs.get("class") is not None:
                updated = set_attr(updated, "class", " ".join(classes))
        for name in ("src", "poster"):
            value = attrs.get(name, "")
            if value and "@@" not in value and not value.startswith(("data:", "https:", "http:", "/", "#")):
                updated = set_attr(updated, name, urlsplit(urljoin(BASE + origin, value)).path)
        if updated != original:
            changes.append((start, start + len(original), updated))
    for start, end, value in reversed(changes):
        source = source[:start] + value + source[end:]

    def asset(match):
        value = match.group(2)
        if value.startswith(("data:", "https:", "http:", "/", "#")):
            return match.group()
        return "url(" + match.group(1) + urlsplit(urljoin(BASE + origin, value)).path + match.group(1) + ")"
    return re.sub(r'''url\((['"]?)([^)'"\s]+)\1\)''', asset, source)


def metadata(page):
    address = BASE + page["route"]
    title, description = page["title"], page["description"]
    crumbs = [("FBE Brasil", "/"), ("Colégio FBE", COLLEGE)]
    if page["route"].startswith(COLLEGE + "mural/") and page["route"] != COLLEGE + "mural/":
        crumbs.append(("Mural", COLLEGE + "mural/"))
    if page["route"] != COLLEGE:
        crumbs.append((page["label"], page["route"]))
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "School", "@id": BASE + COLLEGE + "#instituicao", "name": "Colégio FBE",
         "url": BASE + COLLEGE, "telephone": "+55-71-4101-0266",
         "address": {"@type": "PostalAddress", "streetAddress": "Rua Adhemar Pinheiro Lemos, 1617, Imbuí",
                     "addressLocality": "Salvador", "addressRegion": "BA", "addressCountry": "BR"}},
        {"@type": "CollectionPage" if page["view"] == "view-mural" else "WebPage",
         "@id": address + "#pagina", "url": address, "name": title, "description": description,
         "inLanguage": "pt-BR", "about": {"@id": BASE + COLLEGE + "#instituicao"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": BASE + route}
            for i, (name, route) in enumerate(crumbs)]}
    ]}
    return f'''<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{address}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Colégio FBE">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{address}">
<meta property="og:image" content="{BASE}{page['image']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{BASE}{page['image']}">
<script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')}</script>'''


def build(check=False):
    pages = routes()
    output = {}

    def asset(name, data, extension):
        name = f"colegio/assets/{name}.{hashlib.sha256(data.encode()).hexdigest()[:12]}.{extension}"
        output[ROOT / name] = data
        return "/" + name

    css = {}
    for kind in ("site", "mural"):
        css[kind] = asset(kind, (SOURCE / "templates" / f"{kind}.css").read_text(), "css")
    js = asset("site", (SOURCE / "templates/site.js").read_text(), "js")
    tracking = asset("tracking", (SOURCE / "templates/tracking.js").read_text(), "js")
    legacy_source = (SOURCE / "templates/legacy.js").read_text()
    legacy_source = legacy_source.replace("@@PAGE_ROUTES@@", json.dumps(
        {p["legacy_page"]: p["route"] for p in pages if p.get("legacy_page")}, ensure_ascii=False))
    legacy_source = legacy_source.replace("@@POST_ROUTES@@", json.dumps(
        {p["legacy_post"]: p["route"] for p in pages if p.get("legacy_post")}, ensure_ascii=False))
    legacy = asset("legacy", legacy_source, "js")
    for page in pages:
        kind = "mural" if page["route"].startswith(COLLEGE + "mural/") else "site"
        shell = (SOURCE / "templates" / f"{kind}.html").read_text()
        body = (SOURCE / "content" / f"{page['key']}.html").read_text()
        body = rewrite(body, page["source_route"], pages)
        body = re.sub(r'class="view(?: active)?"', 'class="view active"', body, count=1)
        if page["view"] == "view-home":
            body = body.replace('<h2>Uma educação completa vai muito além da sala de aula</h2>',
                                '<h1>Uma educação completa vai muito além da sala de aula</h1>')
        shell = rewrite(shell, page["source_route"], pages)
        result = shell.replace("@@METADATA@@", metadata(page)).replace("@@CSS@@", css[kind])
        result = result.replace("@@JS@@", js).replace("@@LEGACY@@", legacy)
        result = result.replace("@@TRACKING@@", tracking)
        result = result.replace("@@PAGE@@", esc(page.get("legacy_page", page.get("legacy_post", "mural"))))
        result = result.replace("@@CONTENT@@", body)
        assert "@@" not in result, page["key"]
        output[ROOT / page["route"].lstrip("/") / "index.html"] = result

    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    tree = ET.Element("{http://www.sitemaps.org/schemas/sitemap/0.9}urlset")
    for page in pages:
        node = ET.SubElement(tree, "{http://www.sitemaps.org/schemas/sitemap/0.9}url")
        ET.SubElement(node, "{http://www.sitemaps.org/schemas/sitemap/0.9}loc").text = BASE + page["route"]
    ET.indent(tree, space="  ")
    output[ROOT / "colegio/sitemap.xml"] = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(tree, encoding="unicode") + "\n"
    stale = []
    for path, data in output.items():
        if check:
            if not path.is_file() or path.read_text() != data:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(data)
    if stale:
        raise SystemExit("Generated files need rebuilding: " + ", ".join(stale))
    print(f"{'Verified' if check else 'Built'} {len(pages)} Colégio pages, shared CSS/JS and sitemap.")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    build(parser.parse_args().check)
