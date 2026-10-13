# SAS REAL NEWS CONTENT — Editorial import, 13 October 2026

## Database changes already made (production Supabase project nrmwshoytmzcmureetjb)
- Reused pre-existing `sas.dossiers.slug = yemeni-crisis`.
- Created 3 **draft** issues: military-escalation-2026, regional-security-yemen, civilian-humanitarian-impact.
- Created 3 **draft** events: houthi-strikes-saudi-oct-2026, west-coast-taiz-oct-2026, yemen-humanitarian-oct-2026.
- Created 10 **draft / in_review** developments for each event (30 total), with one source association each. These are distinct reported claims, actions or observations; **not** all independent incidents, and **not** all occurring on 13 October.
- Added 1 `sas.briefing_editions` draft, dated 2026-10-13, with 10 selected items, commentary, watchpoints and coverage limits.
- Applied reviewed schema and draft-management SQL migrations and a new `public.sas_briefing_editorial_preview(date)` member-only RPC.
- Replaced `/briefings/preview` fake stories with the live authenticated editorial preview. Removed `briefing-compact.tsx` containing demo items and illustration URLs.

## Editorial evidence
- Saudi airports: Reuters 8/11/12 October; AP 13 October.
- West coast and Taiz: UN special envoy briefings of 10 Sep and 9 Oct; AP Taiz report 13 Oct.
- Humanitarian: IOM figures via Reuters (11 Oct), UN Geneva 2 Oct, AP on Taiz.

Sources and URLs are stored in `sas.sources` and linked through `sas.development_sources`.

## Verification caveats
- Records contain sourced *reports and attributed statements*, not a completed independent verification. All new developments remain `editorial_status=draft`, `verification_status=in_review`.
- The number 10 per event measures editorial records, not ten distinct armed incidents. Several are subordinate decisions or field observations from one report.
- The daily briefing contains contextual developments from prior dates and is **not** a claim that every linked event occurred within the daily coverage window.
- Numbers regarding victims may vary between agencies and updates; reconcile against original agency / official records before publishing.
- This preview intentionally has no news photographs until reusable image licensing, original author/caption and provenance are verified. The previous decorative remote image assets have been removed.
- Public routes still show approved/published data only. Accessing the new edition preview requires an authenticated active editorial team member.
- None of this has been merged to `main`. The live database *was* changed in accordance with the user's explicit request.
- TypeScript and live browser checks on the shop computer are still required; do not claim CI verified the code.

## Operational steps
1. Open `/briefings/preview` locally with an authorized editorial login. Verify each article and source.
2. Check the 30 developments against original sources, timestamps, names, geography and quotations.
3. Gather and approve correctly licensed photos; store copies and attribution metadata with a documented image workflow.
4. Implement a role-gated publication workflow for the briefing and dependent events/developments, including mandatory revision snapshots.
5. Only after approval, show this edition on a public permanent URL and in the home feed.

## Editor access
The existing `/admin/briefings` UI uses the draft-management RPCs; `/briefings/preview` is a restricted read-only editorial preview of 13 October.
