# SAS MEDIA OPERATOR V1 — deployed 2026-10-13

## Production database implemented
- Private Supabase Storage bucket `sas-media`, 10 MB/file, JPEG/PNG/WebP/AVIF allowed.
- `sas.media_assets`: image provenance, caption, Arabic alt text, license, creator, factual/archival/illustrative type, verification and rights states.
- `sas.media_links`: joins assets to an event, development or briefing edition; role hero/card/gallery/document.
- Authenticated team storage policies for upload/read, admin-only delete.
- Role-gated RPCs: `sas_media_register`, `sas_media_editor_list`, `sas_media_link_draft`, `sas_media_editor_briefing`.
- All assets default to `rights_status=pending`, `verification_status=pending`. No public media read is exposed.

## Feature branch UI
- `/admin/media`: upload actual licensed files via authenticated user's browser, capture provenance and rights; list files and attach a hero image to a **draft** briefing.
- `/briefings/preview`: authenticated-editor only; if hero linked, fetch a time-limited signed URL from the private bucket and show image with its caption.
- `/admin`: link to media library.
- No fictional image URLs.
- No public image publication is enabled; public media delivery is conditional on later editorial approval.

## ChatGPT as executive editor
Workflow contract:
1. Agent researches article and image candidates, enumerates source URL, image source, author, place/date, license and whether image is documentary/archival/illustrative.
2. Editor (human) explicitly approves editorial facts and media usage.
3. Agent can write source/asset metadata and relationships through Supabase tools; actual bytes require available Storage upload-capable connector/API, or editor uploading once via `/admin/media`.
4. After full rights + factual review and approval, publish through a separately reviewed admin workflow; log changes and verify public view.
5. Never silently promote pending rights into approved or publish unidentified/borrowed newswire photos.

## Required next tasks for full operator rollout
- Test `npm run lint` and upload/list/link/preview end-to-end locally (current turn has not run local compile).
- Add metadata approval RPC with active reviewer/admin and audit log; add publication RPCs and immutable publication versioning.
- Add public image-delivery path only for rights-approved and verified media linked to published content, with caching/resize.
- Implement image identification/licensing retrieval and automated upload connector if available.
- Add signed upload server-side pipeline for automation and automated caption/alt suggestions (human review required).
- Link imagery to article cards and per-development details after public-approval workflow is established.
- No photos currently stored; layout displays them only after upload.
