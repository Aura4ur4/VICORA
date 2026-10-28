# Starboy Labs website

Premium marketing site for Starboy Labs (AI agents, business automation, data intelligence).
Seven pages plus a custom 404, shared header/footer, rule-based "Automation Opportunity Finder", and a contact form backed by a small server endpoint. **No runtime dependencies** (Node 18+ only).

```
build.js            Static site builder (components + pages) -> dist/
src/content.js      ALL copy and finder rules (edit text here)
public/             styles.css, app.js, favicon, og.png/og.svg (copied to dist/)
server.js           Serves dist/ and POST /api/contact (validation, rate limit, delivery)
test/test.js        Automated checks (npm test)
.env.example        Every configurable value
```

## Look and feel

- **Style:** warm off-white background with subtle grain, rounded black-outlined frames, wide display type (Unbounded), lowercase techno labels (Krona One) and Inter for body text. All fonts are self-hosted in `public/fonts` under the SIL Open Font License (`OFL-fonts.txt`).
- **Home hero:** the giant split "Starboy Labs" heading with the central sculpture `public/img/hero-star.webp`. To use a photo instead (for example a cut-out model shot), replace that file with a transparent WebP or PNG of the same name.
- **"New" card:** `public/img/card-bubble.webp`, which links to the Opportunity Finder.
- **Colours:** tokens at the top of `public/styles.css` (`--bg`, `--ink`, `--accent` and so on).

## Deploying on Vercel

Use **Application Preset: Other** and set the Root Directory to the folder that contains `package.json`. `vercel.json` sets the build command and output directory, `api/contact.js` handles the form, and environment variables go in Vercel's project settings.

## 1. Run it

```bash
cp .env.example .env      # then edit values (never commit .env)
npm run build             # generates dist/
npm start                 # builds, then serves http://localhost:3000
npm test                  # build + 18 automated checks
```

## 2. Configure environment variables

| Variable | When read | Purpose |
|---|---|---|
| `SITE_URL` | build | Canonical URLs, Open Graph, sitemap. **Set to your real domain before launch.** Default is a placeholder. |
| `CONTACT_EMAIL` | build | Shown in the footer and used for the form's `mailto:` fallback. Empty = not shown. |
| `INSTAGRAM_URL`, `LINKEDIN_URL` | build | Empty = shown as "coming soon" text, not links. |
| `FORM_ENDPOINT` | build | Where the browser posts. Default `/api/contact`. |
| `PORT`, `TRUST_PROXY`, `ALLOWED_ORIGIN` | runtime | Port; set `TRUST_PROXY=true` behind a proxy/CDN so rate limiting sees real IPs; optional origin allow-list. |
| `RESEND_API_KEY`, `LEAD_TO_EMAIL`, `LEAD_FROM_EMAIL` | runtime | Option A delivery (Resend). The sender must be a verified domain/address in Resend. |
| `LEAD_WEBHOOK_URL` | runtime | Option B delivery: any service that accepts a JSON POST (Zapier, Make, n8n, Slack, a CRM). |

Build-time values are baked into `dist/`, so re-run `npm run build` after changing them. Secrets (`RESEND_API_KEY`, webhook URL) are read only by `server.js` and never reach the browser.

## 3. Connect the contact form

1. Set **one or both** delivery options above and start the server.
2. Visit `/api/health`. `deliveryConfigured: true` only means variables are present, not that delivery works.
3. **Send a real test enquiry** through the form and confirm it arrives.

Behaviour you can rely on:
- Success is shown only when the server returns `201` after delivery succeeded.
- No delivery configured → server returns `503`; the page says the message was **not** delivered and offers a pre-filled `mailto:` link (if `CONTACT_EMAIL` is set). Leads are never silently discarded.
- Delivery provider fails → `502` and an error message. Validation errors → `400` with per-field messages.
- Protections: server-side validation, 20 KB body limit, 5 requests per 15 min per IP (in-memory; use a shared store if you run several instances), hidden honeypot field, security headers incl. CSP, optional origin check.

Hosting the pages statically (Netlify, Vercel, etc.) without `server.js`? Set `FORM_ENDPOINT` to a serverless function or form service URL that accepts the same JSON and returns `{"ok":true}` with a 2xx status.

## 4. Update brand links and contact details

- Email / social links: set the env vars and rebuild.
- Text, services, FAQ, industries, finder rules: edit `src/content.js`.
- Colours: CSS variables at the top of `public/styles.css`.
- Privacy Policy: `build.js` (privacy page). It is a **draft**. Fill the bracketed items and have it reviewed by a legal adviser.
- Social image: replace `public/og.png` (1200x630).

## 5. Deploy

Any Node 18+ host (Render, Railway, Fly.io, a VPS): build command `npm run build`, start command `node server.js`, set the environment variables in the host's dashboard, and put it behind HTTPS (set `TRUST_PROXY=true` if a proxy terminates TLS). For pure static hosting, deploy `dist/` and point `FORM_ENDPOINT` at a form backend (see above).

## 6. Status: what is and is not connected

| Item | Status |
|---|---|
| Pages, navigation, anchors, finder, before/after, form validation | Built and tested (automated + headless-browser run) |
| Contact API logic (validation, 503/502/429/413, honeypot, webhook delivery to a local test receiver) | Tested locally |
| **Resend email delivery** | **Not configured and not tested** (needs your API key and verified sender) |
| **Production webhook / CRM** | **Not configured** |
| Contact email, Instagram, LinkedIn | **Placeholders until you supply real values** |
| `SITE_URL` | **Placeholder** (`https://www.example.com`) |
| Analytics, cookie banner | Not included (none needed as shipped; revisit if you add tracking) |
| Privacy Policy wording | Draft, needs legal review |

Content notes: no customer logos, testimonials, certifications, or savings figures are used. The hero visual, before/after and finder are labelled illustrative / rule-based; no live AI agent runs on the site. Fonts load from Google Fonts (mentioned in the privacy draft); self-host Inter if you prefer zero third-party requests.
