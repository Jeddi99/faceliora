# Faceliora — R12 bilingual multipage frontend

- Branch: `feat/round12-home-refresh`
- Candidate: `faceliora-local-r12-refresh-v1-candidate-1`
- Based on: round 7 multipage site (already on `main`)

## What changed since round 7

- **Language entry:** `/` sends visitors to `/th/` or `/en/` from the browser's language setting. Visitors can still switch language manually. No IP or location lookup.
- **Brand intro (Warm paper):** a short cream-background intro with the centred wordmark plays on the Home page. It has a Skip control, respects reduced motion, and the page still works if the script fails.
- **Home refresh replay:** reloading the Thai or English Home page plays the intro again. Ordinary navigation, detail pages, language switching and Back/Forward do not replay it.

Everything else (five page types in Thai and English, four offers, simulated link manager, `noindex`) is unchanged from round 7.

## Run locally

Requires Python 3 and a browser. No build step.

```sh
git clone --branch feat/round12-home-refresh --single-branch https://github.com/Jeddi99/faceliora.git
cd faceliora
python3 -m http.server 8771 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:8771/ (language is chosen automatically), or go straight to `/th/` or `/en/`. The simulated link manager is at `/admin/`. The hosting document root is **`site`**.

## Verification and limits

The team's QA and CTO checked this candidate locally: Thai/English Home reload replay, no replay on other navigation, first-paint without flashes, reduced motion, script failure and no network sends. `SOURCE_MANIFEST.json` lists the exact copied runtime files and hashes. Private test reports and screenshots are kept locally and are not published here; this is not a CI result.

Known limits:
- Clicking Skip with a mouse closes the intro immediately, but keyboard focus does not move to the main content (same as round 11). Keyboard Skip works.
- Tested on desktop Chrome. Other browsers, physical phones and full screen-reader passes are not certified.
- The link manager is a simulation: no backend, login, trials or real download links.
- Preview images are illustrations and do not guarantee treatment results.
