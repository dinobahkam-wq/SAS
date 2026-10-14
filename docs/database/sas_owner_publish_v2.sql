-- Explicit approval -> publish, tied to exact text, dates and sources.
begin;
alter table sas.editorial_approvals add column if not exists content_fingerprint text;
create or replace function public.sas_development_fingerprint(p_id uuid)
returns text language sql stable security definer set search_path='' as $$
select md5(jsonb_build_object('id',d.id,'event_id',d.event_id,'headline',d.headline_ar,'description',d.description,'occurred_at',d.occurred_at,'sources',coalesce((select jsonb_agg(jsonb_build_object('source_id',ds.source_id,'name',s.source_name,'url',s.url) order by ds.source_id) from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=d.id),'[]'::jsonb))::text)
from sas.developments d where d.id=p_id;
$$;
revoke all on function public.sas_development_fingerprint(uuid) from public,anon,authenticated;
create or replace function public.sas_owner_review_development(
 p_id uuid,p_expected_updated_at timestamptz,p_decision text,p_note text default ''
) returns jsonb language plpgsql security definer set search_path='' as $$
declare x sas.developments%rowtype; v_owner uuid; v_missing text[]:=array[]::text[]; v_approval uuid;
begin
 v_owner:=auth.uid();
 if v_owner is null or not exists(select 1 from sas.team_members where user_id=v_owner and active and role='admin')
 then raise exception 'صلاحية المدير مطلوبة' using errcode='42501';end if;
 if p_decision not in ('approve','return') then raise exception 'قرار غير صالح';end if;
 select * into x from sas.developments where id=p_id for update;
 if not found or x.editorial_status not in ('draft','review') then raise exception 'المادة غير قابلة للاعتماد';end if;
 if x.updated_at is distinct from p_expected_updated_at then raise exception 'تغيرت المادة بعد المراجعة؛ أعد فتحها';end if;
 if p_decision='approve' then
   if x.occurred_at is null then v_missing:=array_append(v_missing,'تاريخ التطور غير محدد');end if;
   if length(trim(coalesce(x.description,'')))<100 then v_missing:=array_append(v_missing,'المتن غير كاف');end if;
   if not exists(select 1 from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=x.id and s.url ~* '^https://[^[:space:]]+$')
   then v_missing:=array_append(v_missing,'رابط مصدر مطلوب');end if;
   if cardinality(v_missing)>0 then return jsonb_build_object('approved',false,'problems',to_jsonb(v_missing));end if;
 end if;
 insert into sas.editorial_approvals(target_kind,target_id,target_version,approved_by,decision,note,content_fingerprint)
 values('development',p_id,x.updated_at,v_owner,case when p_decision='approve' then 'approved' else 'returned' end,nullif(trim(p_note),''),case when p_decision='approve' then public.sas_development_fingerprint(p_id) else null end)
 returning id into v_approval;
 if p_decision='approve' then
   update sas.developments set editorial_status='approved',reviewed_by=v_owner,reviewed_at=now(),review_note=nullif(trim(p_note),'') where id=p_id;
 else
   if length(trim(p_note))<5 then raise exception 'سبب الإعادة مطلوب';end if;
   update sas.developments set editorial_status='draft',reviewed_by=v_owner,reviewed_at=now(),review_note=trim(p_note) where id=p_id;
 end if;
 return jsonb_build_object('approved',p_decision='approve','approval_id',v_approval,'target_id',p_id);
end $$;
create or replace function public.sas_owner_publication_check(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare x record; problems text[]:=array[]::text[]; fingerprint text;
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin')
 then raise exception 'صلاحية المدير مطلوبة' using errcode='42501';end if;
 select d.*,e.public_visible event_public,e.status event_status,e.verification_status event_verification into x
 from sas.developments d join sas.events e on e.id=d.event_id where d.id=p_id;
 if not found then raise exception 'التطور غير موجود';end if;
 if x.editorial_status<>'approved' then problems:=array_append(problems,'التطور لم يعتمد');end if;
 if x.occurred_at is null then problems:=array_append(problems,'تاريخ وقوع التطور مطلوب');end if;
 if length(trim(coalesce(x.description,'')))<100 then problems:=array_append(problems,'المتن غير كاف');end if;
 if not (x.event_public is true and x.event_status in ('ongoing','concluded') and x.event_verification='verified')
 then problems:=array_append(problems,'الحدث الأب غير منشور أو غير محقق');end if;
 if not exists(select 1 from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=p_id and s.url ~* '^https://[^[:space:]]+$')
 then problems:=array_append(problems,'مصدر موثق برابط مطلوب');end if;
 fingerprint:=public.sas_development_fingerprint(p_id);
 if not exists(select 1 from sas.editorial_approvals a join sas.team_members tm on tm.user_id=a.approved_by
 where a.target_kind='development' and a.target_id=p_id and a.decision='approved'
 and a.content_fingerprint=fingerprint and tm.active and tm.role='admin' and x.reviewed_by=a.approved_by)
 then problems:=array_append(problems,'اعتماد المدير لهذه النسخة والمصادر غير موجود');end if;
 return jsonb_build_object('ready',cardinality(problems)=0,'problems',to_jsonb(problems),'state',x.editorial_status);
end $$;
create or replace function public.sas_owner_publish_development(p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; x sas.developments%rowtype;
begin
 select * into x from sas.developments where id=p_id for update;
 if not found then raise exception 'التطور غير موجود';end if;
 result:=public.sas_owner_publication_check(p_id);
 if not (result->>'ready')::boolean then return result;end if;
 update sas.developments set editorial_status='published',published_by=auth.uid(),published_at=now()
 where id=p_id and editorial_status='approved';
 return jsonb_build_object('published',true,'id',p_id);
end $$;
revoke all on function public.sas_owner_review_development(uuid,timestamptz,text,text) from public,anon;
revoke all on function public.sas_owner_publication_check(uuid) from public,anon;
revoke all on function public.sas_owner_publish_development(uuid) from public,anon;
grant execute on function public.sas_owner_review_development(uuid,timestamptz,text,text) to authenticated;
grant execute on function public.sas_owner_publication_check(uuid) to authenticated;
grant execute on function public.sas_owner_publish_development(uuid) to authenticated;
commit;