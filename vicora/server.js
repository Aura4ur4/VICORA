/* VICORA server: serves ./dist and exposes POST /api/contact.
 * Zero dependencies (Node 18+). Secrets come from environment variables only. */
const http = require('http');
const fs = require('fs');
const path = require('path');

// optional .env loader (runtime values)
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (_) { /* none */ }

const DIST = path.join(__dirname, 'dist');
const env = () => process.env; // read lazily so tests can change values
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.webp': 'image/webp', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

// ---------- validation ----------
const SERVICES = ['agents', 'automation', 'agency', 'data', 'unsure'];
const METHODS = ['email', 'call', 'video', 'whatsapp'];
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

function validate(b) {
  const errors = {};
  const d = {
    name: clean(b.name, 120), email: clean(b.email, 200), company: clean(b.company, 160), website: clean(b.website, 200),
    industry: clean(b.industry, 80), service: clean(b.service, 20), description: clean(b.description, 3000),
    frequency: clean(b.frequency, 80), contactMethod: clean(b.contactMethod, 20) || 'email', finderSummary: clean(b.finderSummary, 1500), page: clean(b.page, 100),
  };
  if (!d.name) errors.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(d.email)) errors.email = 'Please enter a valid email address.';
  if (!d.company) errors.company = 'Please enter your company or agency name.';
  if (d.website && !/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(d.website)) errors.website = 'Please enter a valid website.';
  if (!d.industry) errors.industry = 'Please choose your industry.';
  if (!SERVICES.includes(d.service)) errors.service = 'Please choose a service.';
  if (d.description.length < 10) errors.description = 'Please describe the task or problem (at least 10 characters).';
  if (b.consent !== true) errors.consent = 'Consent is required.';
  if (!METHODS.includes(d.contactMethod)) d.contactMethod = 'email';
  return { errors, data: d };
}

// ---------- rate limiting (in-memory; use a shared store if you run multiple instances) ----------
const hits = new Map();
const LIMIT = 5, WINDOW = 15 * 60 * 1000;
function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW)) hits.delete(k);
  return arr.length > LIMIT;
}
const clientIp = req => (env().TRUST_PROXY === 'true' && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';

// ---------- delivery ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function deliveryConfigured() {
  const e = env();
  return Boolean((e.RESEND_API_KEY && e.LEAD_TO_EMAIL && e.LEAD_FROM_EMAIL) || e.LEAD_WEBHOOK_URL);
}
async function withTimeout(url, opts) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 10000);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(t); }
}
async function deliver(lead) {
  const e = env(), results = [];
  if (e.RESEND_API_KEY && e.LEAD_TO_EMAIL && e.LEAD_FROM_EMAIL) {
    const rows = Object.entries(lead).filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><b>${esc(k)}</b></td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('');
    results.push(withTimeout('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: e.LEAD_FROM_EMAIL, to: [e.LEAD_TO_EMAIL], reply_to: lead.email, subject: `New VICORA enquiry: ${lead.company}`, html: `<table>${rows}</table>` }),
    }).then(r => ({ ok: r.ok, via: 'resend', status: r.status })));
  }
  if (e.LEAD_WEBHOOK_URL) {
    results.push(withTimeout(e.LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'vicora-website', receivedAt: new Date().toISOString(), lead }) })
      .then(r => ({ ok: r.ok, via: 'webhook', status: r.status })));
  }
  const settled = await Promise.allSettled(results);
  const outcomes = settled.map(s => s.status === 'fulfilled' ? s.value : { ok: false, error: String(s.reason && s.reason.message || s.reason) });
  outcomes.forEach(o => { if (!o.ok) console.error('[lead-delivery] failed:', JSON.stringify(o)); });
  return outcomes.some(o => o.ok);
}

// ---------- http helpers ----------
function send(res, code, obj, headers = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
function readBody(req, max = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0, tooBig = false; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 1000000) { req.destroy(); return reject(Object.assign(new Error('too large'), { code: 413 })); }
      if (size > max) tooBig = true; else chunks.push(c); // keep draining so the client can read our 413
    });
    req.on('end', () => tooBig ? reject(Object.assign(new Error('too large'), { code: 413 })) : resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleContact(req, res) {
  const allowed = env().ALLOWED_ORIGIN;
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return send(res, 403, { ok: false, error: 'Origin not allowed.' });
  if (!(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { ok: false, error: 'Send JSON.' });
  if (limited(clientIp(req))) return send(res, 429, { ok: false, error: 'Too many requests. Please try again later.' }, { 'Retry-After': '900' });
  let body;
  // On Vercel the body is already parsed (req.body) and the stream consumed.
  if (req.body !== undefined && req.body !== null) {
    body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return null; } })() : req.body;
    if (body === null) return send(res, 400, { ok: false, error: 'Invalid JSON.' });
  } else try { body = JSON.parse(await readBody(req)); } catch (err) { return send(res, err.code === 413 ? 413 : 400, { ok: false, error: err.code === 413 ? 'Payload too large.' : 'Invalid JSON.' }); }
  if (!body || typeof body !== 'object') return send(res, 400, { ok: false, error: 'Invalid body.' });
  // honeypot: bots fill the hidden field. Respond as if accepted but do not forward.
  if (body.company_url) return send(res, 200, { ok: true });
  const { errors, data } = validate(body);
  if (Object.keys(errors).length) return send(res, 400, { ok: false, errors });
  if (!deliveryConfigured()) {
    console.error('[lead-delivery] NOT CONFIGURED: lead not delivered. Set RESEND_* or LEAD_WEBHOOK_URL.');
    return send(res, 503, { ok: false, error: 'Lead delivery is not configured on this server.' });
  }
  let ok = false;
  try { ok = await deliver(data); } catch (err) { console.error('[lead-delivery] error', err); }
  return ok ? send(res, 201, { ok: true }) : send(res, 502, { ok: false, error: 'We could not deliver your enquiry.' });
}

function serveStatic(req, res) {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (_) { p = '/'; }
  if (p.endsWith('/')) p += 'index.html';
  else if (!path.extname(p)) p += '.html';
  const file = path.normalize(path.join(DIST, p));
  const notFound = () => {
    const f404 = path.join(DIST, '404.html');
    fs.readFile(f404, (err, buf) => { res.writeHead(404, { 'Content-Type': MIME['.html'], ...SECURITY_HEADERS }); res.end(err ? 'Not found' : buf); });
  };
  if (!file.startsWith(DIST + path.sep)) return notFound();
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound();
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600', ...SECURITY_HEADERS });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const url = (req.url || '').split('?')[0];
    if (url === '/api/contact') {
      if (req.method === 'POST') return handleContact(req, res).catch(err => { console.error(err); send(res, 500, { ok: false, error: 'Server error.' }); });
      return send(res, 405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST' });
    }
    if (url === '/api/health') return send(res, 200, { ok: true, deliveryConfigured: deliveryConfigured() });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { ok: false });
    serveStatic(req, res);
  });
}

module.exports = { handleContact, createServer, validate, deliveryConfigured, resetRateLimit: () => hits.clear() };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => {
    console.log(`VICORA running on http://localhost:${port}`);
    console.log(deliveryConfigured() ? 'Lead delivery: configured (untested until you send a test enquiry).' : 'Lead delivery: NOT configured. Form submissions will return 503 and will not be delivered.');
  });
}
