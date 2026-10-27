/* VICORA front-end behaviour. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // dynamic copyright year
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // ---------- full-screen video intro (home, once per session) ----------
  var intro = $('#intro'), root = document.documentElement, site = $('.site');
  if (intro && root.classList.contains('intro-on')) {
    var vid = $('.intro-video', intro);
    if (vid) {
      // pick the portrait cut on phones / tall screens, landscape otherwise
      var tall = window.matchMedia && window.matchMedia('(max-aspect-ratio: 1/1)').matches;
      var key = tall ? 'portrait' : 'landscape';
      vid.poster = vid.getAttribute('data-' + key + '-poster');
      if (!reduce) {
        vid.preload = 'auto'; vid.src = vid.getAttribute('data-' + key);
        var pr = vid.play(); if (pr && pr.catch) pr.catch(function () { /* autoplay blocked: poster stays */ });
      }
    }
    if (site) { site.setAttribute('inert', ''); site.setAttribute('aria-hidden', 'true'); }
    var markSeen = function () { try { sessionStorage.setItem('vicora_intro_seen', '1'); } catch (e) { } };
    var closeIntro = function () {
      markSeen();
      if (site) { site.removeAttribute('inert'); site.removeAttribute('aria-hidden'); }
      intro.classList.add('is-leaving');
      setTimeout(function () { root.classList.remove('intro-on'); intro.classList.remove('is-leaving'); if (vid) vid.pause(); }, reduce ? 0 : 700);
      var h = $('#main h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    };
    $('.intro-enter', intro).addEventListener('click', closeIntro);
    $$('a', intro).forEach(function (a) { a.addEventListener('click', markSeen); });
    intro.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') return closeIntro();
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button', intro); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    intro.setAttribute('tabindex', '-1'); setTimeout(function () { intro.focus({ preventScroll: true }); }, 50);
  }

  // mobile nav
  var toggle = $('.nav-toggle'), nav = $('#site-nav');
  if (toggle && nav) {
    var setOpen = function (o) { nav.classList.toggle('open', o); toggle.setAttribute('aria-expanded', o); toggle.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); } });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  }

  // hero workflow visualisation (illustrative, purely visual)
  var viz = $('[data-viz]');
  if (viz) {
    var stages = $$('.stage', viz), idx = 0;
    var show = function (i) {
      stages.forEach(function (s, n) { s.classList.toggle('active', n === i); s.classList.toggle('done', n < i); });
      var st = stages[i], top = st.offsetTop + st.offsetHeight / 2 - 5;
      viz.style.setProperty('--pulse-y', top + 'px');
    };
    if (reduce) { stages.forEach(function (s) { s.classList.add('done'); }); stages[3].classList.add('active'); }
    else {
      viz.classList.add('live'); show(0);
      setInterval(function () { idx = (idx + 1) % stages.length; show(idx); }, 2200);
      window.addEventListener('resize', function () { show(idx); });
    }
  }

  // before/after tabs
  var ba = $('[data-ba]');
  if (ba) {
    var tabs = $$('[role=tab]', ba);
    var select = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0]; if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }

  // ---------- Opportunity finder (rule-based) ----------
  var fform = $('#finder-form');
  if (fform) {
    var data = null, out = $('#finder-result'), ferr = $('#finder-error');
    var load = fetch('/finder-data.json').then(function (r) { return r.json(); }).then(function (d) { data = d; })
      .catch(function () { data = null; });
    var label = function (qid, val) {
      var q = data.questions.filter(function (x) { return x.id === qid; })[0];
      var o = q.options.filter(function (x) { return x[0] === val; })[0]; return o ? o[1] : val;
    };
    fform.addEventListener('submit', function (ev) {
      ev.preventDefault();
      load.then(function () {
        ferr.hidden = true;
        if (!data) { ferr.textContent = 'The finder could not load its rules. Please reload the page, or contact us directly.'; ferr.hidden = false; return; }
        var fd = new FormData(fform), a = { business: fd.get('business'), task: fd.get('task'), freq: fd.get('freq'), goal: fd.get('goal'), tools: fd.getAll('tools') };
        var missing = [];
        if (!a.business) missing.push('business type'); if (!a.task) missing.push('main repetitive task');
        if (!a.freq) missing.push('how often it occurs'); if (!a.goal) missing.push('desired result');
        if (missing.length) { ferr.textContent = 'Please answer: ' + missing.join(', ') + '. (Tools are optional.)'; ferr.hidden = false; return; }
        var t = data.tasks[a.task];
        var toolsTxt = a.tools.length ? a.tools.map(function (k) { return data.toolNames[k]; }).join(', ') : 'None selected';
        var extraInteg = a.tools.length ? 'Your selected tools (' + toolsTxt + ') should be checked for API or export support.' : 'Tell us which tools you use so we can check what they connect to.';
        var summary = 'Opportunity finder selections (rule-based, not an AI analysis)\n' +
          '- Business: ' + label('business', a.business) + '\n- Main repetitive task: ' + label('task', a.task) + '\n- Tools: ' + toolsTxt +
          '\n- Frequency: ' + label('freq', a.freq) + '\n- Desired result: ' + label('goal', a.goal) + '\n- Suggested starting point: ' + t.title;
        var list = function (arr, tag) { return '<' + tag + '>' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</' + tag + '>'; };
        out.innerHTML =
          '<span class="badge badge-muted">Rule-based suggestion</span>' +
          '<h3>' + esc(t.title) + '</h3>' +
          '<p class="rule-note">This suggestion comes from predefined rules matched to your answers. No AI model has analysed your business, and nothing has been sent to VICORA.</p>' +
          '<p>' + esc(data.freqNote[a.freq]) + ' ' + esc(data.goalNote[a.goal]) + '</p>' +
          '<h4>A possible workflow</h4>' + list(t.workflow, 'ol') +
          '<h4>Integrations to investigate</h4>' + list(t.integrations, 'ul') + '<p class="result-note">' + esc(extraInteg) + '</p>' +
          '<h4>Limitations and human approval points</h4>' + list(t.limits, 'ul') +
          '<div class="btn-row"><a class="btn btn-primary" id="finder-cta" href="/contact.html?service=' + encodeURIComponent(t.service) + '#form">Discuss This Workflow With VICORA</a></div>';
        out.hidden = false;
        $('#finder-cta').addEventListener('click', function () {
          try { sessionStorage.setItem('vicora_finder', JSON.stringify({ service: t.service, summary: summary })); } catch (e) { /* storage unavailable; the service is still passed via the URL */ }
        });
        out.focus(); out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  // ---------- Contact form ----------
  var form = $('#contact-form');
  if (form) {
    var status = $('#form-status'), btn = $('#submit-btn'), label0 = $('.btn-label', btn).textContent, busy = false;
    var endpoint = form.getAttribute('data-endpoint'), fallbackEmail = form.getAttribute('data-email');
    var fields = ['name', 'email', 'company', 'website', 'industry', 'service', 'description', 'frequency', 'contactMethod'];

    // prefill from URL + finder
    var params = new URLSearchParams(location.search), svc = params.get('service');
    if (svc && $('#service option[value="' + svc.replace(/[^a-z]/g, '') + '"]')) $('#service').value = svc.replace(/[^a-z]/g, '');
    try {
      var f = JSON.parse(sessionStorage.getItem('vicora_finder') || 'null');
      if (f && f.summary) {
        if (f.service && !svc && $('#service option[value="' + f.service + '"]')) $('#service').value = f.service;
        var box = $('#finder-context');
        box.innerHTML = '<strong>Your finder answers will be included with this enquiry.</strong><br>' + esc(f.summary).replace(/\n/g, '<br>');
        box.hidden = false;
        var d = $('#description'); if (!d.value) d.value = 'I would like to discuss this possible workflow.\n\n' + f.summary;
      }
    } catch (e) { /* ignore */ }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var setErr = function (id, msg) {
      var el = $('#' + id), er = $('#' + id + '-error'); if (!el || !er) return;
      if (msg) { er.textContent = msg; er.hidden = false; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', id + '-error'); }
      else { er.hidden = true; el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
    };
    var validate = function () {
      var v = function (id) { return (form.elements[id].value || '').trim(); }, errs = {};
      if (!v('name')) errs.name = 'Please enter your full name.';
      if (!v('email')) errs.email = 'Please enter your business email.'; else if (!emailRe.test(v('email'))) errs.email = 'Please enter a valid email address, e.g. name@company.com.';
      if (!v('company')) errs.company = 'Please enter your company or agency name.';
      if (v('website') && !/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v('website'))) errs.website = 'Please enter a valid website, e.g. example.com.';
      if (!v('industry')) errs.industry = 'Please choose your industry.';
      if (!v('service')) errs.service = 'Please choose a service.';
      if (v('description').length < 10) errs.description = 'Please describe the task or problem (at least 10 characters).';
      if (!form.elements.consent.checked) errs.consent = 'Please confirm you agree to us using your information to respond.';
      return errs;
    };
    ['name', 'email', 'company', 'website', 'industry', 'service', 'description', 'consent'].forEach(function (id) {
      var el = form.elements[id];
      el.addEventListener('blur', function () { if (el.value || id === 'consent') { var e = validate(); setErr(id, e[id]); } });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) { var e = validate(); setErr(id, e[id]); } });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid')) { var e = validate(); setErr(id, e[id]); } });
    });

    var mailto = function (payload) {
      if (!fallbackEmail) return '';
      var body = fields.map(function (k) { return k + ': ' + (payload[k] || ''); }).join('\n');
      return 'mailto:' + fallbackEmail + '?subject=' + encodeURIComponent('Website enquiry from ' + (payload.company || payload.name)) + '&body=' + encodeURIComponent(body);
    };
    var show = function (kind, html) { status.className = 'form-status ' + kind; status.innerHTML = html; status.hidden = false; };
    var setBusy = function (b) {
      busy = b; btn.disabled = b; btn.setAttribute('aria-busy', b);
      $('.btn-label', btn).innerHTML = b ? '<span class="spinner" aria-hidden="true"></span> Sending…' : label0;
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) return; // prevent duplicate submissions
      var errs = validate(), first = null;
      ['name', 'email', 'company', 'website', 'industry', 'service', 'description', 'consent'].forEach(function (id) { setErr(id, errs[id]); if (errs[id] && !first) first = id; });
      if (first) { show('error', '<p><strong>Please fix the highlighted fields and try again.</strong></p>'); form.elements[first].focus(); return; }

      var payload = {};
      fields.forEach(function (k) { payload[k] = (form.elements[k].value || '').trim(); });
      payload.consent = true; payload.company_url = form.elements.company_url.value; // honeypot
      payload.page = location.pathname;
      try { var f2 = JSON.parse(sessionStorage.getItem('vicora_finder') || 'null'); if (f2 && f2.summary && payload.description.indexOf(f2.summary) === -1) payload.finderSummary = f2.summary; } catch (e) { }

      setBusy(true); show('loading', '<p>Sending your enquiry…</p>');
      var ctrl = ('AbortController' in window) ? new AbortController() : null, timer = setTimeout(function () { ctrl && ctrl.abort(); }, 15000);
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j && j.ok === true, status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.ok) {
            try { sessionStorage.removeItem('vicora_finder'); } catch (e) { }
            form.reset(); $('#finder-context').hidden = true;
            show('success', '<p><strong>Thank you. Your enquiry was received.</strong></p><p>We will reply to ' + esc(payload.email) + ' after reviewing your description.</p>');
          } else { throw res; }
        })
        .catch(function (res) {
          var msg, st = res && res.status;
          if (st === 400 && res.body && res.body.errors) { Object.keys(res.body.errors).forEach(function (k) { setErr(k, res.body.errors[k]); }); msg = 'Some details need fixing. Please check the highlighted fields.'; }
          else if (st === 429) msg = 'Too many submissions from your connection. Please wait a little and try again.';
          else if (st === 503) msg = 'Our form delivery is not set up yet, so your message was <strong>not</strong> delivered.';
          else msg = 'We could not send your enquiry, so it was <strong>not</strong> delivered. Please check your connection and try again.';
          var mt = mailto(payload);
          show('error', '<p>' + msg + '</p>' + (st === 400 ? '' : (mt ? '<p>You can email us instead: <a href="' + esc(mt) + '">open an email with your details filled in</a>.</p>' : '<p>No contact email has been configured for this site yet. Your details are still in the form so you can try again.</p>')));
          status.focus();
        })
        .then(function () { clearTimeout(timer); setBusy(false); if (status.className.indexOf('success') > -1 || status.className.indexOf('error') > -1) status.focus(); });
    });
  }
})();
