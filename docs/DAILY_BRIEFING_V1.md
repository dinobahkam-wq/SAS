# Briefing V1 — Phase 1 (preview)

## Decision
Build the Yemeni daily briefing as a responsive, archive-ready **web edition**. Its public editorial promise is: *What changed in Yemen, and why does it matter?*

## Delivered on feature/daily-briefing-v1
- /briefings/preview: self-contained newspaper-inspired preview (overview, main changes, wider geographic ledger, interpretation, methodology).
- Mobile/desktop reading styles and print stylesheet.
- Feature-branch navigation link for local visual review.
- All example entries are explicitly placeholders, NOT verified reporting, and the page must never be presented as a published edition.
- No writes to production Supabase, no migrations, no changes to main.
- Branch is based on **main**, and thus deliberately does not include the separate work-in-progress news-studio branch.

## Verified pre-existing data model
Supabase schema sas holds dossiers, issues, events, developments, sources and development_sources; admin RPCs in public enforce existing editorial controls. These are reusable building blocks, but an edition is not yet modeled as a standalone persistent record.

## Next package (after preview approval)
1. Design a **reviewable SQL migration, without executing it** for `sas.briefing_editions` and `sas.briefing_items` referencing existing developments, with edition number, start/end of time window, verification timestamp, editorial status, executive summary, analysis, watchpoints, method and versioning.
2. Build a secured editor linked to existing authenticated admin roles; never write publicly from an anonymous browser.
3. Public RPC for published editions only, with carefully reviewed grants and RLS.
4. Replace placeholder content with published edition data; add archive and permanent slugs.
5. Add version tracking/corrections, source traceability, regional coverage review and editorial criteria.
6. Only then add printable PDF export and automated distribution.

## Acceptance checklist
- `npm run lint` and `npm run build` as capacity allows.
- Verify /briefings/preview on the user's shop PC D:\\SAS-WEB and a narrow mobile viewport.
- Check newspaper hierarchy, readability, contrast, heading wrapping, printed layout, navigation and placeholder disclosure.
- No merge to main or production database change without approval.
