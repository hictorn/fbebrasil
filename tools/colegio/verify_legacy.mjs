// Exercise the actual published compatibility script without contacting any service.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(source, '../..');
const pages = JSON.parse(fs.readFileSync(path.join(source, 'pages.json'), 'utf8'));
const home = fs.readFileSync(path.join(root, 'colegio/index.html'), 'utf8');
const asset = home.match(/src="(\/colegio\/assets\/legacy\.[a-f0-9]+\.js)"/)[1];
const script = fs.readFileSync(path.join(root, asset), 'utf8');

function redirect(address, canonical = '/colegio/') {
  let result = null;
  const link = { href: 'https://www.fbebrasil.com.br' + canonical };
  const document = { querySelector(selector) { return selector.startsWith('link') ? link : { setAttribute() {} }; } };
  const window = { location: { href: address, replace(next) { result = next; } } };
  vm.runInNewContext(script, { URL, window, document });
  return result;
}

let count = 0;
for (const page of pages) {
  const name = page.legacy_page ? 'pagina' : page.legacy_post ? 'post' : null;
  if (!name) continue;
  const value = page.legacy_page || page.legacy_post;
  const base = name === 'post' ? '/colegio/mural/' : '/colegio/';
  for (const ending of ['', 'index.html']) {
    const old = `https://www.fbebrasil.com.br${base}${ending}?${name}=${value}&utm_source=meta&fbclid=abc123&gclid=xyz#destino`;
    const result = new URL(redirect(old, base));
    assert.equal(result.pathname, page.route);
    assert.equal(result.searchParams.has(name), false);
    assert.equal(result.searchParams.get('utm_source'), 'meta');
    assert.equal(result.searchParams.get('fbclid'), 'abc123');
    assert.equal(result.searchParams.get('gclid'), 'xyz');
    assert.equal(result.hash, '#destino');
    count++;
  }
}
for (const page of pages) {
  assert.equal(redirect(`https://www.fbebrasil.com.br${page.route}?utm_source=meta`, page.route), null);
  assert.equal(new URL(redirect(`https://www.fbebrasil.com.br${page.route}index.html?utm_source=meta`, page.route)).pathname, page.route);
  count += 2;
}
for (const query of ['pagina=inexistente', 'pagina=__proto__', 'pagina=constructor', 'post=https://example.com', 'pagina=%2F%2Fevil.test']) {
  assert.equal(redirect('https://www.fbebrasil.com.br/colegio/?' + query), null);
  count++;
}
const preview = redirect('http://terminal.local:4173/colegio/?pagina=admissao&utm_source=teste');
assert.equal(preview, 'http://terminal.local:4173/colegio/admissao/?utm_source=teste');
console.log(`PASS: ${count + 1} compatibility cases, campaign parameters, anchors and redirect-loop protection.`);
