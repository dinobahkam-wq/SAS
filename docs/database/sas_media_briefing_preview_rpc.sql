begin;
create or replace function public.sas_media_editor_briefing(p_date date)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from sas.team_members m where m.user_id=auth.uid() and m.active)
 then raise exception 'غير مصرح' using errcode='42501';end if;
 return coalesce((
 select jsonb_agg(jsonb_build_object('path',a.storage_path,'alt',a.alt_ar,'caption',coalesce(l.caption_override_ar,a.caption_ar),'credit',a.attribution_ar,'source',a.source_name,'rights',a.rights_status,'verified',a.verification_status,'kind',a.media_kind,'role',l.display_role) order by l.position)
 from sas.media_links l join sas.media_assets a on a.id=l.asset_id
 join sas.briefing_editions e on e.id=l.briefing_edition_id where e.edition_date=p_date
 ),'[]'::jsonb);
end $$;
revoke all on function public.sas_media_editor_briefing(date) from public,anon;
grant execute on function public.sas_media_editor_briefing(date) to authenticated;
commit;