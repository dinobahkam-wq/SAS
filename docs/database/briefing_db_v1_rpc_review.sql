-- Briefing DB V1 / RPC package 1 — REVIEW ONLY. Execute only AFTER briefing_db_v1_review.sql.
-- No public publication function; no changes to existing events/developments.
begin;
create or replace function public.sas_briefing_admin_list()
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists (
  select 1 from sas.team_members m where m.user_id=auth.uid() and m.active
 ) then raise exception 'غير مصرح بعرض الإحاطات' using errcode='42501'; end if;
 return coalesce((
  select jsonb_agg(jsonb_build_object(
   'id',e.id,'edition_no',e.edition_no,'slug',e.slug,'date',e.edition_date,
   'status',e.status,'title',e.title_ar,'lead',e.lead_ar,
   'analysis',e.analysis_ar,'watchpoints',e.watchpoints_ar,'methodology',e.methodology_ar,
   'coverage_note',e.coverage_note_ar,'window_start',e.window_start,
   'window_end',e.window_end,'checked_at',e.checked_at,
   'items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',i.id,'development_id',i.development_id,'placement',i.placement,'position',i.position,
    'headline',coalesce(i.headline_override_ar,d.headline_ar),'what_changed',i.what_changed_ar,
    'why_it_matters',i.why_it_matters_ar,'context',i.context_ar
   ) order by i.placement,i.position) from sas.briefing_items i
    join sas.developments d on d.id=i.development_id where i.edition_id=e.id),'[]'::jsonb)
  ) order by e.edition_date desc)
  from (select * from sas.briefing_editions order by edition_date desc limit 60) e
 ),'[]'::jsonb);
end $$;

create or replace function public.sas_briefing_admin_development_options()
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists (
  select 1 from sas.team_members m where m.user_id=auth.uid() and m.active
  and m.role in ('admin','editor','reviewer')
 ) then raise exception 'غير مصرح' using errcode='42501'; end if;
 return coalesce((
  select jsonb_agg(jsonb_build_object('id',d.id,'headline',d.headline_ar,
   'occurred_at',d.occurred_at,'editorial_status',d.editorial_status,
   'event_title',e.title_ar) order by d.created_at desc)
  from (select * from sas.developments where editorial_status in ('approved','published')
    order by created_at desc limit 150) d
  join sas.events e on e.id=d.event_id
 ),'[]'::jsonb);
end $$;

create or replace function public.sas_briefing_admin_save(
 p_id uuid, p_date date, p_window_start timestamptz, p_window_end timestamptz,
 p_title text,p_lead text,p_analysis text,p_watchpoints text,p_methodology text,
 p_coverage_note text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;v_status text;
begin
 if auth.uid() is null or not exists (
  select 1 from sas.team_members m where m.user_id=auth.uid() and m.active
  and m.role in ('admin','editor')
 ) then raise exception 'ليس لديك صلاحية تحرير الإحاطة' using errcode='42501';end if;
 if p_date is null or p_window_start is null or p_window_end is null
  or p_window_end<=p_window_start or p_window_end-p_window_start>interval '48 hours'
 then raise exception 'نافذة الرصد غير صالحة';end if;
 if char_length(trim(coalesce(p_title,'')))<4 or char_length(p_title)>220
  or char_length(coalesce(p_lead,''))>5000
  or char_length(coalesce(p_analysis,''))>12000
  or char_length(coalesce(p_watchpoints,''))>6000
  or char_length(coalesce(p_methodology,''))>6000
  or char_length(coalesce(p_coverage_note,''))>4000
 then raise exception 'النص خارج الحدود المسموحة';end if;
 if p_id is null then
  insert into sas.briefing_editions(
   slug,edition_date,window_start,window_end,title_ar,lead_ar,analysis_ar,
   watchpoints_ar,methodology_ar,coverage_note_ar,created_by
  ) values(
   to_char(p_date,'YYYY-MM-DD'),p_date,p_window_start,p_window_end,
   trim(p_title),coalesce(p_lead,''),coalesce(p_analysis,''),
   coalesce(p_watchpoints,''),coalesce(p_methodology,''),coalesce(p_coverage_note,''),auth.uid()
  ) returning id into v_id;
 else
  select status into v_status from sas.briefing_editions where id=p_id for update;
  if not found then raise exception 'الإصدار غير موجود';end if;
  if v_status<>'draft' then raise exception 'يسمح تعديل النصوص في حالة المسودة فقط';end if;
  update sas.briefing_editions set
   edition_date=p_date,slug=to_char(p_date,'YYYY-MM-DD'),
   window_start=p_window_start,window_end=p_window_end,title_ar=trim(p_title),
   lead_ar=coalesce(p_lead,''),analysis_ar=coalesce(p_analysis,''),
   watchpoints_ar=coalesce(p_watchpoints,''),methodology_ar=coalesce(p_methodology,''),
   coverage_note_ar=coalesce(p_coverage_note,''),updated_at=now()
  where id=p_id returning id into v_id;
 end if;
 return v_id;
end $$;

create or replace function public.sas_briefing_admin_set_items(
 p_edition_id uuid,p_items jsonb
) returns integer language plpgsql security definer set search_path = ''
as $$
declare v_count integer;v_item jsonb;v_development uuid;v_place text;v_position integer;
begin
 if auth.uid() is null or not exists (
  select 1 from sas.team_members m where m.user_id=auth.uid() and m.active
  and m.role in ('admin','editor')
 ) then raise exception 'غير مصرح' using errcode='42501';end if;
 perform 1 from sas.briefing_editions where id=p_edition_id and status='draft' for update;
 if not found then raise exception 'يمكن تغيير محتويات المسودات فقط';end if;
 if p_items is null or jsonb_typeof(p_items)<>'array'
  or jsonb_array_length(p_items)>80 then raise exception 'قائمة تطورات غير صالحة';end if;
 -- Validate EVERY record before destructive replacement. Entire RPC is transactional.
 for v_item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(v_item)<>'object'
   or coalesce(v_item->>'development_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   or coalesce(v_item->>'placement','') not in ('lead','major','ledger')
   or coalesce(v_item->>'position','') !~ '^[1-9][0-9]{0,3}$'
   or char_length(coalesce(v_item->>'what_changed',''))>3000
   or char_length(coalesce(v_item->>'why_it_matters',''))>3000
   or char_length(coalesce(v_item->>'context',''))>4000
  then raise exception 'بيانات تطور غير صالحة';end if;
  v_development=(v_item->>'development_id')::uuid;
  if not exists(select 1 from sas.developments where id=v_development and editorial_status in ('approved','published'))
  then raise exception 'التطور غير معتمد للتحرير';end if;
 end loop;
 delete from sas.briefing_items where edition_id=p_edition_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_development=(v_item->>'development_id')::uuid;
  v_place=v_item->>'placement';v_position=(v_item->>'position')::integer;
  insert into sas.briefing_items(
   edition_id,development_id,placement,position,what_changed_ar,why_it_matters_ar,context_ar
  )values(p_edition_id,v_development,v_place,v_position,
   coalesce(v_item->>'what_changed',''),coalesce(v_item->>'why_it_matters',''),
   coalesce(v_item->>'context',''));
 end loop;
 select count(*) into v_count from sas.briefing_items where edition_id=p_edition_id;
 return v_count;
end $$;

-- Explicit execution permissions, with internal role checks for each routine.
revoke all on function public.sas_briefing_admin_list() from public,anon;
revoke all on function public.sas_briefing_admin_development_options() from public,anon;
revoke all on function public.sas_briefing_admin_save(uuid,date,timestamptz,timestamptz,text,text,text,text,text,text) from public,anon;
revoke all on function public.sas_briefing_admin_set_items(uuid,jsonb) from public,anon;
grant execute on function public.sas_briefing_admin_list() to authenticated;
grant execute on function public.sas_briefing_admin_development_options() to authenticated;
grant execute on function public.sas_briefing_admin_save(uuid,date,timestamptz,timestamptz,text,text,text,text,text,text) to authenticated;
grant execute on function public.sas_briefing_admin_set_items(uuid,jsonb) to authenticated;
commit;
