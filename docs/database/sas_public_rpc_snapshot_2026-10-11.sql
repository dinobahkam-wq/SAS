-- SAS REFERENCE SNAPSHOT — 2026-10-11
-- Source: LIVE Supabase project nrmwshoytmzcmureetjb / public.sas_* RPC routines.
-- 25 function definitions, generated from pg_get_functiondef.
-- REFERENCE ONLY: This is NOT an ordered migration and must not be executed wholesale.
-- Historical migrations v1-v29 remain authoritative in Supabase history.
-- SECURITY: no credentials, user rows, or production content.

-- 1. sas_admin_add_development_source
CREATE OR REPLACE FUNCTION public.sas_admin_add_development_source(p_development_id uuid, p_source_name text, p_source_url text, p_evidence_role text DEFAULT 'reports'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare new_source_id uuid;
begin
 if not exists(select 1 from sas.team_members m where m.user_id=auth.uid() and m.active and m.role in ('admin','editor')) then raise exception 'غير مصرح بالتحرير';end if;
 if not exists(select 1 from sas.developments d join sas.events e on e.id=d.event_id where d.id=p_development_id and d.editorial_status='draft' and e.status='draft' and not e.public_visible) then raise exception 'التطور ليس مسودة قابلة للتعديل';end if;
 if length(trim(coalesce(p_source_name,'')))<2 or length(p_source_name)>250 or length(coalesce(p_source_url,''))>2000 or p_source_url !~* '^https://[^[:space:]]+$' then raise exception 'بيانات المصدر غير صالحة';end if;
 if p_evidence_role not in ('primary','corroborates','contradicts','reports') then raise exception 'دور المصدر غير صالح';end if;
 if exists(select 1 from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=p_development_id and s.url=p_source_url) then raise exception 'المصدر مرتبط بالفعل بهذا التطور';end if;
 insert into sas.sources(source_name,url,source_type) values(trim(p_source_name),trim(p_source_url),'website') returning id into new_source_id;
 insert into sas.development_sources(development_id,source_id,evidence_role) values(p_development_id,new_source_id,p_evidence_role);
 return new_source_id;
end;$function$;


-- 2. sas_admin_create_development
CREATE OR REPLACE FUNCTION public.sas_admin_create_development(p_event_id uuid, p_headline text, p_description text, p_occurred_at timestamp with time zone, p_source_name text DEFAULT NULL::text, p_source_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare new_id uuid; source_id uuid;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','reviewer','editor')) then raise exception 'لا توجد صلاحية لإنشاء التطور';end if;
 if not exists(select 1 from sas.events where id=p_event_id and status<>'archived') then raise exception 'الحدث غير موجود أو مسحوب من النشر';end if;
 if length(trim(coalesce(p_headline,'')))<5 or length(p_headline)>250 or length(coalesce(p_description,''))>12000 then raise exception 'بيانات التطور غير صالحة';end if;
 if (nullif(trim(coalesce(p_source_name,'')),'') is null) <> (nullif(trim(coalesce(p_source_url,'')),'') is null) then raise exception 'أدخل اسم المصدر والرابط معًا';end if;
 if nullif(trim(coalesce(p_source_url,'')),'') is not null and (length(p_source_url)>2000 or p_source_url !~* '^https://[^[:space:]]+$' or length(p_source_name)>250) then raise exception 'اسم أو رابط المصدر غير صالح';end if;
 insert into sas.developments(event_id,headline_ar,description,occurred_at,development_kind,verification_status,editorial_status)
 values(p_event_id,trim(p_headline),coalesce(p_description,''),p_occurred_at,'other','unverified','draft') returning id into new_id;
 if nullif(trim(coalesce(p_source_url,'')),'') is not null then
 insert into sas.sources(source_name,url,source_type) values(trim(p_source_name),trim(p_source_url),'website') returning id into source_id;
 insert into sas.development_sources(development_id,source_id,evidence_role) values(new_id,source_id,'reports');
 end if;
 return new_id;
end;$function$;


-- 3. sas_admin_create_draft
CREATE OR REPLACE FUNCTION public.sas_admin_create_draft(p_kind text, p_title text, p_slug text, p_description text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare new_id uuid;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','editor','reviewer')) then raise exception 'ليس لديك صلاحية إنشاء مسودة';end if;
 if length(trim(coalesce(p_title,'')))<4 or length(p_title)>220 or coalesce(p_slug,'') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>100 or length(coalesce(p_description,''))>8000 then raise exception 'تحقق من بيانات المسودة';end if;
 if p_kind='dossiers' then insert into sas.dossiers(slug,title_ar,description,status,public_visible) values(p_slug,trim(p_title),coalesce(p_description,''),'draft',false) returning id into new_id;
 elsif p_kind='issues' then insert into sas.issues(slug,title_ar,definition,status,public_visible) values(p_slug,trim(p_title),coalesce(p_description,''),'draft',false) returning id into new_id;
 elsif p_kind='events' then insert into sas.events(slug,title_ar,summary,event_kind,status,verification_status,public_visible) values(p_slug,trim(p_title),coalesce(p_description,''),'primary','draft','unreviewed',false) returning id into new_id;
 else raise exception 'نوع غير صالح';end if;
 return new_id;
end;$function$;


-- 4. sas_admin_draft_details
CREATE OR REPLACE FUNCTION public.sas_admin_draft_details(p_kind text, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare output jsonb;
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members m where m.user_id=auth.uid() and m.active) then raise exception 'غير مصرح';end if;
 if p_kind='dossiers' then select jsonb_build_object('title',title_ar,'description',description,'slug',slug,'status',status) into output from sas.dossiers where id=p_id;
 elsif p_kind='issues' then select jsonb_build_object('title',title_ar,'description',definition,'slug',slug,'status',status) into output from sas.issues where id=p_id;
 elsif p_kind='events' then select jsonb_build_object('title',title_ar,'description',summary,'slug',slug,'status',status) into output from sas.events where id=p_id;
 else raise exception 'نوع غير صالح';end if;
 return output;
end;$function$;


-- 5. sas_admin_event_developments
CREATE OR REPLACE FUNCTION public.sas_admin_event_developments(p_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active) then raise exception 'غير مصرح';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'headline',d.headline_ar,'description',d.description,'occurred_at',d.occurred_at,'editorial_status',d.editorial_status,'submitted_by',d.submitted_by,'review_note',d.review_note,'sources',coalesce((select jsonb_agg(jsonb_build_object('name',s.source_name,'url',s.url)) from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=d.id),'[]'::jsonb)) order by d.recorded_at desc),'[]'::jsonb)
 into result from sas.developments d where d.event_id=p_event_id;
 return result;
end;$function$;


-- 6. sas_admin_event_editor
CREATE OR REPLACE FUNCTION public.sas_admin_event_editor(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare output jsonb;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active) then raise exception 'غير مصرح';end if;
 select jsonb_build_object('starts_at',e.starts_at,'editorial_stage',e.editorial_stage,'review_note',e.review_note,'public_visible',e.public_visible)
 into output from sas.events e where e.id=p_id;
 return output;
end;$function$;


-- 7. sas_admin_links
CREATE OR REPLACE FUNCTION public.sas_admin_links(p_kind text, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare output jsonb;
begin
 if not exists(select 1 from sas.team_members m where m.user_id=auth.uid() and m.active) then raise exception 'غير مصرح';end if;
 if p_kind='issues' then
 select jsonb_build_object('selected',coalesce((select jsonb_agg(dossier_id) from sas.dossier_issues where issue_id=p_id),'[]'::jsonb),
 'options',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title_ar)) from sas.dossiers),'[]'::jsonb)) into output;
 elsif p_kind='events' then
 select jsonb_build_object('selected',coalesce((select jsonb_agg(issue_id) from sas.event_issues where event_id=p_id),'[]'::jsonb),
 'options',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title_ar)) from sas.issues),'[]'::jsonb)) into output;
 else raise exception 'نوع غير صالح';end if;
 return output;
end;$function$;


-- 8. sas_admin_overview
CREATE OR REPLACE FUNCTION public.sas_admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members m where m.user_id=auth.uid() and m.active) then
  raise exception 'غير مصرح بالدخول';
 end if;
 select jsonb_build_object('role',(select role from sas.team_members where user_id=auth.uid() and active limit 1),
 'dossiers',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title_ar,'slug',slug,'status',status,'public_visible',public_visible) order by updated_at desc),'[]'::jsonb) from (select * from sas.dossiers order by updated_at desc limit 30) a),
 'issues',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title_ar,'slug',slug,'status',status,'public_visible',public_visible) order by updated_at desc),'[]'::jsonb) from (select * from sas.issues order by updated_at desc limit 30) b),
 'events',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title_ar,'slug',slug,'status',status,'public_visible',public_visible) order by updated_at desc),'[]'::jsonb) from (select * from sas.events order by updated_at desc limit 30) c)) into result;
 return result;
end;$function$;


-- 9. sas_admin_publication_queue
CREATE OR REPLACE FUNCTION public.sas_admin_publication_queue()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then
  raise exception 'صلاحية المدير مطلوبة';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',d.id,'headline',d.headline_ar,'editorial_status',d.editorial_status,
  'event_title',e.title_ar,'event_slug',e.slug,'event_id',e.id
 ) order by d.updated_at desc),'[]'::jsonb) into result
 from sas.developments d join sas.events e on e.id=d.event_id
 where d.editorial_status='approved';
 return result;
end;$function$;


-- 10. sas_admin_set_event_date
CREATE OR REPLACE FUNCTION public.sas_admin_set_event_date(p_id uuid, p_starts_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','editor')) then raise exception 'غير مصرح';end if;
 if p_starts_at is null then raise exception 'تاريخ بدء الحدث مطلوب';end if;
 update sas.events set starts_at=p_starts_at where id=p_id and status='draft' and editorial_stage='draft' and not public_visible;
 if not found then raise exception 'لا يمكن تعديل تاريخ الحدث في حالته الحالية';end if;
 return true;
end;$function$;


-- 11. sas_admin_set_links
CREATE OR REPLACE FUNCTION public.sas_admin_set_links(p_kind text, p_id uuid, p_target_ids uuid[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','editor')) then raise exception 'غير مصرح';end if;
 if cardinality(p_target_ids)>100 then raise exception 'عدد روابط كبير';end if;
 if p_kind='issues' then
  perform 1 from sas.issues where id=p_id and status='draft' and not public_visible for update;
  if not found then raise exception 'القضية ليست مسودة';end if;
  if exists(select 1 from unnest(p_target_ids) t where not exists(select 1 from sas.dossiers where id=t)) then raise exception 'ملف غير موجود';end if;
  delete from sas.dossier_issues where issue_id=p_id;
  insert into sas.dossier_issues(dossier_id,issue_id) select distinct t,p_id from unnest(p_target_ids) t;
 elsif p_kind='events' then
  perform 1 from sas.events where id=p_id and status='draft' and editorial_stage='draft' and not public_visible for update;
  if not found then raise exception 'علاقات الحدث مقفلة أثناء المراجعة أو بعد الاعتماد';end if;
  if exists(select 1 from unnest(p_target_ids) t where not exists(select 1 from sas.issues where id=t)) then raise exception 'قضية غير موجودة';end if;
  delete from sas.event_issues where event_id=p_id;
  insert into sas.event_issues(event_id,issue_id) select distinct p_id,t from unnest(p_target_ids) t;
 else raise exception 'نوع غير صالح';end if;
 return true;
end;$function$;


-- 12. sas_admin_update_development
CREATE OR REPLACE FUNCTION public.sas_admin_update_development(p_development_id uuid, p_headline text, p_description text, p_occurred_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from sas.team_members m where m.user_id=auth.uid() and m.active and m.role in ('admin','editor')) then raise exception 'غير مصرح بالتحرير';end if;
 if length(trim(coalesce(p_headline,'')))<5 or length(p_headline)>250 or length(coalesce(p_description,''))>12000 then raise exception 'بيانات التطور غير صالحة';end if;
 update sas.developments d set headline_ar=trim(p_headline),description=coalesce(p_description,''),occurred_at=p_occurred_at
 where d.id=p_development_id and d.editorial_status='draft'
 and exists(select 1 from sas.events e where e.id=d.event_id and e.status='draft' and e.public_visible=false);
 if not found then raise exception 'لا يمكن تعديل هذا التطور';end if;
 return true;
end;$function$;


-- 13. sas_admin_update_draft
CREATE OR REPLACE FUNCTION public.sas_admin_update_draft(p_kind text, p_id uuid, p_title text, p_description text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','editor')) then raise exception 'صلاحية التحرير غير متاحة';end if;
 if length(trim(coalesce(p_title,'')))<4 or length(p_title)>220 or length(coalesce(p_description,''))>8000 then raise exception 'بيانات غير صالحة';end if;
 if p_kind='dossiers' then
 update sas.dossiers set title_ar=trim(p_title),description=coalesce(p_description,'') where id=p_id and status='draft' and not public_visible;
 elsif p_kind='issues' then
 update sas.issues set title_ar=trim(p_title),definition=coalesce(p_description,'') where id=p_id and status='draft' and not public_visible;
 elsif p_kind='events' then
 update sas.events set title_ar=trim(p_title),summary=coalesce(p_description,'') where id=p_id and status='draft' and editorial_stage='draft' and not public_visible;
 else raise exception 'نوع غير صالح';end if;
 if not found then raise exception 'المسودة غير قابلة للتحرير';end if;
 return true;
end;$function$;


-- 14. sas_development_review_action
CREATE OR REPLACE FUNCTION public.sas_development_review_action(p_id uuid, p_action text, p_note text DEFAULT ''::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare current_state text; original_author uuid; parent_is_draft boolean;
begin
 if auth.uid() is null then raise exception 'غير مصرح';end if;
 select d.editorial_status,d.submitted_by,(e.status='draft' and not e.public_visible)
 into current_state,original_author,parent_is_draft
 from sas.developments d join sas.events e on e.id=d.event_id where d.id=p_id for update of d;
 if not found or not parent_is_draft then raise exception 'لا يمكن مراجعة هذا السجل';end if;
 if p_action='submit' then
  if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','editor')) then raise exception 'لا تملك صلاحية تقديم المسودة';end if;
  if current_state<>'draft' then raise exception 'يجب أن تكون المادة مسودة';end if;
  update sas.developments set editorial_status='review',submitted_by=auth.uid(),submitted_at=now(),reviewed_by=null,reviewed_at=null,review_note=null where id=p_id;
 elsif p_action in ('approve','return') then
  if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','reviewer')) then raise exception 'لا تملك صلاحية المراجعة';end if;
  if current_state<>'review' then raise exception 'المادة ليست قيد المراجعة';end if;
  if original_author is null or original_author=auth.uid() then raise exception 'يجب أن يتولى المراجعة شخص آخر غير مقدّم المسودة';end if;
  if p_action='approve' then
   update sas.developments set editorial_status='approved',reviewed_by=auth.uid(),reviewed_at=now(),review_note=nullif(trim(p_note),'') where id=p_id;
  else
   if length(trim(p_note))<5 then raise exception 'ملاحظة الإعادة مطلوبة';end if;
   update sas.developments set editorial_status='draft',reviewed_by=auth.uid(),reviewed_at=now(),review_note=trim(p_note) where id=p_id;
  end if;
 else raise exception 'إجراء غير صالح';end if;
 return true;
end;$function$;


-- 15. sas_event_review_requirements
CREATE OR REPLACE FUNCTION public.sas_event_review_requirements(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare e sas.events%rowtype; problems text[]:=array[]::text[];
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active) then raise exception 'غير مصرح';end if;
 select * into e from sas.events where id=p_id;
 if not found then raise exception 'الحدث غير موجود';end if;
 if length(trim(coalesce(e.summary,'')))<30 then problems:=array_append(problems,'يجب استكمال ملخص الحدث (30 حرفًا على الأقل)');end if;
 if e.starts_at is null then problems:=array_append(problems,'تاريخ بداية الحدث غير محفوظ');end if;
 if not exists(select 1 from sas.event_issues where event_id=p_id) then problems:=array_append(problems,'اربط الحدث بقضية واحدة على الأقل');end if;
 if not exists(select 1 from sas.developments d join sas.development_sources ds on ds.development_id=d.id join sas.sources s on s.id=ds.source_id where d.event_id=p_id and s.url ~* '^https://[^[:space:]]+$') then problems:=array_append(problems,'أضف مصدرًا موثقًا مرتبطًا بتطور في الحدث');end if;
 return jsonb_build_object('ready',cardinality(problems)=0,'problems',to_jsonb(problems),'stage',e.editorial_stage);
end;$function$;


-- 16. sas_event_workflow
CREATE OR REPLACE FUNCTION public.sas_event_workflow(p_id uuid, p_action text, p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare e sas.events%rowtype; issues_count integer; sources_count integer; blockers text[]:=array[]::text[];
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active) then raise exception 'غير مصرح';end if;
 select * into e from sas.events where id=p_id for update;
 if not found then raise exception 'حدث غير موجود';end if;
 select count(*) into issues_count from sas.event_issues where event_id=p_id;
 select count(distinct ds.source_id) into sources_count from sas.developments d join sas.development_sources ds on ds.development_id=d.id join sas.sources s on s.id=ds.source_id where d.event_id=p_id and s.url ~* '^https://[^[:space:]]+$';
 if length(trim(coalesce(e.summary,'')))<30 then blockers:=array_append(blockers,'ملخص الحدث غير كاف');end if;
 if issues_count=0 then blockers:=array_append(blockers,'يجب ربط الحدث بقضية واحدة على الأقل');end if;
 if sources_count=0 then blockers:=array_append(blockers,'يجب توفير مصدر موثق واحد على الأقل من تطورات الحدث');end if;
 if e.starts_at is null then blockers:=array_append(blockers,'تاريخ بدء الحدث مطلوب');end if;
 if p_action='check' then
   if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then raise exception 'فحص النشر للمدير فقط';end if;
   if e.editorial_stage<>'approved' then blockers:=array_append(blockers,'الحدث لم يعتمد تحريريا');end if;
   if e.reviewed_by is null or e.reviewed_by=e.submitted_by then blockers:=array_append(blockers,'المراجعة المستقلة لم تكتمل');end if;
   if e.reviewed_by=auth.uid() then blockers:=array_append(blockers,'لا يمكن للمراجع أن ينشر ما اعتمده');end if;
   return jsonb_build_object('ready',cardinality(blockers)=0,'stage',e.editorial_stage,'problems',to_jsonb(blockers));
 end if;
 if p_action='submit' then
   if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','editor')) or e.editorial_stage<>'draft' or e.public_visible then raise exception 'غير مسموح بتقديم الحدث';end if;
   update sas.events set editorial_stage='review',submitted_by=auth.uid(),reviewed_by=null,reviewed_at=null where id=p_id;
 elsif p_action in ('approve','return') then
   if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','reviewer')) or e.editorial_stage<>'review' or e.submitted_by is null or e.submitted_by=auth.uid() then raise exception 'المراجعة تتطلب مراجعا مستقلا';end if;
   if p_action='approve' then
     if cardinality(blockers)>0 then raise exception 'متطلبات ناقصة: %',to_jsonb(blockers);end if;
     update sas.events set editorial_stage='approved',reviewed_by=auth.uid(),reviewed_at=now(),review_note=nullif(trim(p_note),'') where id=p_id;
   else
     if length(trim(coalesce(p_note,'')))<5 then raise exception 'ملاحظة الإعادة مطلوبة';end if;
     update sas.events set editorial_stage='draft',reviewed_by=auth.uid(),reviewed_at=now(),review_note=trim(p_note) where id=p_id;
   end if;
 elsif p_action='publish' then
   if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') or e.editorial_stage<>'approved' or e.reviewed_by is null or e.reviewed_by=auth.uid() or e.reviewed_by=e.submitted_by or cardinality(blockers)>0 or e.public_visible then raise exception 'شروط النشر أو فصل الصلاحيات غير مستوفاة';end if;
   update sas.events set status='concluded',verification_status='verified',public_visible=true,published_by=auth.uid(),published_at=now() where id=p_id;
 else raise exception 'إجراء غير صالح';end if;
 return jsonb_build_object('success',true);
end;$function$;


-- 17. sas_public_directory
CREATE OR REPLACE FUNCTION public.sas_public_directory(p_kind text)
 RETURNS TABLE(slug text, title_ar text, summary_ar text, starts_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if p_kind='dossiers' then return query select d.slug,d.title_ar,d.description,null::timestamptz from sas.dossiers d where d.public_visible and d.status='active' order by d.updated_at desc limit 100;
 elsif p_kind='issues' then return query select i.slug,i.title_ar,i.definition,null::timestamptz from sas.issues i where i.public_visible and i.status='active' order by i.updated_at desc limit 100;
 elsif p_kind='events' then return query select e.slug,e.title_ar,e.summary,e.starts_at from sas.events e where e.public_visible and e.status in ('ongoing','concluded') order by e.starts_at desc nulls last limit 100;
 end if;
end;$function$;


-- 18. sas_public_event_developments
CREATE OR REPLACE FUNCTION public.sas_public_event_developments(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_object('headline',d.headline_ar,'description',d.description,'occurred_at',d.occurred_at,'sources',coalesce((select jsonb_agg(jsonb_build_object('name',s.source_name,'url',s.url)) from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=d.id),'[]'::jsonb)) order by d.occurred_at desc nulls last),'[]'::jsonb)
 into result from sas.events e join sas.developments d on d.event_id=e.id
 where e.slug=p_slug and e.public_visible and e.status in ('ongoing','concluded') and d.editorial_status='published';
 return result;
end;$function$;


-- 19. sas_public_parents
CREATE OR REPLACE FUNCTION public.sas_public_parents(p_kind text, p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare output jsonb:='[]'::jsonb;
begin
 if p_kind='issues' then
 select coalesce(jsonb_agg(jsonb_build_object('slug',d.slug,'title',d.title_ar,'kind','dossiers')),'[]'::jsonb) into output
 from sas.issues i join sas.dossier_issues di on di.issue_id=i.id join sas.dossiers d on d.id=di.dossier_id
 where i.slug=p_slug and i.public_visible and i.status='active' and d.public_visible and d.status='active';
 elsif p_kind='events' then
 select coalesce(jsonb_agg(jsonb_build_object('slug',i.slug,'title',i.title_ar,'kind','issues')),'[]'::jsonb) into output
 from sas.events e join sas.event_issues ei on ei.event_id=e.id join sas.issues i on i.id=ei.issue_id
 where e.slug=p_slug and e.public_visible and e.status in ('ongoing','concluded') and i.public_visible and i.status='active';
 end if;
 return output;
end;$function$;


-- 20. sas_public_related
CREATE OR REPLACE FUNCTION public.sas_public_related(p_kind text, p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb:='[]'::jsonb;
begin
 if p_kind='dossiers' then
 select coalesce(jsonb_agg(jsonb_build_object('slug',i.slug,'title',i.title_ar,'summary',i.definition,'kind','issues') order by i.title_ar),'[]'::jsonb) into result
 from sas.dossiers d join sas.dossier_issues di on di.dossier_id=d.id join sas.issues i on i.id=di.issue_id
 where d.slug=p_slug and d.public_visible and d.status='active' and i.public_visible and i.status='active';
 elsif p_kind='issues' then
 select coalesce(jsonb_agg(jsonb_build_object('slug',e.slug,'title',e.title_ar,'summary',e.summary,'kind','events') order by e.starts_at desc nulls last),'[]'::jsonb) into result
 from sas.issues i join sas.event_issues ei on ei.issue_id=i.id join sas.events e on e.id=ei.event_id
 where i.slug=p_slug and i.public_visible and i.status='active' and e.public_visible and e.status in ('ongoing','concluded');
 elsif p_kind='events' then
 select coalesce(jsonb_agg(jsonb_build_object('slug',i.slug,'title',i.title_ar,'kind','issues') order by i.title_ar),'[]'::jsonb) into result
 from sas.events e join sas.event_issues ei on ei.event_id=e.id join sas.issues i on i.id=ei.issue_id
 where e.slug=p_slug and e.public_visible and e.status in ('ongoing','concluded') and i.public_visible and i.status='active';
 end if;
 return result;
end;$function$;


-- 21. sas_publication_check
CREATE OR REPLACE FUNCTION public.sas_publication_check(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare x record; problems text[]:=array[]::text[];
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then raise exception 'صلاحية المدير مطلوبة';end if;
 select d.*,e.public_visible as event_public,e.status as event_status,e.verification_status as event_verification
 into x from sas.developments d join sas.events e on e.id=d.event_id where d.id=p_id;
 if not found then raise exception 'التطور غير موجود';end if;
 if x.editorial_status <> 'approved' then problems:=array_append(problems,'يجب اعتماد التطور تحريرياً');end if;
 if x.reviewed_by is null or x.submitted_by is null or x.reviewed_by=x.submitted_by then problems:=array_append(problems,'يجب اعتماد التطور بواسطة مراجع مستقل');end if;
 if x.occurred_at is null then problems:=array_append(problems,'تاريخ وقوع التطور مطلوب');end if;
 if length(trim(coalesce(x.description,'')))<20 then problems:=array_append(problems,'وصف التطور غير كافٍ');end if;
 if x.event_public is not true or x.event_status not in ('ongoing','concluded') or x.event_verification<>'verified' then problems:=array_append(problems,'يجب نشر الحدث الأب والتحقق منه أولاً');end if;
 if not exists(select 1 from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=p_id and s.url ~* '^https://[^[:space:]]+$') then problems:=array_append(problems,'مصدر موثق برابط مطلوب');end if;
 return jsonb_build_object('ready',cardinality(problems)=0,'problems',to_jsonb(problems),'state',x.editorial_status);
end;$function$;


-- 22. sas_publish_development
CREATE OR REPLACE FUNCTION public.sas_publish_development(p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin') then raise exception 'صلاحية المدير مطلوبة';end if;
 perform 1 from sas.developments where id=p_id for update;
 result:=public.sas_publication_check(p_id);
 if not (result->>'ready')::boolean then raise exception 'شروط النشر غير مكتملة: %',result->'problems';end if;
 update sas.developments set editorial_status='published',published_by=auth.uid(),published_at=now() where id=p_id and editorial_status='approved';
 if not found then raise exception 'تعذر تغيير حالة النشر';end if;
 return true;
end;$function$;


-- 23. sas_quick_add_development_source
CREATE OR REPLACE FUNCTION public.sas_quick_add_development_source(p_development_id uuid, p_source_name text, p_source_url text, p_evidence_role text DEFAULT 'reports'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sid uuid;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','reviewer')) then raise exception 'غير مصرح';end if;
 if not exists(select 1 from sas.developments where id=p_development_id) then raise exception 'التطور غير موجود';end if;
 if length(trim(coalesce(p_source_name,'')))<2 or length(p_source_name)>250 or length(coalesce(p_source_url,''))>2000 or p_source_url !~* '^https://[^[:space:]]+$' then raise exception 'اسم المصدر أو رابط HTTPS غير صالح';end if;
 if p_evidence_role not in ('reports','primary','corroborates','contradicts') then raise exception 'نوع الاستدلال غير صالح';end if;
 select ds.source_id into sid from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=p_development_id and s.url=trim(p_source_url) limit 1;
 if sid is not null then raise exception 'هذا المصدر مرتبط بالتطور مسبقًا';end if;
 insert into sas.sources(source_name,url,source_type) values(trim(p_source_name),trim(p_source_url),'website') returning id into sid;
 insert into sas.development_sources(development_id,source_id,evidence_role) values(p_development_id,sid,p_evidence_role);
 return sid;
end;$function$;


-- 24. sas_quick_content_action
CREATE OR REPLACE FUNCTION public.sas_quick_content_action(p_kind text, p_id uuid, p_action text, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','reviewer')) then raise exception 'يتطلب دور المدير أو المراجع';end if;
 if p_action not in ('publish','withdraw','save') then raise exception 'إجراء غير مسموح';end if;
 if p_action='save' and (length(trim(coalesce(p_title,'')))<4 or length(p_title)>220 or length(coalesce(p_description,''))>8000) then raise exception 'عنوان أو وصف غير صالح';end if;
 if p_kind='dossiers' then
  perform 1 from sas.dossiers where id=p_id for update; if not found then raise exception 'الملف غير موجود';end if;
  if p_action='publish' then update sas.dossiers set status='active',public_visible=true where id=p_id;
  elsif p_action='withdraw' then update sas.dossiers set status='archived',public_visible=false where id=p_id;
  else update sas.dossiers set title_ar=trim(p_title),description=coalesce(p_description,'') where id=p_id;end if;
 elsif p_kind='issues' then
  perform 1 from sas.issues where id=p_id for update; if not found then raise exception 'القضية غير موجودة';end if;
  if p_action='publish' then update sas.issues set status='active',public_visible=true where id=p_id;
  elsif p_action='withdraw' then update sas.issues set status='archived',public_visible=false where id=p_id;
  else update sas.issues set title_ar=trim(p_title),definition=coalesce(p_description,'') where id=p_id;end if;
 elsif p_kind='events' then
  perform 1 from sas.events where id=p_id for update; if not found then raise exception 'الحدث غير موجود';end if;
  if p_action='publish' then update sas.events set status='concluded',editorial_stage='approved',public_visible=true,published_by=auth.uid(),published_at=now() where id=p_id;
  elsif p_action='withdraw' then update sas.events set status='archived',public_visible=false where id=p_id;
  else update sas.events set title_ar=trim(p_title),summary=coalesce(p_description,'') where id=p_id;end if;
 else raise exception 'نوع غير صالح';end if;
 return true;
end;$function$;


-- 25. sas_quick_development_action
CREATE OR REPLACE FUNCTION public.sas_quick_development_action(p_id uuid, p_action text, p_headline text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d sas.developments%rowtype; event_is_public boolean;
begin
 if not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role in ('admin','reviewer')) then raise exception 'يتطلب صلاحية المدير أو المراجع';end if;
 select * into d from sas.developments where id=p_id for update;
 if not found then raise exception 'التطور غير موجود';end if;
 select e.public_visible into event_is_public from sas.events e where e.id=d.event_id;
 if p_action='save' then
  if length(trim(coalesce(p_headline,'')))<5 or length(p_headline)>250 or length(coalesce(p_description,''))>12000 then raise exception 'بيانات غير صالحة';end if;
  update sas.developments set headline_ar=trim(p_headline),description=coalesce(p_description,'') where id=p_id;
 elsif p_action='publish' then
  if not event_is_public then raise exception 'انشر الحدث الأب أولاً قبل نشر تطوره';end if;
  update sas.developments set editorial_status='published',published_by=auth.uid(),published_at=now() where id=p_id;
 elsif p_action='withdraw' then
  update sas.developments set editorial_status='withdrawn' where id=p_id;
 else raise exception 'الإجراء غير معروف';end if;
 return true;
end;$function$;
