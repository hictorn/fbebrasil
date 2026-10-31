#!/usr/bin/env python3
"""Check admissions routes and graduation inquiry navigation without sending leads."""
import argparse
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import parse_qs, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools/blog"))
from verify import Document


def verify(base=None):
    checked = 0
    for path in (ROOT / "faculdade").rglob("index.html"):
        source = path.read_text()
        for match in re.finditer(r"<a\b[^>]*>Ingresso</a>", source):
            link = Document(match.group()).elements[0][1]
            assert link["href"] == "/faculdade/ingresso/", path
            assert "data-request" not in link and "data-scroll" not in link, path
            assert "js-back-home" not in link.get("class", ""), path
            checked += 1
        doc = Document(source)
        for tag, attrs in doc.elements:
            if tag != "a":
                continue
            target = urlsplit(attrs.get("href", ""))
            if target.path == "/faculdade/":
                assert target.fragment != "topo", (path, attrs)
            if target.path == "/faculdade/ingresso/":
                assert not target.fragment, (path, attrs)
    paths = {"engenharia-civil": "eng-civil", "engenharia-de-computacao": "eng-computacao", "engenharia-de-producao": "eng-producao"}
    count = 0
    for path in (ROOT / "faculdade/graduacao").glob("*/index.html"):
        doc = Document(path.read_text())
        links = [attrs for tag, attrs in doc.elements if tag == "a" and set(attrs.get("class", "").split()) & {"header-cta", "sc-cta"}]
        assert len(links) == 2, path
        for attrs in links:
            target = urlsplit(attrs["href"])
            assert target.path == "/faculdade/" and not target.fragment, (path, attrs)
            assert parse_qs(target.query) == {"interesse": [paths.get(path.parent.name, path.parent.name)]}, (path, attrs)
        count += 1
    assert count == 8
    admissions = Document((ROOT / "faculdade/ingresso/index.html").read_text())
    assert sum(tag == "h1" for tag, attrs in admissions.elements) == 1
    assert len(admissions.ids) == len(set(admissions.ids))
    assert [attrs["href"] for tag, attrs in admissions.elements if tag == "link" and attrs.get("rel") == "canonical"] == ["https://www.fbebrasil.com.br/faculdade/ingresso/"]
    assert {node["@type"] for node in admissions.json_ld[0]["@graph"]} >= {"WebPage", "CollegeOrUniversity", "BreadcrumbList"}
    for tag, attrs in admissions.elements:
        target = attrs.get("href") if tag in ("a", "link") else attrs.get("src") if tag in ("img", "script") else None
        if target and target.startswith("/"):
            destination = ROOT / urlsplit(target).path.lstrip("/")
            assert destination.is_file() or (destination / "index.html").is_file(), target
    sitemap = ET.parse(ROOT / "faculdade/sitemap.xml")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    assert "https://www.fbebrasil.com.br/faculdade/ingresso/" in [el.text for el in sitemap.findall("s:url/s:loc", ns)]
    if base:
        old_paths = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", base, "faculdade"], cwd=ROOT, text=True).splitlines()
        for name in old_paths:
            if name.endswith(".html"):
                before = subprocess.check_output(["git", "show", f"{base}:{name}"], cwd=ROOT, text=True)
                after = (ROOT / name).read_text()
                assert re.findall(r"<form\b.*?</form>", before, re.S) == re.findall(r"<form\b.*?</form>", after, re.S), (name, "form changed")
            if "/assets/js/formularios." in name:
                before = subprocess.check_output(["git", "show", f"{base}:{name}"], cwd=ROOT)
                assert before == (ROOT / name).read_bytes(), (name, "inquiry integration changed")
    print(f"PASS: {checked} admissions links, all inquiry CTAs in {count} graduations, admissions SEO/assets/sitemap.")
    if base:
        print("PASS: all pre-existing forms and inquiry integration scripts preserved exactly.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Optional Git ref for exact form preservation checks.")
    verify(parser.parse_args().base)
