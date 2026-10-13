# SAS Server Card Operator V1

Implemented on `feature/daily-briefing-v1`.

## Interface
`POST /api/studio-render` with JSON body and an `Authorization: Bearer <Supabase access token>` header.

Required: `title`, `source_name`, `license_name`.
Optional: `summary`, `eyebrow`, `date`, `source_url` (HTTPS), `creator_name`, `caption`, `theme` (`forest` or `ivory`), `format` (`square` 1080x1080, `landscape` 1200x675, `portrait` 1080x1350), `operation` (`preview` or `save`).

`preview` responds `image/png`, no database/storage mutation.
`save` renders PNG on the Next.js server, uploads into private `sas-media`, registers metadata via `sas_media_register` and returns JSON `{asset_id,storage_path,status:'pending',published:false}`.
A successful upload followed by failed metadata registration invokes best-effort cleanup.

## Auth and security
- Validates Supabase access token with `auth.getUser(token)`.
- Checks active team editorial role via `sas_admin_overview` (`admin` or `editor`).
- No service-role key is exposed and the upload/registration remain protected by existing storage RLS and RPC restrictions.
- Remote photographs, arbitrary URLs, arbitrary HTML, and user-specified fonts are **not** included in server rendering; this reduces licensing and SSRF exposure.
- The generated graphic is **not proof** of factual accuracy. Rights registration defaults to pending and publication remains a separate human-approved task.

## Editorial test interface
`/admin/media` includes a simple title/summary/theme/size form with **Preview PNG** and **Save to Library** buttons, so it can be tested without a ChatGPT connector.

## Important limitations
- This is a new *server-side template*, not byte-for-byte parity with the full browser Canvas Studio V3-C.3. Exact font fidelity, text shaping (especially Arabic), line breaks and logo placement require visual validation and possibly locally bundled font files.
- ChatGPT **does not yet have a connected Plugin/MCP action** that can directly call this authenticated endpoint with an appropriate token. Completing agent-operated rendering requires an OAuth-capable private connector and explicit, constrained operator permissions; never paste a long-lived service-role secret into chat.
- This endpoint is not automatically deployed because work remains on a feature branch.
- No successful TypeScript build or runtime image test has been established by this change. Test locally before production.

## Test
```powershell
cd D:\SAS-WEB
git pull --ff-only origin feature/daily-briefing-v1
npm run lint
npx next dev --hostname 0.0.0.0 --port 3000
```
Sign in via `/admin`, open `/admin/media`, preview one title and save. Confirm one new private `sas.media_assets` row with pending rights.
