#!/usr/bin/env python3
"""Check rendered routes, links, SEO and the preservation of existing inquiry pages."""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

from build import BASE, BLOG, ROOT, build


class Document(HTMLParser):
    def __init__(self, content):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.ids = []
        self.json_ld = []
        self.in_json = False
        self.buffer = []
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_json = True
            self.buffer = []

    def handle_data(self, data):
        if self.in_json:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.in_json:
            self.json_ld.append(json.loads("".join(self.buffer)))
            self.in_json = False


def verify(base=None):
    build(check=True)
    pages = sorted((ROOT / "faculdade/blog").rglob("index.html"))
    cache = {}
    titles = set()
    links_checked = 0
    for path in pages:
        source = path.read_text()
        doc = Document(source)
        route = "/" + str(path.parent.relative_to(ROOT)) + "/"
        expected = BASE + route
        ids = Counter(doc.ids)
        assert not [key for key, count in ids.items() if count > 1], (path, "duplicate IDs")
        assert sum(tag == "h1" for tag, attrs in doc.elements) == 1, path
        assert ('html', {'lang': 'pt-BR'}) in doc.elements
        title = re.search(r"<title>(.*?)</title>", source).group(1)
        assert title not in titles
        titles.add(title)
        canonical = [a["href"] for t, a in doc.elements if t == "link" and a.get("rel") == "canonical"]
        assert canonical == [expected], (path, canonical)
        meta = {a.get("name", a.get("property")): a.get("content") for t, a in doc.elements if t == "meta"}
        assert meta["og:url"] == expected and meta["og:locale"] == "pt_BR"
        assert meta["og:title"] == title and meta["og:description"] == meta["description"]
        assert meta["twitter:card"] == "summary_large_image" and meta["og:image"].startswith(BASE)
        assert meta["description"] and "noindex" not in meta["robots"]
        assert len(doc.json_ld) == 1
        nodes = doc.json_ld[0]["@graph"]
        types = {node["@type"] for node in nodes}
        assert {"CollegeOrUniversity", "BreadcrumbList"} <= types
        articles = [node for node in nodes if node["@type"] == "BlogPosting"]
        if articles:
            article = articles[0]
            assert meta["og:type"] == "article"
            assert article["mainEntityOfPage"] == expected
            assert article["datePublished"] == meta["article:published_time"]
            assert article["dateModified"] == meta["article:modified_time"]
            assert article["author"]["name"] == "Equipe FBE"
            assert any(t == "a" and a.get("href", "").startswith(("/faculdade/graduacao/", "/faculdade/pos-graduacao/")) for t, a in doc.elements)
        else:
            assert {"Blog", "CollectionPage"} <= types and meta["og:type"] == "website"
        for tag, attrs in doc.elements:
            if tag == "img":
                assert "alt" in attrs and "width" in attrs and "height" in attrs or "emec-logo-img" in attrs.get("class", "")
            reference = attrs.get("href") if tag in ("a", "link") else attrs.get("src") if tag in ("img", "script") else None
            if not reference:
                continue
            target = urlsplit(reference)
            if target.scheme or target.netloc:
                if target.netloc != "www.fbebrasil.com.br":
                    continue
            relative = unquote(target.path)
            destination = ROOT / relative.lstrip("/") if relative.startswith("/") else path.parent / relative if relative else path
            if destination.is_dir():
                destination /= "index.html"
            assert destination.is_file(), (path.relative_to(ROOT), reference, "missing target")
            if target.fragment and destination.suffix == ".html":
                if destination not in cache:
                    cache[destination] = Document(destination.read_text()).ids
                assert unquote(target.fragment) in cache[destination], (path, reference, "missing anchor")
            links_checked += 1
    tree = ET.parse(ROOT / "faculdade/sitemap.xml")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [element.text for element in tree.findall("s:url/s:loc", ns)]
    assert len(urls) == len(set(urls)), "Duplicate sitemap URL"
    assert {BASE + "/" + str(path.parent.relative_to(ROOT)) + "/" for path in pages} == {u for u in urls if BASE + BLOG in u}
    assert BASE + "/faculdade/sitemap.xml" in (ROOT / "robots.txt").read_text()
    menus = 0
    for path in (ROOT / "faculdade").rglob("index.html"):
        text = path.read_text()
        if 'class="main-nav"' in text or 'class="main-nav" ' in text:
            assert '<span class="nav-disabled">Blog FBE</span>' not in text
            assert '<a href="/faculdade/blog/"' in text
            menus += 1
    if base:
        # Exact content comparison includes form markup, inline data, scripts and assets.
        old_paths = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", base], cwd=ROOT, text=True).splitlines()
        for name in old_paths:
            if name.startswith("faculdade/") and name.endswith(".html"):
                before = subprocess.check_output(["git", "show", f"{base}:{name}"], cwd=ROOT)
                expected_bytes = before.replace(b'<span class="nav-disabled">Blog FBE</span>', b'<a href="/faculdade/blog/">Blog FBE</a>')
                assert (ROOT / name).read_bytes() == expected_bytes, (name, "unexpected change to existing page")
            elif name.startswith(("faculdade/assets/", "assets/")) or name == "robots.txt":
                before = subprocess.check_output(["git", "show", f"{base}:{name}"], cwd=ROOT)
                assert (ROOT / name).read_bytes() == before, (name, "existing asset changed")
        old_sitemap = subprocess.check_output(["git", "show", f"{base}:faculdade/sitemap.xml"], cwd=ROOT, text=True)
        old_urls = {el.text for el in ET.fromstring(old_sitemap).findall("s:url/s:loc", ns)}
        assert old_urls <= set(urls), "Existing sitemap URL removed"
    print(f"PASS: {len(pages)} pages, {links_checked} local links/assets, {menus} menus, SEO/JSON-LD and sitemap.")
    if base:
        print("PASS: existing pages differ only by the Blog FBE link; forms and existing assets are byte-for-byte preserved.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Git ref for exact comparison of pre-existing pages and assets.")
    verify(parser.parse_args().base)
