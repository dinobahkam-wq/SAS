# SAS RLS policy inventory (reference, not executable)

Captured 2026/10/11 from live Supabase. Check actual privileges/triggers separately; this file is not a security certification.

## sas.audit_log / audit_staff_read
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'reviewer'::text])`
- WITH CHECK: `—`

## sas.claim_sources / staff_delete_claim_sources
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.claim_sources / staff_insert_claim_sources
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.claim_sources / staff_read_claim_sources
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.claim_sources / staff_update_claim_sources
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.claims / staff_delete_claims
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.claims / staff_insert_claims
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.claims / staff_read_claims
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.claims / staff_update_claims
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.control_assessments / staff_delete_control_assessments
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.control_assessments / staff_insert_control_assessments
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.control_assessments / staff_read_control_assessments
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.control_assessments / staff_update_control_assessments
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.development_sources / staff_delete_development_sources
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.development_sources / staff_insert_development_sources
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.development_sources / staff_read_development_sources
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.development_sources / staff_update_development_sources
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.developments / staff_delete_developments
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.developments / staff_insert_developments
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.developments / staff_read_developments
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.developments / staff_update_developments
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.documents / staff_delete_documents
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.documents / staff_insert_documents
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.documents / staff_read_documents
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.documents / staff_update_documents
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.dossier_issues / staff_delete_dossier_issues
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.dossier_issues / staff_insert_dossier_issues
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.dossier_issues / staff_read_dossier_issues
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.dossier_issues / staff_update_dossier_issues
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.dossiers / staff_delete_dossiers
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.dossiers / staff_insert_dossiers
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.dossiers / staff_read_dossiers
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.dossiers / staff_update_dossiers
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.entities / staff_delete_entities
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.entities / staff_insert_entities
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.entities / staff_read_entities
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.entities / staff_update_entities
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_documents / staff_delete_event_documents
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.event_documents / staff_insert_event_documents
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_documents / staff_read_event_documents
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.event_documents / staff_update_event_documents
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_entities / staff_delete_event_entities
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.event_entities / staff_insert_event_entities
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_entities / staff_read_event_entities
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.event_entities / staff_update_event_entities
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_issues / staff_delete_event_issues
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.event_issues / staff_insert_event_issues
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_issues / staff_read_event_issues
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.event_issues / staff_update_event_issues
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_places / staff_delete_event_places
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.event_places / staff_insert_event_places
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_places / staff_read_event_places
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.event_places / staff_update_event_places
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_relations / staff_delete_event_relations
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.event_relations / staff_insert_event_relations
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.event_relations / staff_read_event_relations
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.event_relations / staff_update_event_relations
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.events / staff_delete_events
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.events / staff_insert_events
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.events / staff_read_events
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.events / staff_update_events
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.glossary_revisions / staff_delete_glossary_revisions
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.glossary_revisions / staff_insert_glossary_revisions
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.glossary_revisions / staff_read_glossary_revisions
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.glossary_revisions / staff_update_glossary_revisions
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.glossary_terms / staff_delete_glossary_terms
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.glossary_terms / staff_insert_glossary_terms
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.glossary_terms / staff_read_glossary_terms
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.glossary_terms / staff_update_glossary_terms
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.issues / staff_delete_issues
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.issues / staff_insert_issues
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.issues / staff_read_issues
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.issues / staff_update_issues
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.places / staff_delete_places
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.places / staff_insert_places
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.places / staff_read_places
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.places / staff_update_places
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.publication_revisions / staff_delete_publication_revisions
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.publication_revisions / staff_insert_publication_revisions
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.publication_revisions / staff_read_publication_revisions
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.publication_revisions / staff_update_publication_revisions
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.publications / staff_delete_publications
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.publications / staff_insert_publications
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.publications / staff_read_publications
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.publications / staff_update_publications
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.sources / staff_delete_sources
- Command: DELETE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text])`
- WITH CHECK: `—`

## sas.sources / staff_insert_sources
- Command: INSERT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `—`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.sources / staff_read_sources
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text, 'reviewer'::text, 'researcher'::text])`
- WITH CHECK: `—`

## sas.sources / staff_update_sources
- Command: UPDATE; permissive: PERMISSIVE; roles: {authenticated}
- USING: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`
- WITH CHECK: `sas.has_team_role(ARRAY['admin'::text, 'editor'::text])`

## sas.team_members / team_members_self_read
- Command: SELECT; permissive: PERMISSIVE; roles: {authenticated}
- USING: `(user_id = auth.uid())`
- WITH CHECK: `—`
