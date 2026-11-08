# Faceliora — round7 multipage implementation snapshot

- Branch: `feat/round7-multipage`
- Candidate: `faceliora-local-r7-v1-candidate-1`
- Approved design baseline: `ux-round-7-four-offers-v1`

This is the **implemented local frontend**, not the older single-page design preview. Independent team QA accepted this candidate within its local scope. Final CTO verification is still pending at the time of this source snapshot. This push does not authorize or perform production publication, deployment, live backend setup or trial/license activation.

## Run locally

Requires Python 3 and a browser. No package installation or build step is needed.

```sh
git clone --branch feat/round7-multipage --single-branch https://github.com/Jeddi99/faceliora.git
cd faceliora
python3 -m http.server 8770 --bind 127.0.0.1 --directory site
```

Open:
- Thai: http://127.0.0.1:8770/th/
- English: http://127.0.0.1:8770/en/
- Review launcher: http://127.0.0.1:8770/
- Simulated link manager: http://127.0.0.1:8770/admin/

Stop the server with Ctrl+C. If port 8770 is busy, choose a different free port. For a future separately authorized static host, the serving/document root is **`site`**, not the repository root. No hosting settings are changed by this branch.

## Included frontend

- Five genuine page types in Thai and English: Home, For-you, Clinic, Pricing and FAQ.
- Four distinct offers: DooDee web, DooDee mobile, Faceliora iPhone 3D scanner and DooDeeClinic desktop.
- Real document navigation, current-page locale switching, responsive menu/dropdown, FAQ and reduced-motion behavior.
- A separate **simulated** link-management screen: edit/validation/preview/unsaved changes/mock save. Drafts exist only in current-page memory and reset on refresh. It is not a secured admin, shared database or publishing service.
- Local images/fonts, font licenses, image attribution and inherited license evidence.

The runtime files are copied unchanged from the QA-reviewed candidate. Source-only metadata sidecars and redundant historical usage manifests are omitted; `SOURCE_MANIFEST.json` identifies the exact copied subset. The only additions around the candidate are this README, source manifest and branch-specific Vercel deployment controls. No framework migration or new application behavior is introduced by packaging.

## Local verification and limitations

Team QA independently accepted the original candidate after build/static/JS and browser checks, including both languages, navigation, menu/FAQ interaction, admin simulation, reduced motion, no-JS and no-send boundaries. Private test reports, machine-specific test harnesses, owner approvals and generated screenshots are retained locally and **not published** in this repository snapshot. This branch publishes a directly runnable static source selection, not the private evidence/test workspace; those QA results are not a claim that a GitHub CI workflow ran.

Two approved English text-density advisories remain. Safari, Firefox, physical iPhone, VoiceOver/full assistive technology, production performance, medical accuracy and live service readiness are not certified by this snapshot. The candidate launcher retains its historical pre-QA status text; this README states the later source-snapshot status without modifying reviewed runtime bytes.

## Non-live boundaries

All public pages remain `noindex,nofollow`. The web destination is https://www.doodee.app/. Unverified mobile/scanner/desktop download, demo and trial destinations remain pending and do not initiate requests or downloads. A desired 30-day clinic trial is not an implemented license or activation service.

Consumer 2D front/45/90 views are not rotatable 3D. The scanner creates models; desktop consumes them. Simulation is not diagnosis or a treatment guarantee. Web price examples remain provisional and do not establish prices/entitlements for other platforms. Clinic photos are illustrative stock interiors, not real product captures, patients or our own clinic. See `site/assets/sources.json` and the photo-license evidence; fonts retain their SIL OFL texts.

No live login, backend, shared persistence, payments, patient records, analytics, uploads, installer hosting or publishing endpoint is included. Production origin/SEO migration/redirects, compatibility, terms, legal/contact and service links still need separate decisions and authorization.

## Source-only push / no automatic deployment intended

`vercel.json` at repository root and under `site/` adds `git.deploymentEnabled["feat/round7-multipage"] = false`, preserving the existing branch rule. This is narrowly scoped to suppress Vercel Git-triggered deployment of this branch for either known serving-root arrangement. It does not change the Vercel project, domain, production branch or default branch. Configuration presence is not a claim of an independently verified hosting event.

No merge, force-push, production deploy or repository visibility change is part of this source push. Keep final review and release approval separate.
