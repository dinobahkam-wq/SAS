# Briefing DB V1 — implementation checkpoint

**Status:** SQL migration is committed for review, NOT applied to Supabase production.

## Existing schema verified
Project `nrmwshoytmzcmureetjb` already has `sas.events`, `sas.developments`, `sas.development_sources`, `sas.sources`, `sas.team_members` and `sas.audit_log`. `sas.developments.id` is UUID and its editorial status is managed separately. `sas.team_members` identifies authenticated editorial members.

## V1 review migration
File: `docs/database/briefing_db_v1_review.sql`

- `sas.briefing_editions`: one calendar edition, unique date and slug, exact coverage window, checked-at, opening synopsis, analytical text, watchpoints, selection methodology, editorial state and publication provenance.
- `sas.briefing_items`: edition-to-development reference, lead/major/ledger placement and position, optional edition-specific title and contextual commentary. No duplicate development or placement position inside an edition.
- `sas.briefing_revisions`: versioned full JSON snapshot, change reason and author; future RPC must enforce append-only and snapshot capture.

All three tables enable RLS. Default direct grants to `anon`/`authenticated` are revoked; no public access is opened yet. Access must subsequently pass through separately reviewed RPCs.

## Pre-application review gates
1. Verify on a disposable Supabase branch/local test DB that the SQL parses and all constraints, FK references and indexes work.
2. Review ownership, identity sequence naming, RLS, grants, and privilege model in the target project; confirm no default grants override intended policy.
3. Add explicit management RPCs gated by active `sas.team_members` roles; forbid publication when evidence or approval is incomplete.
4. Add public read-only RPCs restricted to `published` editions and published/approved underlying developments. Define whether a published edition is allowed to retain links to development records later withdrawn.
5. Implement transactional revision snapshots when modifying a published edition; correction notices and immutable snapshot rules must be enforced on the database side.
6. Integrate admin UI and public edition/archive pages, test lifecycle; only then request approval to apply the production migration.

## Explicit exclusions
- No new Supabase project or new auth system.
- No imaginary/demo stories inserted into the production database.
- No direct writes to existing events/developments/sources.
- No production publishing, public read policy, or API endpoint enabled by this change.
- No merge to `main` until tests and approval.

## Shop PC test
```powershell
cd D:\SAS-WEB
git pull --ff-only origin feature/daily-briefing-v1
npm run lint
```

The SQL is a review artifact, not a script to paste into the production SQL editor yet.
