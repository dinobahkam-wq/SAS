# SAS MCP Operator V1 — Private editorial connection

## Implementation on feature/daily-briefing-v1
- Route: POST `/mcp` in Next.js (stateless JSON-RPC 2.0 over HTTP).
- Authentication: Supabase editor/admin bearer JWT on every request. Anonymous and inactive team members denied.
- Methods: `initialize`, `ping`, `tools/list`, `tools/call`, `notifications/initialized`.
- Tools:
  1. `sas_render_card`: `preview` yields MCP image content with rendered PNG; `save` stores PNG in private SAS Storage and creates an unpublished asset in `sas.media_assets`.
  2. `sas_link_draft_media`: attaches existing asset to exactly one draft briefing, event or development without publishing it.
- Endpoint reuses role-checked `/api/studio-render` and `sas_media_link_draft` RPC.
- No API service-role key, no anonymous writes, no arbitrary remote image fetching.

## Explicit boundaries
- This is a server-side MCP implementation, **not yet a connected and verified ChatGPT plugin**.
- The private plugin `SAS Operator Private` remains a skill package without remote MCP binding.
- Supabase JWT used here is a *user session credential*, not a stable MCP OAuth grant. A production ChatGPT integration requires a supported OAuth 2.1 authorization server or a supported platform authorization mechanism, including secure token issuance and rotation. Do not paste JWTs into chats or commit them into plugin files.
- Current implementation handles stateless JSON responses; before plugin registration, verify protocol compatibility with the intended MCP host, including content negotiation, schema strictness, and CORS/auth discovery as applicable.
- Returns private image preview inline in the authenticated MCP response, not a public URL. Do not expose unreviewed graphics publicly.
- Tool descriptions and server-side checks are not equivalent to the editor's approval; no publishing action exists in this MCP server.

## Release dependencies
1. Vercel project `saas` not yet provisioned: Vercel returned HTTP 403 on create_project.
2. Merge only after successful CI and manual review.
3. Configure production `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel.
4. Verify public published-only site read and private editorial roles, then verify MCP initialize/list/call using a short-lived authorized user session in a secure test environment.
5. Bind HTTPS `https://<real-domain>/mcp` to the *existing* private plugin after OAuth/auth compatibility is implemented and connection verified. Never invent a deployed URL or report a connected plugin before it is tested.
