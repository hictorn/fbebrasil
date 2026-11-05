// Exercise published form/tracking code; no network requests or real submissions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(source, '../..');
const pages = JSON.parse(fs.readFileSync(path.join(source, 'pages.json'), 'utf8'));
const home = fs.readFileSync(path.join(root, 'colegio/index.html'), 'utf8');
const trackingAsset = home.match(/src="(\/colegio\/assets\/tracking\.[a-f0-9]+\.js)"/)[1];
const siteAsset = home.match(/src="(\/colegio\/assets\/site\.[a-f0-9]+\.js)"/)[1];
const tracking = fs.readFileSync(path.join(root, trackingAsset), 'utf8');
const site = fs.readFileSync(path.join(root, siteAsset), 'utf8');
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page.route, 'index.html'), 'utf8');
  assert.equal(html.split(trackingAsset).length - 1, 1, page.route);
  assert.ok(html.indexOf(trackingAsset) < html.indexOf(siteAsset), page.route);
}

const plain = value => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(resolve => setImmediate(resolve));
function environment({formId = 'admissaoForm', withTracking = true, metaThrows = false, gaThrows = false} = {}) {
  const meta = [], ga = [], emails = [], alerts = [], deferred = [];
  const callbacks = new Map();
  const button = {disabled: false, textContent: 'Enviar pré-inscrição'};
  const success = {style: {display: 'none'}};
  const form = {
    resets: 0,
    privateFields: {candidato: 'ALUNO PRIVADO', phone: '71987654321', email: 'responsavel@example.invalid'},
    querySelector(selector) { return selector === '.form-success' ? success : button; },
    addEventListener(name, callback) { callbacks.set('form:' + name, callback); },
    reset() { this.resets++; }
  };
  let eventIndex = 0;
  const window = {
    crypto: {randomUUID: () => 'test-event-' + (++eventIndex)},
    fbq(...args) { meta.push(plain(args)); if (metaThrows) throw new Error('Meta blocked'); },
    gtag(...args) { ga.push(plain(args)); if (gaThrows) throw new Error('GA4 blocked'); },
    addEventListener() {}, scrollTo() {}
  };
  const document = {
    body: {dataset: {page: 'admissao'}},
    getElementById(id) { return id === formId ? form : null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener(name, callback) { callbacks.set(name, callback); },
    createElement() { throw new Error('Unexpected real script loader'); }
  };
  const emailjs = {sendForm(service, template, originalForm) {
    emails.push({service, template, originalForm});
    return new Promise((resolve, reject) => deferred.push({resolve, reject}));
  }};
  const context = vm.createContext({window, document, emailjs, gtag: window.gtag,
    alert: message => alerts.push(message), setTimeout() {}, URL, console});
  if (withTracking) vm.runInContext(tracking, context);
  vm.runInContext(site, context);
  callbacks.get('DOMContentLoaded')();
  return {window, context, form, button, success, meta, ga, emails, alerts, deferred,
    submit() { let prevented = false; callbacks.get('form:submit')({preventDefault() { prevented = true; }}); assert.ok(prevented); }};
}
const leads = env => env.meta.filter(args => args[0] === 'trackSingle' && args[2] === 'Lead');
const gaLeads = env => env.ga.filter(args => args[1] === 'generate_lead');

const initial = environment();
assert.equal(leads(initial).length, 0, 'Page views are not registrations');
assert.equal(initial.meta.filter(args => args[2] === 'PageView').length, 1);
vm.runInContext(tracking, initial.context);
assert.equal(initial.meta.filter(args => args[0] === 'init').length, 1, 'No duplicate pixel initialization');
initial.submit();
initial.submit();
assert.equal(initial.emails.length, 1, 'Prevent duplicate submissions while pending');
assert.equal(leads(initial).length, 0, 'A button click does not count as a lead');
assert.equal(initial.emails[0].service, 'service_n40ybhn');
assert.equal(initial.emails[0].template, 'template_ax5qtqc');
assert.equal(initial.emails[0].originalForm, initial.form);
initial.deferred[0].resolve({status: 200});
await flush();
assert.equal(leads(initial).length, 1);
assert.equal(gaLeads(initial).length, 1);
assert.equal(leads(initial)[0][1], '514422286798390');
assert.equal(gaLeads(initial)[0][2].send_to, 'G-T5VY6DEC5Q');
assert.equal(leads(initial)[0][4].eventID, gaLeads(initial)[0][2].event_id);
assert.equal(initial.form.resets, 1);
assert.equal(initial.success.style.display, 'block');
assert.equal(initial.button.disabled, false);
const firstId = leads(initial)[0][4].eventID;
initial.submit(); initial.deferred[1].resolve({status: 200}); await flush();
assert.equal(leads(initial).length, 2);
assert.notEqual(leads(initial)[1][4].eventID, firstId, 'Separate successful registrations remain distinct');
const eventData = JSON.stringify([...leads(initial), ...gaLeads(initial)]);
for (const value of Object.values(initial.form.privateFields)) assert.ok(!eventData.includes(value));

const failed = environment();
failed.submit(); failed.deferred[0].reject(new Error('Email failed')); await flush();
assert.equal(leads(failed).length, 0); assert.equal(gaLeads(failed).length, 0);
assert.equal(failed.alerts.length, 1); assert.equal(failed.form.resets, 0);
assert.equal(failed.button.disabled, false);
failed.submit(); failed.deferred[1].resolve({status: 200}); await flush();
assert.equal(leads(failed).length, 1, 'A retry counts only after success');

for (const options of [{metaThrows: true}, {gaThrows: true}, {withTracking: false}]) {
  const env = environment(options);
  env.submit(); env.deferred[0].resolve({status: 200}); await flush();
  assert.equal(env.emails.length, 1); assert.equal(env.form.resets, 1);
  assert.equal(env.success.style.display, 'block'); assert.equal(env.alerts.length, 0);
  assert.equal(env.button.disabled, false, 'Tracking failures do not change form success');
}
const unexpected = environment();
unexpected.window.fbeAdmissionsTracking.preRegistrationSucceeded = () => { throw new Error('Unexpected tracking failure'); };
unexpected.submit(); unexpected.deferred[0].resolve({status: 200}); await flush();
assert.equal(unexpected.form.resets, 1); assert.equal(unexpected.alerts.length, 0);

const contact = environment({formId: 'contatoForm'});
contact.submit(); contact.deferred[0].resolve({status: 200}); await flush();
assert.equal(contact.emails[0].template, 'template_w4e1kod');
assert.equal(leads(contact).length, 0, 'General contact is not a pre-registration');
assert.equal(gaLeads(contact).length, 0);

const inserted = [];
const loaderWindow = {};
const loaderDocument = {createElement: () => ({}), getElementsByTagName: () => [], head: {appendChild: script => inserted.push(script)}};
const loaderContext = vm.createContext({window: loaderWindow, document: loaderDocument});
vm.runInContext(tracking, loaderContext); vm.runInContext(tracking, loaderContext);
assert.equal(inserted.length, 1);
assert.equal(inserted[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
assert.equal(inserted[0].async, true);
assert.deepEqual(plain(loaderWindow.fbq.queue.map(args => Array.from(args))), [
  ['init', '514422286798390'], ['trackSingle', '514422286798390', 'PageView']
]);
console.log('PASS: published tracking, successful/failed/retried submissions, duplicate prevention, original EmailJS, no form values in event parameters and blocked analytics.');
