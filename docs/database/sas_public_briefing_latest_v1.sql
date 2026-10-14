begin;
create or replace function public.sas_public_briefing_latest()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'date',e.edition_date,'title',e.title_ar,'lead',e.lead_ar,'analysis',e.analysis_ar,'watchpoints',e.watchpoints_ar,'methodology',e.methodology_ar,'coverage_note',e.coverage_note_ar,
  'items',coalesce((select jsonb_agg(jsonb_build_object(
    'title',coalesce(i.headline_override_ar,d.headline_ar),'description',d.description,'what_changed',i.what_changed_ar,'why_it_matters',i.why_it_matters_ar,
    'event_title',v.title_ar,
    'sources',coalesce((select jsonb_agg(jsonb_build_object('name',s.source_name,'url',s.url)) from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=d.id),'[]'::jsonb)
   ) order by case i.placement when 'lead' then 1 when 'major' then 2 else 3 end,i.position)
   from sas.briefing_items i join sas.developments d on d.id=i.development_id join sas.events v on v.id=d.event_id
   where i.edition_id=e.id and d.editorial_status='published'),'[]'::jsonb)
 )
 from sas.briefing_editions e where e.status='published' and e.published_at is not null and e.approved_at is not null and e.checked_at is not null
 order by e.edition_date desc limit 1;
$$;
revoke all on function public.sas_public_briefing_latest() from public;
grant execute on function public.sas_public_briefing_latest() to anon,authenticated;
commit;