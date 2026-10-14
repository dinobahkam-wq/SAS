begin;
create or replace function public.sas_owner_event_fingerprint(p_id uuid)
returns text language sql stable security definer set search_path='' as $$
 select md5(jsonb_build_object('id',e.id,'title',e.title_ar,'summary',e.summary,'starts_at',e.starts_at,'ends_at',e.ends_at,'event_kind',e.event_kind,
 'issues',coalesce((select jsonb_agg(ei.issue_id order by ei.issue_id) from sas.event_issues ei where ei.event_id=e.id),'[]'::jsonb),
 'sources',coalesce((select jsonb_agg(distinct jsonb_build_object('source_id',ds.source_id,'url',s.url)) from sas.developments d join sas.development_sources ds on ds.development_id=d.id join sas.sources s on s.id=ds.source_id where d.event_id=e.id),'[]'::jsonb))::text)
 from sas.events e where e.id=p_id;
$$;
revoke all on function public.sas_owner_event_fingerprint(uuid) from public,anon,authenticated;
create or replace function public.sas_owner_event_review_packet()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then raise exception 'صلاحية المدير مطلوبة';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'title',e.title_ar,'summary',e.summary,'updated_at',e.updated_at,'starts_at',e.starts_at,'editorial_stage',e.editorial_stage,'verification_status',e.verification_status,'public_visible',e.public_visible) order by e.updated_at desc) from sas.events e where not e.public_visible and e.editorial_stage in ('draft','review','approved')),'[]'::jsonb);
end $$;
create or replace function public.sas_owner_approve_event(p_id uuid,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare x sas.events%rowtype; problems text[]:=array[]::text[];
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then raise exception 'صلاحية المدير مطلوبة';end if;
 select * into x from sas.events where id=p_id for update;
 if not found or x.public_visible or x.editorial_stage not in ('draft','review') then raise exception 'الحدث لا يقبل الاعتماد';end if;
 if x.updated_at is distinct from p_expected_updated_at then raise exception 'تغير الحدث بعد فتحه';end if;
 if length(trim(coalesce(x.summary,'')))<30 then problems:=array_append(problems,'ملخص غير كاف');end if;
 if x.starts_at is null then problems:=array_append(problems,'تاريخ الحدث مطلوب');end if;
 if not exists(select 1 from sas.event_issues where event_id=p_id) then problems:=array_append(problems,'ربط قضية مطلوب');end if;
 if not exists(select 1 from sas.developments d join sas.development_sources ds on ds.development_id=d.id join sas.sources s on s.id=ds.source_id where d.event_id=p_id and s.url ~* '^https://[^[:space:]]+$') then problems:=array_append(problems,'مصدر مرتبط مطلوب');end if;
 if cardinality(problems)>0 then return jsonb_build_object('approved',false,'problems',to_jsonb(problems));end if;
 insert into sas.editorial_approvals(target_kind,target_id,target_version,approved_by,decision,content_fingerprint)
 values('event',p_id,x.updated_at,auth.uid(),'approved',public.sas_owner_event_fingerprint(p_id));
 update sas.events set editorial_stage='approved',reviewed_by=auth.uid(),reviewed_at=now() where id=p_id;
 return jsonb_build_object('approved',true,'id',p_id);
end $$;
create or replace function public.sas_owner_publish_event(p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare x sas.events%rowtype; problems text[]:=array[]::text[];
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then raise exception 'صلاحية المدير مطلوبة';end if;
 select * into x from sas.events where id=p_id for update;
 if not found then raise exception 'الحدث غير موجود';end if;
 if x.public_visible or x.editorial_stage<>'approved' then problems:=array_append(problems,'الحدث غير معتمد أو منشور بالفعل');end if;
 if x.verification_status<>'verified' then problems:=array_append(problems,'التحقق من الوقائع لم يكتمل');end if;
 if x.starts_at is null or length(trim(coalesce(x.summary,'')))<30 then problems:=array_append(problems,'تاريخ أو ملخص ناقص');end if;
 if not exists(select 1 from sas.editorial_approvals a join sas.team_members tm on tm.user_id=a.approved_by where a.target_kind='event' and a.target_id=p_id and a.decision='approved' and tm.active and tm.role='admin' and a.content_fingerprint=public.sas_owner_event_fingerprint(p_id)) then problems:=array_append(problems,'اعتماد الإصدار الحالي غير موجود');end if;
 if cardinality(problems)>0 then return jsonb_build_object('published',false,'problems',to_jsonb(problems));end if;
 update sas.events set public_visible=true,status='ongoing',published_by=auth.uid(),published_at=now() where id=p_id;
 return jsonb_build_object('published',true,'id',p_id);
end $$;
revoke all on function public.sas_owner_event_review_packet() from anon,public;
revoke all on function public.sas_owner_approve_event(uuid,timestamptz) from anon,public;
revoke all on function public.sas_owner_publish_event(uuid) from anon,public;
grant execute on function public.sas_owner_event_review_packet() to authenticated;
grant execute on function public.sas_owner_approve_event(uuid,timestamptz) to authenticated;
grant execute on function public.sas_owner_publish_event(uuid) to authenticated;
commit;