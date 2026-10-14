-- Apply in the Supabase SQL Editor to fix sas_media_register.
-- The role, storage path and ownership checks remain unchanged.
create or replace function public.sas_media_register(
 p_storage_path text,p_original_filename text,p_mime_type text,p_byte_size bigint,
 p_alt_ar text,p_caption_ar text,p_source_name text,p_source_url text,
 p_license_name text,p_license_url text,p_creator_name text,p_media_kind text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members t where t.user_id=auth.uid() and t.active and t.role in ('admin','editor'))
 then raise exception 'غير مصرح' using errcode='42501';end if;
 if p_storage_path is null or p_storage_path !~ '^[a-zA-Z0-9/_-]+\\.(jpg|jpeg|png|webp|avif)$'
 or p_storage_path not like auth.uid()::text||'/%'
 or char_length(trim(coalesce(p_alt_ar,'')))<8
 or char_length(trim(coalesce(p_source_name,'')))<3
 or char_length(trim(coalesce(p_license_name,'')))<3
 then raise exception 'بيانات الوسائط غير مكتملة';end if;
 if not exists (select 1 from storage.objects o where o.bucket_id='sas-media' and o.name=p_storage_path)
 then raise exception 'الملف غير مرفوع إلى المخزن الخاص';end if;
 insert into sas.media_assets(storage_path,original_filename,mime_type,byte_size,alt_ar,caption_ar,source_name,source_url,license_name,license_url,creator_name,media_kind,created_by)
 values(p_storage_path,p_original_filename,p_mime_type,p_byte_size,p_alt_ar,coalesce(p_caption_ar,''),p_source_name,p_source_url,p_license_name,p_license_url,p_creator_name,coalesce(p_media_kind,'archival'),auth.uid())
 returning id into v_id;
 return v_id;
end $$;
