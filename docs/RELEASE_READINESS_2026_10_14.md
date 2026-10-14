# SAS Initial Release Reconciliation — 14 October 2026

## GitHub branches
- `main`: existing baseline, does not contain the new briefing/media workflows yet.
- `feature/daily-briefing-v1`: cumulative integration branch (originally +55 commits over main when first inspected; more commits since).
- `feature/news-card-studio-v1`: separate historical 48-commit branch, containing Studio source which was explicitly ported to the integration branch. **Do not blindly merge its entire divergent history**. The integration branch contains the functioning target files; preserve historical branch until post-release cleanup.

## Source-of-truth contract
- Front-end public dossiers/issues/events read `sas_public_directory` and relations from Supabase; none invented in React.
- Public daily briefing `/briefings` reads `sas_public_briefing_latest`; only approved-and-published editions with published developments enter its returned payload.
- Editorial `/briefings/preview` is restricted to active SAS team, and consumes `sas_briefing_editorial_preview`.
- Studio `/studio` has client canvas rendering and draft upload to private Storage.
- Media page `/admin/media` reads/writes team-authorized Storage and registration RPCs.
- Server card generator `/api/studio-render` requires authenticated user + active editor/admin role. It does not provide a plugin/MCP endpoint or OAuth yet.
- There is currently **no verified direct ChatGPT-to-SAS authenticated MCP connection**. The private plugin exists as an editorial skill package but does not yet call live render/save tools.

## Production DB status (14 Oct assessment)
- Existing published: 1 dossier, 1 issue, 1 approved/public event and 2 published developments.
- Editorial staging: 3 newly entered issues, 3 events, 30 source-linked developments as drafts; briefing dated 13 October is a draft (10 selected items).
- Published briefing editions: 0.
- Actual uploaded media: 0.
- All image storage is private and defaults to pending rights.
- Public empty-state is intentional; do not make the draft issue visible by changing its status arbitrarily.

## DB migrations applied
Last previously applied: `sas_media_briefing_preview_v1`.
New: `sas_public_briefing_latest_v1`.
Source migrations for these live changes are checked into `docs/database/`.

## Shipping blockers
1. Vercel project creation on team `team_A3RMThYayP4lneKmGDEJT8BK` returned HTTP 403 forbidden. This is an account permission issue. **No Vercel project/deployment has been created by this release session.**
2. The new Next app has **not passed CI/production build yet**; create PR to execute `npm run lint` and `npm run build`.
3. Cannot assert full authenticated frontend-backend E2E coverage without testing an actual login, asset upload, public read and scoped editorial operations.
4. Plugin needs a verified OAuth-capable MCP service deployed on an HTTPS origin and registered with the private plugin; do not use service-role secrets in chat or embed permanent operator tokens in URLs.
5. The briefing public page intentionally has an empty state until a legally and editorially approved edition is published.
6. Original photos, credits and licenses not yet provisioned; do not insert example stock imagery as real event photos.

## Release gate
- GitHub PR CI green (TypeScript + production build).
- Vercel rights for selected team confirmed; create a **`saas`** Next.js project linked to `dinobahkam-wq/SAS`, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using an enabled publishable key.
- Verify deploy health, anonymous query behavior (public only), signed-in team page, image upload, card generation, and RLS access.
- Merge after CI and manual review. Deploy production from approved `main`.
- Never publish unapproved draft content or unlicensed assets to meet a launch date.
