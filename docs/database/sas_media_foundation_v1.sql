-- SAS media foundation. Private Storage; public visibility only after approval.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('sas-media','sas-media',false,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do nothing;
create table sas.media_assets(
 id uuid primary key default gen_random_uuid(),
 storage_path text not null unique check (storage_path ~ '^[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$'),
 original_filename text,
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
 byte_size bigint check(byte_size between 1 and 10485760),
 width integer check(width>0),height integer check(height>0),
 sha256 text check(sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
 alt_ar text not null check(char_length(trim(alt_ar)) between 8 and 500),
 caption_ar text not null default '',
 creator_name text,
 source_name text not null,
 source_url text,
 license_name text not null,
 license_url text,
 attribution_ar text not null default '',
 taken_at timestamptz,
 geographic_note text,
 media_kind text not null default 'archival' check(media_kind in ('documentary','archival','illustrative','graphic')),
 rights_status text not null default 'pending' check(rights_status in ('pending','approved','rejected','expired')),
 verification_status text not null default 'pending' check(verification_status in ('pending','verified','disputed')),
 editorial_note text not null default '',
 created_by uuid references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint media_approval_requires_identity check (rights_status <> 'approved' or (approved_by is not null and approved_at is not null and verification_status='verified'))
);
create table sas.media_links(
 id uuid primary key default gen_random_uuid(),
 asset_id uuid not null references sas.media_assets(id) on delete restrict,
 event_id uuid references sas.events(id) on delete cascade,
 development_id uuid references sas.developments(id) on delete cascade,
 briefing_edition_id uuid references sas.briefing_editions(id) on delete cascade,
 display_role text not null check(display_role in ('hero','card','gallery','document')),
 position integer not null default 1 check(position>0),
 caption_override_ar text,
 created_at timestamptz not null default now(),
 constraint media_one_target check(num_nonnulls(event_id,development_id,briefing_edition_id)=1),
 constraint media_unique_link unique nulls not distinct(asset_id,event_id,development_id,briefing_edition_id,display_role)
);
create index media_links_event on sas.media_links(event_id) where event_id is not null;
create index media_links_dev on sas.media_links(development_id) where development_id is not null;
create index media_links_briefing on sas.media_links(briefing_edition_id) where briefing_edition_id is not null;
alter table sas.media_assets enable row level security;
alter table sas.media_links enable row level security;
revoke all on sas.media_assets,sas.media_links from public,anon,authenticated;
-- Storage remains private; no anonymous object access and no client-side upload permission.
commit;