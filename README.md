# Faceliora — selected A, full-page design preview

Branch: `design/r5-a-preview` · Artifact: `ux-round-5-a-v1`.

This branch stores the **UX/UI mockup**, expanded from the owner's R4-A / Quiet cinema selection. It is not an independently QA-approved implementation, final design approval, or release. Runtime files in `site/` are byte-for-byte copies of the delivered UX artifact. The existing `main` branch and the separate, locally edited `feat/landing-a-clinic-trust` workspace are not replaced by this source push.

## View locally

```sh
git clone --branch design/r5-a-preview --single-branch https://github.com/Jeddi99/faceliora.git
cd faceliora
python3 -m http.server 8770 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:8770/ (Thai) or http://127.0.0.1:8770/?lang=en (English). Stop with Ctrl+C. No dependencies/build step required.

## Contents

- `site/index.html` — full-page hero, audience split, consumer workflow, Clinic/Scan, draft consumer prices, limitations/FAQ, closing and footer.
- `site/style.css` — selected photographic Quiet cinema visual direction and responsive layout.
- `site/preview.js` — language preview and non-submitting pending Clinic controls.
- `site/assets/` — local photo derivatives, fonts, credits/provenance and font licenses.

The page retains `noindex,nofollow`. It uses illustrative stock interiors, not real product captures, patients, treatment outcomes or a clinic owned by the product team. Consumer links point to https://www.doodee.app/. Clinic demo/trial actions are pending and do not submit/save information. No lead form, checkout, analytics or backend is present.

Prices and commercial terms, entitlements, iPhone availability/link, Clinic destinations/trial/pricing, real product imagery, legal/privacy/contact and production SEO remain unresolved. Designer checks are not independent implementation QA or WCAG certification. Safari, physical iPhone and VoiceOver are untested.

## Source-only branch

`vercel.json` at repository root and under `site/` disables automatic Vercel Git deployment for **this branch only**, per `git.deploymentEnabled`. This covers either repository-root or `site` Root Directory setups. No production/root-directory/domain setting is changed. Do not merge these branch-specific files blindly or treat this branch as release authorization.

Internal team conversations, task handoffs, approval records, raw review evidence and generated screenshots/ZIPs are not uploaded. Font licenses cover their own assets, not the application as a whole.
