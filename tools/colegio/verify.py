#!/usr/bin/env python3
"""Check every published Colégio route, asset, anchor and SEO field; never send leads."""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

from build import BASE, ROOT, SOURCE, build, routes


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.elements, self.ids, self.structured = [], [], []
        self.json_buffer = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.json_buffer = []

    def handle_data(self, value):
        if self.json_buffer is not None:
            self.json_buffer.append(value)

    def handle_endtag(self, tag):
        if tag == "script" and self.json_buffer is not None:
            self.structured.append(json.loads("".join(self.json_buffer)))
            self.json_buffer = None


def verify(base=None):
    build(check=True)
    pages = routes()
    titles, descriptions, documents = set(), set(), {}
    references = 0
    for page in pages:
        path = ROOT / page["route"].lstrip("/") / "index.html"
        documents[path] = Document(path.read_text())
    for page in pages:
        path = ROOT / page["route"].lstrip("/") / "index.html"
        text, doc = path.read_text(), documents[path]
        assert not [i for i, count in Counter(doc.ids).items() if count > 1], (path, "duplicate IDs")
        assert sum(t == "h1" for t, a in doc.elements) == 1, (path, "main heading")
        views = [a for t, a in doc.elements if "view" in a.get("class", "").split()]
        assert len(views) == 1 and views[0]["id"] == page["view"], (path, "content leaking between pages")
        assert "active" in views[0]["class"].split(), (path, "page hidden without JS")
        assert sum(t == "main" for t, a in doc.elements) == 1
        title = re.search(r"<title>(.*?)</title>", text).group(1)
        assert title not in titles, (path, "duplicate title")
        titles.add(title)
        meta = {a.get("name", a.get("property")): a.get("content") for t, a in doc.elements if t == "meta"}
        assert meta["description"] not in descriptions, (path, "duplicate description")
        descriptions.add(meta["description"])
        expected = BASE + page["route"]
        assert [a["href"] for t, a in doc.elements if t == "link" and a.get("rel") == "canonical"] == [expected]
        assert meta["og:url"] == expected and meta["og:locale"] == "pt_BR"
        assert meta["og:description"] == meta["description"]
        assert "noindex" not in meta["robots"]
        assert (ROOT / page["image"].lstrip("/")).is_file(), (path, "social image")
        assert len(doc.structured) == 1
        assert {n["@type"] for n in doc.structured[0]["@graph"]} >= {"School", "BreadcrumbList"}
        for tag, attrs in doc.elements:
            assert "data-view" not in attrs, (path, "old navigation handler")
            for name in ("href", "src", "poster"):
                value = attrs.get(name)
                if not value or value.startswith(("data:", "mailto:", "tel:")):
                    continue
                target = urlsplit(urljoin(expected, value))
                if target.netloc != "www.fbebrasil.com.br":
                    continue
                assert "?pagina=" not in value and "?post=" not in value, (path, "old link")
                destination = ROOT / unquote(target.path).lstrip("/")
                if destination.is_dir():
                    destination /= "index.html"
                assert destination.is_file(), (path, value, "missing target")
                if target.fragment and destination.suffix == ".html":
                    if destination not in documents:
                        documents[destination] = Document(destination.read_text())
                    assert unquote(target.fragment) in documents[destination].ids, (path, value, "missing anchor")
                references += 1
        for value in re.findall(r'''url\(['"]?([^)'"\s]+)''', text):
            if not value.startswith(("data:", "http:", "https:")):
                assert (ROOT / unquote(urlsplit(urljoin(expected, value)).path).lstrip("/")).is_file(), (path, value)

    sitemap = ET.parse(ROOT / "colegio/sitemap.xml")
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    addresses = [el.text for el in sitemap.findall("s:url/s:loc", namespace)]
    assert len(addresses) == len(set(addresses)) == len(pages)
    assert set(addresses) == {BASE + p["route"] for p in pages}
    assert BASE + "/colegio/sitemap.xml" in (ROOT / "robots.txt").read_text()

    # Dynamic gallery/laboratory/video URLs must also work from deep routes.
    runtime = (SOURCE / "templates/site.js").read_text()
    for asset in re.findall(r"['\"](/colegio/[^'\"]+\.(?:jpg|jpeg|png|webp|svg|mp4))['\"]", runtime):
        assert (ROOT / asset.lstrip("/")).is_file(), (asset, "dynamic asset")
    for path in (ROOT / "colegio/assets").glob("*.js"):
        subprocess.run(["node", "--check", str(path)], check=True)
    subprocess.run(["node", str(SOURCE / "verify_legacy.mjs")], check=True)
    subprocess.run(["node", str(SOURCE / "verify_tracking.mjs")], check=True)

    if base:
        original = subprocess.check_output(["git", "show", base + ":colegio/index.html"], cwd=ROOT, text=True)
        before = {re.search(r'\bid="([^"]+)"', f).group(1): f for f in re.findall(r"<form\b.*?</form>", original, re.S)}
        after = {}
        for page in pages:
            file = ROOT / page["route"].lstrip("/") / "index.html"
            after.update({re.search(r'\bid="([^"]+)"', f).group(1): f for f in re.findall(r"<form\b.*?</form>", file.read_text(), re.S)})
        assert before == after, "Original form markup must be preserved exactly"
        old_init = re.search(r"emailjs\.init\(.*?\);", original).group()
        assert all(old_init in (SOURCE / "templates" / f"{kind}.html").read_text() for kind in ("site", "mural"))
        assert re.findall(r"emailjs\.sendForm\([^\n]+", original) == re.findall(r"emailjs\.sendForm\([^\n]+", runtime)
        # The Mural stylesheet stays identical; the homepage heading changes tag only.
        for kind, file in (("site", "colegio/index.html"), ("mural", "colegio/mural/index.html")):
            old = subprocess.check_output(["git", "show", f"{base}:{file}"], cwd=ROOT, text=True)
            css = re.search(r"<style>(.*?)</style>", old, re.S).group(1)
            if kind == "site":
                css = css.replace(".intro-text h2", ".intro-text :is(h1,h2)")
            assert css == (SOURCE / "templates" / f"{kind}.css").read_text(), (kind, "visual CSS changed")
        print("PASS: original forms, EmailJS integration and responsive styles preserved.")
    print(f"PASS: {len(pages)} pages, {references} local links/assets, anchors, headings, SEO and sitemap.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Git ref before migration, for exact form/style preservation checks.")
    verify(parser.parse_args().base)
