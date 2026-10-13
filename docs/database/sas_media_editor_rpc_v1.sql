-- SAS Media operator interface: auditable authenticated uploads, no public files.
begin;
create policy sas_media_private_upload on storage.objects for insert to authenticated
with check(bucket_id='sas-media' and exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active and t.role in ('admin','editor')));
create policy sas_media_private_read on storage.objects for select to authenticated
using(bucket_id='sas-media' and exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active));
create policy sas_media_private_remove on storage.objects for delete to authenticated
using(bucket_id='sas-media' and exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active and t.role='admin'));
create or replace function public.sas_media_register(
 p_storage_path text,p_original_filename text,p_mime_type text,p_byte_size bigint,
 p_alt_ar text,p_caption_ar text,p_source_name text,p_source_url text,
 p_license_name text,p_license_url text,p_creator_name text,p_media_kind text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active and t.role in ('admin','editor'))
 then raise exception 'غير مصرح' using errcode='42501';end if;
 if p_storage_path is null or p_storage_path !~ '^[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$'
 or p_storage_path not like auth.uid()::text||'/%'
 or char_length(trim(coalesce(p_alt_ar,'')))<8
 or char_length(trim(coalesce(p_source_name,'')))<3
 or char_length(trim(coalesce(p_license_name,'')))<3
 then raise exception 'بيانات الوسائط غير مكتملة';end if;
 if not exists (select 1 from storage.objects o where o.bucket_id='sas-media' and o.name=p_storage_path)
 then raise exception 'الملف غير مرفوع إلى المخزن الخاص';end if;
 insert into sas.media_assets(storage_path,original_filename,mime_type,byte_size,alt_ar,caption_ar,source_name,source_url,license_name,license_url,creator_name,media_kind,created_by)
 values(p_storage_path,p_original_filename,p_mime_type,p_byte_size,p_alt_ar,coalesce(p_caption_ar,''),p_source_name,p_source_url,p_license_name,p_license_url,p_creator_name,coalesce(p_media_kind,'archival'))
 returning id into v_id;
 return v_id;
end $$;
create or replace function public.sas_media_editor_list()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active)
 then raise exception 'غير مصرح' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'path',a.storage_path,'alt',a.alt_ar,'caption',a.caption_ar,'source',a.source_name,'license',a.license_name,'rights',a.rights_status,'verification',a.verification_status,'kind',a.media_kind,'created_at',a.created_at) order by a.created_at desc) from (select * from sas.media_assets order by created_at desc limit 100) a),'[]'::jsonb);
end $$;
create or replace function public.sas_media_link_draft(
 p_asset_id uuid,p_edition_id uuid,p_development_id uuid,p_event_id uuid,p_display_role text,p_position integer
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active and t.role in ('admin','editor'))
 then raise exception 'غير مصرح' using errcode='42501';end if;
 if num_nonnulls(p_edition_id,p_development_id,p_event_id)<>1 then raise exception 'يجب تحديد هدف ربط واحد';end if;
 if not exists(select 1 from sas.media_assets where id=p_asset_id) then raise exception 'الوسيط غير موجود';end if;
 if p_edition_id is not null and not exists(select 1 from sas.briefing_editions where id=p_edition_id and status='draft') then raise exception 'الإحاطة ليست مسودة';end if;
 if p_development_id is not null and not exists(select 1 from sas.developments where id=p_development_id and editorial_status='draft') then raise exception 'التطور ليس مسودة';end if;
 if p_event_id is not null and not exists(select 1 from sas.events where id=p_event_id and editorial_stage='draft') then raise exception 'الحدث ليس مسودة';end if;
 insert into sas.media_links(asset_id,briefing_edition_id,development_id,event_id,display_role,position)
 values(p_asset_id,p_edition_id,p_development_id,p_event_id,p_display_role,p_position)
 returning id into v_id;
 return v_id;
end $$;
revoke all on function public.sas_media_register(text,text,text,bigint,text,text,text,text,text,text,text,text) from public,anon;
revoke all on function public.sas_media_editor_list() from public,anon;
revoke all on function public.sas_media_link_draft(uuid,uuid,uuid,uuid,text,integer) from public,anon;
grant execute on function public.sas_media_register(text,text,text,bigint,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.sas_media_editor_list() to authenticated;
grant execute on function public.sas_media_link_draft(uuid,uuid,uuid,uuid,text,integer) to authenticated;
commit;