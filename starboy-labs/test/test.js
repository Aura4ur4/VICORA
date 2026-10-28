/* Integration tests: build output, internal links, and the contact API. Run: npm test */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { createServer, resetRateLimit } = require('../server');

const DIST = path.join(__dirname, '..', 'dist');
let passed = 0;
const ok = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log('  ✓', name); }, e => { console.error('  ✗', name, '\n   ', e.message); process.exitCode = 1; });

const listen = srv => new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
const post = (port, body, headers = {}) => fetch(`http://127.0.0.1:${port}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const valid = { name: 'Asha Rao', email: 'asha@acme.com', company: 'Acme Agency', website: 'acme.com', industry: 'E-commerce', service: 'agency', description: 'We build client reports by hand every week.', frequency: '20 to 100 times a month', contactMethod: 'email', consent: true };

(async () => {
  console.log('Static output');
  const files = fs.readdirSync(DIST);
  const pages = files.filter(f => f.endsWith('.html'));
  await ok('all 7 pages + 404 exist', () => ['index', 'services', 'solutions', 'industries', 'about', 'contact', 'privacy', '404'].forEach(n => assert(files.includes(n + '.html'), n)));
  await ok('sitemap, robots, favicon, og image present', () => ['sitemap.xml', 'robots.txt', 'favicon.svg', 'og.png', 'app.js', 'styles.css', 'finder-data.json'].forEach(f => assert(files.includes(f), f)));
  await ok('every internal link and #anchor resolves', () => {
    const idsOf = f => new Set([...fs.readFileSync(path.join(DIST, f), 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    const bad = [];
    for (const f of pages) {
      const html = fs.readFileSync(path.join(DIST, f), 'utf8');
      for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const u = m[1];
        if (/^(https?:|mailto:|#$)/.test(u)) continue;
        const [pathPart, hash] = u.split('#'); const clean = pathPart.split('?')[0];
        const target = clean === '' ? f : clean.replace(/^\//, '');
        if (!fs.existsSync(path.join(DIST, target))) { bad.push(`${f} -> ${u}`); continue; }
        if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) bad.push(`${f} -> ${u} (missing anchor)`);
      }
    }
    assert.deepStrictEqual(bad, []);
  });
  await ok('each page has title, description, canonical, og:image, one h1', () => {
    for (const f of pages) {
      const h = fs.readFileSync(path.join(DIST, f), 'utf8');
      assert(/<title>.+<\/title>/.test(h), f + ' title'); assert(/name="description"/.test(h), f + ' desc'); assert(/rel="canonical"/.test(h), f + ' canonical'); assert(/og:image/.test(h), f + ' og');
      assert.strictEqual((h.match(/<h1[ >]/g) || []).length, 1, f + ' h1 count');
    }
  });
  await ok('all 4 service CTAs and 9 FAQ items present', () => {
    const home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    assert.strictEqual((home.match(/Discuss This Solution/g) || []).length, 4);
    assert.strictEqual((fs.readFileSync(path.join(DIST, 'contact.html'), 'utf8').match(/<details>/g) || []).length, 9);
  });
  await ok('no invented contact details when env unset', () => {
    if (process.env.CONTACT_EMAIL) return;
    assert(!/mailto:/.test(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')));
  });

  console.log('Contact API');
  // webhook receiver
  const received = []; let webhookStatus = 200;
  const hook = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => { received.push(JSON.parse(b)); res.writeHead(webhookStatus); res.end('{}'); }); });
  const hookPort = await listen(hook);

  delete process.env.RESEND_API_KEY; delete process.env.LEAD_WEBHOOK_URL; delete process.env.ALLOWED_ORIGIN;
  const srv = createServer(); const port = await listen(srv);

  await ok('static server serves home, clean URL and custom 404', async () => {
    assert.strictEqual((await fetch(`http://127.0.0.1:${port}/`)).status, 200);
    assert.strictEqual((await fetch(`http://127.0.0.1:${port}/services`)).status, 200);
    const r = await fetch(`http://127.0.0.1:${port}/nope`); assert.strictEqual(r.status, 404); assert(/could not be found/.test(await r.text()));
    assert.strictEqual((await fetch(`http://127.0.0.1:${port}/..%2f..%2fserver.js`)).status, 404);
  });
  await ok('security headers present', async () => { const r = await fetch(`http://127.0.0.1:${port}/`); assert(r.headers.get('content-security-policy')); assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff'); });
  await ok('health reports delivery NOT configured', async () => { const j = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json(); assert.strictEqual(j.deliveryConfigured, false); });
  await ok('invalid payload -> 400 with field errors', async () => {
    const r = await post(port, { name: '', email: 'bad', consent: false }); assert.strictEqual(r.status, 400);
    const j = await r.json(); ['name', 'email', 'company', 'industry', 'service', 'description', 'consent'].forEach(k => assert(j.errors[k], k));
  });
  await ok('bad JSON -> 400, wrong content-type -> 415, GET -> 405', async () => {
    assert.strictEqual((await post(port, '{oops')).status, 400);
    assert.strictEqual((await fetch(`http://127.0.0.1:${port}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' })).status, 415);
    assert.strictEqual((await fetch(`http://127.0.0.1:${port}/api/contact`)).status, 405);
  });
  await ok('valid lead with NO delivery configured -> 503 (never fake success)', async () => { const r = await post(port, valid); assert.strictEqual(r.status, 503); assert.strictEqual((await r.json()).ok, false); });
  await ok('oversized body -> 413', async () => { assert.strictEqual((await post(port, { ...valid, description: 'x'.repeat(30000) })).status, 413); });
  srv.close(); resetRateLimit();

  // new server instance = fresh rate-limit window for the delivery tests
  process.env.LEAD_WEBHOOK_URL = `http://127.0.0.1:${hookPort}/hook`;
  const srv2 = createServer(); const p2 = await listen(srv2);
  await ok('valid lead with webhook -> 201 and payload delivered', async () => {
    const r = await post(p2, { ...valid, finderSummary: 'Suggested: Report drafting' }); assert.strictEqual(r.status, 201); assert.strictEqual((await r.json()).ok, true);
    assert.strictEqual(received.length, 1); assert.strictEqual(received[0].lead.email, 'asha@acme.com'); assert.strictEqual(received[0].lead.service, 'agency'); assert(/Report drafting/.test(received[0].lead.finderSummary));
  });
  await ok('honeypot is accepted silently and NOT forwarded', async () => { const n = received.length; const r = await post(p2, { ...valid, company_url: 'http://spam' }); assert.strictEqual(r.status, 200); assert.strictEqual(received.length, n); });
  await ok('webhook failure -> 502 (not success)', async () => { webhookStatus = 500; const r = await post(p2, valid); assert.strictEqual(r.status, 502); webhookStatus = 200; });
  await ok('rate limit -> 429 after 5 requests per window', async () => {
    let last; for (let i = 0; i < 4; i++) last = await post(p2, valid); assert.strictEqual(last.status, 429);
  });
  srv2.close(); resetRateLimit();

  process.env.ALLOWED_ORIGIN = 'https://www.example.com';
  const srv3 = createServer(); const p3 = await listen(srv3);
  await ok('ALLOWED_ORIGIN blocks other origins', async () => { assert.strictEqual((await post(p3, valid, { Origin: 'https://evil.test' })).status, 403); });
  srv3.close(); hook.close();

  console.log(`\n${passed} checks passed${process.exitCode ? ', with failures' : ''}`);
})();
