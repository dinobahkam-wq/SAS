begin;
create or replace function public.sas_owner_review_packet(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members where user_id=auth.uid() and active and role='admin')
 then raise exception 'صلاحية المدير مطلوبة' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'headline',d.headline_ar,'description',d.description,'occurred_at',d.occurred_at,'editorial_status',d.editorial_status,'updated_at',d.updated_at,'sources',coalesce((select jsonb_agg(jsonb_build_object('name',s.source_name,'url',s.url)) from sas.development_sources ds join sas.sources s on s.id=ds.source_id where ds.development_id=d.id),'[]'::jsonb)) order by d.recorded_at desc) from sas.developments d where d.event_id=p_event_id and d.editorial_status in ('draft','review','approved')),'[]'::jsonb);
end $$;
commit;
