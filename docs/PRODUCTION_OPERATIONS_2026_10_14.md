# SAS production operations — 14 October 2026

## What is actually live
- The real project is `bhkms-projects/sas` on Vercel; first production URL `https://sas-olive-five.vercel.app`. Keep the distinction between production, preview and the GitHub feature branch.
- Source of truth: Supabase project `nrmwshoytmzcmureetjb`. A saved design was verified in `sas.media_assets`, asset ID `c7a27d8e-10dd-49ab-9994-0a4c72772609`, with rights and verification both **pending**.
- At 14 Oct check: 1 media asset, 1 draft briefing, 0 published briefings. Never synthesize publishing history or relabel content as live.
- `GET /api/health` (new on integration branch) probes the Supabase public directory RPC using the publishable key; `200 status=ok` means backend read availability, not that drafts are approved or that write operations work. `503` means investigate. This endpoint returns no secrets.

## Editorial production contract
- Reports cite original sources and distinguish allegation, observation, analysis and forecast.
- Development/event/briefing status in database, not UI-local state, controls publication.
- Every uploaded image has its own creator, provenance, date/usage rights and verification status. A self-declared license string does not establish legal permission.
- Rendered graphics that have no source photo must be labeled as editorial designs, not documentary photography.
- Unknown licenses and unverified content remain internal drafts until a human editor reviews them.
- Publishing an approved record and publicly serving an attached image are two separate gates.
- No automatic publication from the private MCP operator.

## Deployment and release discipline
1. Check PR CI (typecheck and production build).
2. Deploy the integration branch to Preview, including the new `/api/health` route.
3. Verify `/api/health` reports `status:ok`, public pages display published-only DB records, and authenticated editor screens can read/write safely.
4. Verify server-side rendering and media registration in a real editor session. Include a negative unauthenticated test and role denied test.
5. Verify ChatGPT operator end-to-end connection only after an OAuth-compatible auth solution is provided; JWT bearer endpoints alone are insufficient.
6. Only after these pass, review/merge GitHub PR into `main`, then release production. Do not equate a successful build with production E2E correctness.

## Open operational blockers
- The ChatGPT Vercel connector still lacks full authorized project access, although listing the project works.
- Private SAS Operator plugin not yet bound through verified OAuth to the new MCP endpoint.
- Editorial image discovery and import with rights provenance is not implemented end-to-end.
- Production env values are configured but `/api/health` must be tested after this commit is deployed.
