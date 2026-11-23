# Forest Academy Website: Security & Maintenance Guide

## Before going live (one-time)
- [ ] Rename your logo file to `logo.png` and place it beside `index.html`.
- [ ] Create a form at formspree.io (or similar), paste its URL in `CONFIG.formEndpoint` in `script.js`. Until then, forms run in demo mode and send nothing.
- [ ] Upload either `_headers` (Netlify/Cloudflare) or `.htaccess` (Apache/cPanel). Upload `.well-known/security.txt`.
- [ ] Enable HTTPS (free via Let's Encrypt/Cloudflare) and turn on "Always use HTTPS".
- [ ] Turn on two-factor authentication for hosting, domain registrar, email and Formspree accounts.
- [ ] Use unique strong passwords from a password manager; give each staff member their own login.

## Audit schedule
| When | Task |
|---|---|
| Weekly | Submit a test enquiry; confirm it arrives. Check the site loads over HTTPS. |
| Monthly | Run `npm run audit`. Scan the URL at https://observatory.mozilla.org and https://securityheaders.com (target grade A). Review who has hosting/domain access. |
| Quarterly | Run `npm run audit:lighthouse`. Check domain/SSL expiry dates. Test restoring a backup. Update the year in `security.txt` if near expiry. |
| After any change | Re-run `npm run audit:html`; view the page in the browser console for CSP errors. |

## Rules for safe changes
1. Keep a copy of the site in Git (GitHub private repo) so every change is tracked and reversible.
2. No inline `<script>`, `onclick=` or `style=""` in HTML: the CSP blocks them. Put code in `script.js`, styles in `style.css`.
3. Any new external service (maps, analytics, fonts) must be added to the CSP in `index.html`, `_headers` and `.htaccess`, otherwise the browser blocks it.
4. External links that open in a new tab need `rel="noopener noreferrer"`.
5. Never put passwords, API secrets or child records in site files. Only public form endpoint URLs belong in `script.js`.
6. Child/parent data (applications) is personal data: restrict who can read the inbox, delete old enquiries, and don't forward them over WhatsApp groups.

## If something goes wrong
Change hosting, email and registrar passwords; restore the last clean Git version; check the host's access logs; tell parents if their data was exposed.

## Known limits
Client-side checks (validation, honeypot, cooldown) only reduce spam. Real rate-limiting, spam filtering and storage security come from your form service and host. Add reCAPTCHA/hCaptcha/Turnstile through that service if spam continues.

## Hosting on GitHub Pages
- GitHub Pages cannot send custom HTTP headers, so `_headers` and `.htaccess` are ignored there. The CSP `<meta>` tag in `index.html` is your protection; it cannot set `frame-ancestors` (anti-clickjacking). Moving the same files behind Cloudflare or Netlify later restores full headers.
- Keep `.nojekyll` in the repo root so the `.well-known` folder is published.
- Settings > Pages > tick **Enforce HTTPS**. Turn on 2FA for your GitHub account.
- Settings > Branches: protect `main` (require pull requests) once more than one person edits.
- The repo is public on free plans: never commit secrets or applicant data. The Formspree URL is safe to be public.
- The workflow in `.github/workflows/audit.yml` runs on each push and every Monday; check the Actions tab for failures.
