# Studio → Media Library integration (2026-10-13)

## Implemented on feature/daily-briefing-v1
- Ported existing Studio V3-C.3 from its separate feature branch, including `/api/studio-logo` and studio styles.
- Preserved existing PNG export and canvas rendering.
- Added **Save PNG to SAS Media Library** to the Studio controls.
- Canvas-to-PNG Blob, authenticated Supabase Storage private bucket `sas-media`, and `sas_media_register` RPC record a new `sas.media_assets` row.
- Captures explicit media source, optional source URL, license/permission declaration, creator, caption and descriptive alt text.
- Always registers with pending verification and pending rights; no publish side effects.
- Added cross-navigation `/admin/media` → `/studio`.

## Current restrictions
- Supports one rendered PNG page per save. Multi-page designs can still be downloaded manually.
- Editor must be signed in via `/admin` and have active admin/editor membership.
- Upload size maximum 10MB. Other assets embedded in the design (e.g., outside photographs) require permission and clear sourcing; user-entered license text is not itself verification.
- If uploaded object succeeds but metadata RPC fails, UI reports the storage path for administrative cleanup; atomic storage+DB transaction not available from frontend.
- Saved media is private and available in `/admin/media`; to connect as briefing hero, use library's draft link form.
- This is a **browser-assisted authoring integration**, not yet a direct ChatGPT API/connector-operated render job. To automate rendering from ChatGPT without browser involvement, a server-side render queue with authenticated operator actions, signed uploads, and review gates is still required.

## Required user test
1. On shop PC: pull branch, run `npm run lint`, launch Next.js.
2. Login to `/admin`.
3. Open `/studio`, prepare a single-page card and enter actual source/rights details.
4. Press Save to media library, check the success message and UUID.
5. Open `/admin/media` and verify the entry is private and marked pending.
6. Optionally link the asset to a draft briefing from the library. Confirm image appears only in internal `/briefings/preview`.
7. On failure, copy the exact console/server output. No main branch merge or public publish.

## Security
No service-role key in the browser. Authenticated user JWT is used with RLS-protected Storage, and metadata writes go through the team-role gated `public.sas_media_register` RPC. Media cannot be publicly distributed until subsequent rights and publication review.
