-- Secure authenticated editorial preview for unpublished briefing; not available to anonymous users.
begin;
create or replace function public.sas_briefing_editorial_preview(p_date date)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_result jsonb;
begin
 if auth.uid() is null or not exists(
  select 1 from sas.team_members m where m.user_id=auth.uid() and m.active
 ) then raise exception 'هذا العرض متاح فقط لفريق التحرير' using errcode='42501'; end if;
 select jsonb_build_object(
  'date',e.edition_date,'edition_no',e.edition_no,'status',e.status,
  'title',e.title_ar,'lead',e.lead_ar,'analysis',e.analysis_ar,
  'watchpoints',e.watchpoints_ar,'methodology',e.methodology_ar,
  'coverage_note',e.coverage_note_ar,'window_start',e.window_start,
  'window_end',e.window_end,'checked_at',e.checked_at,
  'items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',i.id,'placement',i.placement,'position',i.position,
    'title',coalesce(i.headline_override_ar,d.headline_ar),
    'description',d.description,
    'what_changed',i.what_changed_ar,
    'why_it_matters',i.why_it_matters_ar,'context',i.context_ar,
    'event_title',ev.title_ar,'event_slug',ev.slug,
    'occurred_at',d.occurred_at,'verification_status',d.verification_status,
    'sources',coalesce((
      select jsonb_agg(jsonb_build_object('name',s.source_name,'url',s.url,'role',ds.evidence_role))
      from sas.development_sources ds join sas.sources s on s.id=ds.source_id
      where ds.development_id=d.id
    ),'[]'::jsonb)
   ) order by case i.placement when 'lead' then 1 when 'major' then 2 else 3 end,i.position)
   from sas.briefing_items i
   join sas.developments d on d.id=i.development_id
   join sas.events ev on ev.id=d.event_id
   where i.edition_id=e.id
  ),'[]'::jsonb)
 ) into v_result
 from sas.briefing_editions e where e.edition_date=p_date;
 return v_result;
end $$;
revoke all on function public.sas_briefing_editorial_preview(date) from public,anon;
grant execute on function public.sas_briefing_editorial_preview(date) to authenticated;
commit;
