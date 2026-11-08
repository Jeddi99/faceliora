# Faceliora

Responsive Thai/English landing page based on the approved Faceliora B design.

## Run locally

Requires Python 3. No package installation or compilation is needed.

```sh
git clone https://github.com/Jeddi99/faceliora.git
cd faceliora
python3 -m http.server 8765 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:8765/ for Thai, or http://127.0.0.1:8765/?lang=en for English. Use the language buttons to switch. Stop the server with Ctrl+C.

## Source

- `site/index.html` — semantic single-page content and concept diagrams.
- `site/style.css` — responsive visual styles, including keyboard-focus correction.
- `site/app.js` — language selection and pending-action behavior.
- `site/assets/` — local fonts, attribution and font licenses.

No framework, backend, remote stylesheet, cookies or analytics are required. The page uses locally bundled fonts. Font licenses are included alongside their files; no application license is granted by those font licenses.

## Current delivery status

The local implementation passed independent QA re-review and CTO verification. This does not mean it is production-ready or tested on every browser/device. Safari, physical iPhone and VoiceOver testing remain outstanding.

- Product diagrams are labeled concepts, not real app captures or treatment results.
- Consumer actions point to https://www.doodee.app/.
- Clinic demo/trial controls are intentionally unavailable and do not submit or save data.
- Consumer price figures are draft baselines; entitlements, billing/taxes and platform details remain to be validated.
- App Store availability, Clinic pricing/trial terms/contact destinations and legal/privacy content remain unresolved.
- The page retains `noindex,nofollow` for review. Production URLs, localized SEO, real imagery and release authorization are separate work.

This repository contains website source and local-run instructions. Internal task handoffs, approval records, generated screenshots/review artifacts and local tooling are intentionally not published. No deployment workflow is configured by this commit.
