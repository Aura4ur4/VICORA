/* VICORA static site builder. Zero dependencies.
 * Usage: node build.js   -> writes ./dist
 * Config comes from environment variables (see .env.example). */
const fs = require('fs');
const path = require('path');
const C = require('./src/content');

// ---- load .env if present (build-time values only) ----
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (_) { /* no .env */ }

const cfg = {
  siteUrl: (process.env.SITE_URL || 'https://www.example.com').replace(/\/$/, ''),
  email: (process.env.CONTACT_EMAIL || '').trim(),
  instagram: (process.env.INSTAGRAM_URL || '').trim(),
  linkedin: (process.env.LINKEDIN_URL || '').trim(),
  endpoint: process.env.FORM_ENDPOINT || '/api/contact',
};

const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DIST = path.join(__dirname, 'dist');

// ============ COMPONENTS ============
const icons = {
  agent: '<path d="M12 3v3M5 9h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9z"/><circle cx="9.5" cy="14" r="1.2"/><circle cx="14.5" cy="14" r="1.2"/>',
  flow: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="18" r="2"/><path d="M7 6h4a3 3 0 0 1 3 3v0a3 3 0 0 0 3 3M7 18h4a3 3 0 0 0 3-3v0"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="m8 15 3-4 3 2 4-6"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const icon = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;

const wordmark = (cls = '') => `<span class="wordmark ${cls}"><svg class="wm-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7l9.2 18a1 1 0 0 0 1.8 0L25 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25" cy="7" r="3" fill="var(--accent)"/></svg><span class="wm-text">VICORA</span></span>`;

const button = (href, label, kind = 'primary', extra = '') => `<a class="btn btn-${kind}" href="${e(href)}" ${extra}>${e(label)}${kind === 'primary' ? icon('arrow', 'btn-icon') : ''}</a>`;
const heading = (eyebrow, title, sub = '', tag = 'h2') => `<div class="section-head">${eyebrow ? `<p class="eyebrow">${e(eyebrow)}</p>` : ''}<${tag}>${e(title)}</${tag}>${sub ? `<p class="lead">${e(sub)}</p>` : ''}</div>`;
const badge = (t, kind = '') => `<span class="badge ${kind}">${e(t)}</span>`;

const NAV = [['Home', '/index.html'], ['Services', '/services.html'], ['Solutions', '/solutions.html'], ['Industries', '/industries.html'], ['About', '/about.html'], ['Contact', '/contact.html']];

const header = current => `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="/index.html" aria-label="VICORA home">${wordmark()}</a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu"><span></span><span></span><span></span></button>
<nav id="site-nav" class="site-nav" aria-label="Main">
<ul>${NAV.map(([n, h]) => `<li><a href="${h}" ${h === current ? 'aria-current="page"' : ''}>${n}</a></li>`).join('')}</ul>
<a class="btn btn-primary btn-sm nav-cta" href="/contact.html#form">Get in touch</a>
</nav></div></header>`;

const socialItem = (name, url) => url ? `<li><a href="${e(url)}" rel="noopener noreferrer" target="_blank">${name}</a></li>` : `<li><span class="muted-item" title="Profile link not configured yet">${name} <small>(coming soon)</small></span></li>`;

const footer = () => `<footer class="site-footer"><div class="container">
<div class="footer-grid">
<div class="footer-brand">${wordmark()}<p>AI agents, intelligent automation and business systems that reduce busywork and help teams focus on growth.</p></div>
<nav aria-label="Footer navigation"><h2 class="footer-h">Navigate</h2><ul>${NAV.map(([n, h]) => `<li><a href="${h}">${n}</a></li>`).join('')}</ul></nav>
<nav aria-label="Footer services"><h2 class="footer-h">Services</h2><ul>${C.services.map(s => `<li><a href="/contact.html?service=${s.id}#form">${e(s.name)}</a></li>`).join('')}</ul></nav>
<div><h2 class="footer-h">Connect</h2><ul>
${cfg.email ? `<li><a href="mailto:${e(cfg.email)}">${e(cfg.email)}</a></li>` : '<li><span class="muted-item">Email <small>(address not configured yet)</small></span></li>'}
${socialItem('Instagram', cfg.instagram)}${socialItem('LinkedIn', cfg.linkedin)}
<li><a href="/privacy.html">Privacy Policy</a></li></ul></div>
</div>
<p class="copyright">© <span id="year">${new Date().getFullYear()}</span> VICORA. All rights reserved.</p>
</div></footer>`;

const serviceCard = s => `<article class="card service-card" id="service-${s.id}">
<div class="card-icon">${icon(s.icon)}</div>
<h3>${e(s.name)}</h3><p class="card-desc">${e(s.desc)}</p>
<ul class="check-list">${s.items.map(i => `<li>${icon('check')}<span>${e(i)}</span></li>`).join('')}</ul>
<a class="btn btn-ghost" href="/contact.html?service=${s.id}#form" data-service="${s.id}">Discuss This Solution${icon('arrow', 'btn-icon')}</a>
</article>`;

const processSection = () => `<section class="section" id="process"><div class="container">
${heading('How it works', 'A structured process, from first conversation to ongoing improvement.')}
<ol class="steps">${C.steps.map(s => `<li class="step"><span class="step-n">${s.n}</span><h3>${e(s.name)}</h3><p>${e(s.text)}</p></li>`).join('')}</ol>
</div></section>`;

const ctaBand = (title = 'Tell us what slows your business down.', sub = 'We\'ll explore where AI agents or automation could make your operations simpler.') => `<section class="section"><div class="container"><div class="cta-band"><div><h2>${e(title)}</h2><p>${e(sub)}</p></div>${button('/contact.html#form', 'Automate My Business')}</div></div></section>`;

const beforeAfter = () => `<section class="section" id="before-after"><div class="container">
${heading('Illustrative workflow', 'See what changes when reporting is automated.', 'Example: agency client reporting. This is an illustrative workflow, not a verified customer case study.')}
<div class="ba" data-ba>
<div class="tabs" role="tablist" aria-label="Workflow view">
<button role="tab" id="tab-manual" aria-selected="true" aria-controls="panel-manual" type="button">Manual workflow</button>
<button role="tab" id="tab-auto" aria-selected="false" aria-controls="panel-auto" tabindex="-1" type="button">Automated workflow</button></div>
<div class="tab-panel" role="tabpanel" id="panel-manual" aria-labelledby="tab-manual"><ol class="flow">${C.manualFlow.map(s => `<li class="flow-step"><span>${e(s)}</span></li>`).join('')}</ol>
<p class="ba-note">Several tools, repeated copying, and plenty of room for small errors.</p></div>
<div class="tab-panel" role="tabpanel" id="panel-auto" aria-labelledby="tab-auto" hidden><ol class="flow flow-auto">${C.autoFlow.map(([s, h]) => `<li class="flow-step ${h ? 'is-human' : ''}"><span>${e(s)}</span>${h ? badge('Human approval', 'badge-accent') : ''}</li>`).join('')}</ol>
<p class="ba-note">Repetitive steps are handled by the workflow; a person stays in control of what is sent.</p></div>
</div>
<div class="center">${button('/solutions.html#finder', 'Find Your First Automation Opportunity')}</div>
</div></section>`;

const finderSection = () => `<section class="section" id="finder"><div class="container">
${heading('Automation Opportunity Finder', 'Find where automation could start in your business.', 'Answer five quick questions. The suggestion below comes from transparent, predefined rules in your browser; no AI model analyses your answers and nothing is sent anywhere until you choose to contact us.')}
<div class="finder card">
<form id="finder-form" novalidate>
${C.finder.questions.map((q, i) => `<fieldset class="q"><legend><span class="q-n">${i + 1}</span>${e(q.label)}</legend><div class="options">${q.options.map(([v, l]) => `<label class="opt"><input type="${q.type}" name="${q.id}" value="${v}"><span>${e(l)}</span></label>`).join('')}</div></fieldset>`).join('')}
<p class="form-error" id="finder-error" role="alert" hidden></p>
<button class="btn btn-primary" type="submit">Show my suggestion${icon('arrow', 'btn-icon')}</button>
</form>
<div id="finder-result" class="finder-result" tabindex="-1" aria-live="polite" hidden></div>
</div></div></section>`;

// ---- Full-screen video intro (home page, once per session) ----
// Videos: public/intro.mp4 (landscape, desktop) and public/intro-portrait.mp4 (portrait, phones), each with a -poster.jpg still.
const INTRO_MENU = [['Services', '/services.html'], ['Solutions', '/solutions.html'], ['Industries', '/industries.html'], ['About', '/about.html'], ['Contact', '/contact.html#form']];
const igIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none"/></svg>';
const liIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.5c0-1.8 1.2-3 2.7-3s2.3 1 2.3 2.8V17"/></svg>';
const intro = () => {
  const soc = [['Instagram', cfg.instagram, igIcon], ['LinkedIn', cfg.linkedin, liIcon]].filter(([, u]) => u);
  return `<div id="intro" class="intro" role="dialog" aria-modal="true" aria-label="Welcome to VICORA">
<video class="intro-video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-landscape="/intro.mp4" data-landscape-poster="/intro-poster.jpg" data-portrait="/intro-portrait.mp4" data-portrait-poster="/intro-portrait-poster.jpg"></video>
<div class="intro-shade" aria-hidden="true"></div>
<div class="intro-inner">
<div class="intro-logo">${wordmark()}</div>
<nav aria-label="Intro menu"><ul class="intro-menu">${INTRO_MENU.map(([n, h]) => `<li><a href="${h}">${e(n)}</a></li>`).join('')}</ul></nav>
<button class="btn btn-primary intro-enter" type="button">Enter site</button>
${soc.length ? `<ul class="intro-social">${soc.map(([n, u, i]) => `<li><a href="${e(u)}" target="_blank" rel="noopener noreferrer" aria-label="VICORA on ${n}">${i}</a></li>`).join('')}</ul>` : ''}
</div></div>`;
};

// ============ PAGE SHELL ============
function page({ file, title, desc, body, jsonld = [], bodyClass = '', withIntro = false }) {
  const url = cfg.siteUrl + '/' + (file === 'index.html' ? '' : file);
  const ld = jsonld.concat([{ '@context': 'https://schema.org', '@type': 'Organization', name: 'VICORA', url: cfg.siteUrl + '/' }]);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<link rel="canonical" href="${e(url)}">
<meta name="theme-color" content="#0B0D10">
<meta property="og:type" content="website"><meta property="og:site_name" content="VICORA">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}">
<meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(cfg.siteUrl)}/og.png">
<meta property="og:image:alt" content="VICORA: Less Busywork. More Growth.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(desc)}"><meta name="twitter:image" content="${e(cfg.siteUrl)}/og.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/styles.css">
${withIntro ? '<script src="/intro-check.js"></script>' : ''}
${ld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head><body class="${bodyClass}">
${withIntro ? intro() : ''}
<div class="site">
${header('/' + file)}
<main id="main">${body}</main>
${footer()}
</div>
<script src="/app.js" defer></script>
</body></html>`;
}

// ============ PAGES ============
const pages = [];

// ---- Home ----
const heroViz = `<div class="viz" aria-label="Illustrative workflow: input, AI reasoning, automation, business outcome">
<div class="viz-head"><span class="dots"><i></i><i></i><i></i></span><span class="viz-title">Example workflow</span>${badge('Illustrative', 'badge-muted')}</div>
<ol class="viz-stages" data-viz>
${[['INPUT', 'New enquiry received', 'Form, email or chat message'], ['AI REASONING', 'Understand and classify', 'Proposed step: summarise request, suggest category'], ['AUTOMATION', 'Update tools', 'Create CRM record, notify the team'], ['BUSINESS OUTCOME', 'Ready for review', 'Draft follow-up waiting for human approval']].map(([k, t, d], i) => `<li class="stage" data-stage="${i}"><span class="stage-node">${i + 1}</span><div class="stage-card"><span class="stage-k">${k}</span><strong>${t}</strong><span class="stage-d">${d}</span></div><span class="stage-status" aria-hidden="true"></span></li>`).join('')}
</ol>
<p class="viz-note">Illustrative example only. This is not a live AI agent.</p></div>`;

pages.push({
  file: 'index.html', withIntro: true,
  title: 'VICORA | AI Agents & Business Automation for Agencies and Businesses',
  desc: 'VICORA designs custom AI agents, business process automation and data solutions that cut repetitive work and connect your tools. Less busywork, more growth.',
  body: `<section class="hero"><div class="container hero-grid">
<div class="hero-copy"><p class="announce">AI AGENTS · AUTOMATION · INTELLIGENT SYSTEMS</p>
<h1>Less Busywork.<br><span class="accent">More Growth.</span></h1>
<p class="lead">VICORA builds custom AI agents and intelligent workflows that help businesses automate repetitive tasks, connect their tools, and work smarter.</p>
<div class="btn-row">${button('/contact.html#form', 'Automate My Business')}${button('/services.html', 'Explore Our Solutions', 'ghost')}</div></div>
${heroViz}</div></section>

<section class="section" id="value"><div class="container">
${heading('Why automate', 'Your team should focus on growth, not repetitive work.')}
<div class="grid grid-3">${C.values.map((v, i) => `<article class="card value-card"><span class="value-n">0${i + 1}</span><h3>${e(v.title)}</h3><p>${e(v.text)}</p></article>`).join('')}</div>
</div></section>

<section class="section" id="services"><div class="container">
${heading('Services', 'AI agents, automation and data systems built around how you work.', 'Four focus areas, each scoped to your tools, your data and your approval rules.')}
<div class="grid grid-2">${C.services.map(serviceCard).join('')}</div>
</div></section>
${processSection()}
${beforeAfter()}
${ctaBand()}`,
});

// ---- Services ----
pages.push({
  file: 'services.html',
  title: 'AI Agents, Business Automation & Data Services | VICORA',
  desc: 'Custom AI agents, business process automation, agency automation and business data intelligence from VICORA. Connect your tools and remove repetitive work.',
  body: `<section class="page-hero"><div class="container">${heading('Services', 'AI agents and automation designed around your business.', 'Practical systems that connect to the tools you already use, with appropriate permissions and human oversight where it matters.', 'h1')}</div></section>
<section class="section tight"><div class="container"><div class="grid grid-2">${C.services.map(serviceCard).join('')}</div></div></section>
${processSection()}${ctaBand()}`,
});

// ---- Solutions ----
pages.push({
  file: 'solutions.html',
  title: 'AI Workflow Automation Solutions & Opportunity Finder | VICORA',
  desc: 'Explore how AI workflow automation could work in your business. Compare manual and automated workflows and try the VICORA Automation Opportunity Finder.',
  body: `<section class="page-hero"><div class="container">${heading('Solutions', 'From repetitive task to working workflow.', 'See an illustrative before-and-after, then use the finder to get a rule-based starting point for your own business.', 'h1')}</div></section>
${beforeAfter()}${finderSection()}${ctaBand()}`,
});

// ---- Industries ----
pages.push({
  file: 'industries.html',
  title: 'Industry Solutions: Agencies, E-commerce, Sales & Support | VICORA',
  desc: 'Proposed AI and automation use cases for marketing agencies, e-commerce, professional services, sales teams, customer support and operations.',
  body: `<section class="page-hero"><div class="container">${heading('Industries', 'Recognisable problems, practical automations.', '', 'h1')}
<p class="notice"><strong>Please note:</strong> every use case on this page is a <em>proposed</em> use case that we could scope with you. These are not descriptions of services already deployed for named customers.</p></div></section>
<section class="section tight"><div class="container"><div class="grid grid-2">${C.industries.map(i => `<article class="card industry-card"><div class="card-top"><h2 class="h3">${e(i.name)}</h2>${badge('Proposed use case', 'badge-muted')}</div>
<dl><dt>Common problem</dt><dd>${e(i.problem)}</dd><dt>Possible automation</dt><dd>${e(i.automation)}</dd><dt>Intended benefit</dt><dd>${e(i.benefit)}</dd></dl>
<a class="btn btn-ghost" href="/contact.html?service=${i.service}#form">Discuss This Solution${icon('arrow', 'btn-icon')}</a></article>`).join('')}</div></div></section>${ctaBand()}`,
});

// ---- About ----
pages.push({
  file: 'about.html',
  title: 'About VICORA | Practical AI Agents and Automation',
  desc: 'VICORA identifies business bottlenecks and designs practical solutions with AI agents, automation and data integrations, with human oversight and secure data handling.',
  body: `<section class="page-hero"><div class="container">${heading('About VICORA', 'We build systems that make businesses work smarter.', 'VICORA focuses on identifying business bottlenecks and designing practical solutions using AI agents, automation, and data integrations.', 'h1')}</div></section>
<section class="section tight"><div class="container"><div class="grid grid-3">${C.principles.map(([t, d]) => `<article class="card"><h2 class="h3">${e(t)}</h2><p>${e(d)}</p></article>`).join('')}</div></div></section>
${processSection()}${ctaBand()}`,
});

// ---- Contact ----
const sel = (id, label, opts, req, extra = '') => `<div class="field"><label for="${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label><select id="${id}" name="${id}" ${req ? 'required aria-required="true"' : ''} ${extra}>${opts}</select><p class="field-error" id="${id}-error" hidden></p></div>`;
const inp = (id, label, type, req, extra = '') => `<div class="field"><label for="${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label><input id="${id}" name="${id}" type="${type}" ${req ? 'required aria-required="true"' : ''} ${extra}><p class="field-error" id="${id}-error" hidden></p></div>`;

pages.push({
  file: 'contact.html',
  title: 'Contact VICORA | Discuss AI Agents and Automation for Your Business',
  desc: 'Tell VICORA what slows your business down. We will explore where AI agents or workflow automation could make your operations simpler.',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: C.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  body: `<section class="page-hero"><div class="container">${heading('Contact', 'Tell us what slows your business down.', 'We\'ll explore where AI agents or automation could make your operations simpler.', 'h1')}</div></section>
<section class="section tight" id="form-section"><div class="container contact-grid">
<div class="card form-card" id="form">
<div id="finder-context" class="finder-context" hidden></div>
<form id="contact-form" novalidate data-endpoint="${e(cfg.endpoint)}" data-email="${e(cfg.email)}">
<div class="form-grid">
${inp('name', 'Full name', 'text', true, 'autocomplete="name" maxlength="120"')}
${inp('email', 'Business email', 'email', true, 'autocomplete="email" maxlength="200"')}
${inp('company', 'Company or agency name', 'text', true, 'autocomplete="organization" maxlength="160"')}
${inp('website', 'Website (optional)', 'text', false, 'autocomplete="url" inputmode="url" placeholder="example.com" maxlength="200"')}
${sel('industry', 'Industry', '<option value="">Select your industry</option>' + ['Marketing / creative agency', 'E-commerce', 'Professional services', 'Sales', 'Customer support', 'Operations / administration', 'Technology / SaaS', 'Other'].map(o => `<option>${o}</option>`).join(''), true)}
${sel('service', 'Service of interest', '<option value="">Select a service</option>' + C.serviceOptions.map(o => `<option value="${o.id}">${e(o.name)}</option>`).join(''), true)}
</div>
<div class="field"><label for="description">Describe the repetitive task or business problem <span class="req" aria-hidden="true">*</span></label><textarea id="description" name="description" rows="5" required aria-required="true" maxlength="3000"></textarea><p class="field-error" id="description-error" hidden></p></div>
<div class="form-grid">
${sel('frequency', 'Estimated monthly frequency of the task', '<option value="">Not sure / skip</option><option>Under 20 times a month</option><option>20 to 100 times a month</option><option>100 to 500 times a month</option><option>More than 500 times a month</option>', false)}
${sel('contactMethod', 'Preferred contact method', '<option value="email">Email</option><option value="call">Phone call</option><option value="video">Video call</option><option value="whatsapp">WhatsApp / message</option>', false)}
</div>
<div class="hp" aria-hidden="true"><label for="company_url">Leave this field empty</label><input id="company_url" name="company_url" type="text" tabindex="-1" autocomplete="off"></div>
<div class="field consent"><label class="check"><input type="checkbox" id="consent" name="consent" required aria-required="true"><span>I agree that VICORA may use the information I submit to respond to my enquiry and discuss possible solutions. Details are in the <a href="/privacy.html">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span></label><p class="field-error" id="consent-error" hidden></p></div>
<div id="form-status" class="form-status" role="status" aria-live="polite" tabindex="-1" hidden></div>
<button class="btn btn-primary" type="submit" id="submit-btn"><span class="btn-label">Send enquiry</span></button>
<p class="fine">Fields marked * are required. Please do not include passwords or confidential customer data.</p>
</form></div>
<aside class="side"><div class="card"><h2 class="h3">What happens next</h2><ol class="mini-steps"><li>We read your description.</li><li>We reply to ask clarifying questions.</li><li>If it looks like a fit, we scope a possible workflow with you.</li></ol></div>
<div class="card"><h2 class="h3">Prefer email?</h2>${cfg.email ? `<p><a href="mailto:${e(cfg.email)}">${e(cfg.email)}</a></p>` : '<p class="muted">A public email address has not been configured yet. Use the form for now.</p>'}</div></aside>
</div></section>
<section class="section" id="faq"><div class="container narrow">${heading('FAQ', 'Straight answers to common questions.')}
<div class="faq">${C.faq.map(([q, a]) => `<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join('')}</div></div></section>`,
});

// ---- Privacy ----
pages.push({
  file: 'privacy.html',
  title: 'Privacy Policy | VICORA',
  desc: 'How VICORA collects, uses and protects information submitted through this website.',
  body: `<section class="page-hero"><div class="container">${heading('Legal', 'Privacy Policy', '', 'h1')}</div></section>
<section class="section tight"><div class="container narrow prose">
<p class="notice"><strong>Draft for review.</strong> This policy describes how the site is built to work. Have it reviewed by a qualified legal adviser and complete the bracketed details before publishing.</p>
<h2>Who we are</h2><p>This website is operated by VICORA. [Add registered business name and contact details here.]</p>
<h2>What we collect</h2><p>When you use the contact form we collect the details you enter: name, business email, company, optional website, industry, service of interest, a description of your task or problem, estimated frequency and preferred contact method. If you use the Automation Opportunity Finder and choose to contact us, your selections are added to the form so we can read them.</p>
<p>The Opportunity Finder runs in your browser using predefined rules. Your answers are not sent to us unless you submit the contact form.</p>
<h2>How we use it</h2><p>We use submitted information to respond to your enquiry and to discuss possible solutions. We do not sell personal information.</p>
<h2>Who receives it</h2><p>Form submissions are delivered to VICORA through the email or workflow service configured for this site. [List the specific providers in use, for example your email delivery provider or CRM.]</p>
<h2>Retention</h2><p>[State how long enquiries are kept.] You can ask us to delete your enquiry at any time.</p>
<h2>Your rights</h2><p>Depending on where you live, you may have rights to access, correct or delete your personal information. [Add the contact method for privacy requests.]</p>
<h2>Security</h2><p>The form is sent to a server-side endpoint with input validation and rate limiting. Credentials for delivery services are kept on the server and are never included in the website code. No method of transmission is perfectly secure, so please avoid sending passwords or sensitive customer data in the form.</p>
<h2>Cookies and analytics</h2><p>This site does not set tracking cookies by default. [Update this section if you add analytics.] Fonts are loaded from Google Fonts, which may receive your IP address.</p>
<h2>Changes</h2><p>We may update this policy and will change the date below when we do.</p>
<p class="muted">Last updated: [add date]</p>
</div></section>`,
});

// ---- 404 ----
pages.push({
  file: '404.html',
  title: 'Page not found | VICORA',
  desc: 'The page you are looking for could not be found.',
  body: `<section class="page-hero"><div class="container center"><p class="eyebrow">404</p><h1>This page could not be found.</h1><p class="lead">The link may be out of date. Try one of these instead.</p>
<div class="btn-row center-row">${button('/index.html', 'Back to home')}${button('/contact.html#form', 'Contact us', 'ghost')}</div></div></section>`,
});

// ============ WRITE ============
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
copyDir(path.join(__dirname, 'public'), DIST);

// finder data is embedded via a JSON file loaded by app.js
fs.writeFileSync(path.join(DIST, 'finder-data.json'), JSON.stringify(C.finder));
for (const p of pages) fs.writeFileSync(path.join(DIST, p.file), page(p));

const indexable = pages.filter(p => p.file !== '404.html');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(p => `  <url><loc>${cfg.siteUrl}/${p.file === 'index.html' ? '' : p.file}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages to dist/ (siteUrl=${cfg.siteUrl}, email ${cfg.email ? 'set' : 'NOT set'})`);
