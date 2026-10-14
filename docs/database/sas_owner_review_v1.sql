-- SAS explicit human approval v1. Run once through controlled database migration.
-- This supplements, does not impersonate, the existing independent reviewer workflow.
begin;
create table if not exists sas.editorial_approvals (
 id uuid primary key default gen_random_uuid(),
 target_kind text not null check(target_kind in ('development','event')),
 target_id uuid not null,
 target_version timestamptz not null,
 approved_by uuid not null references auth.users(id),
 approved_at timestamptz not null default now(),
 decision text not null check(decision in ('approved','returned')),
 note text,
 unique(target_kind,target_id,target_version,approved_by,decision)
);
alter table sas.editorial_approvals enable row level security;
revoke all on sas.editorial_approvals from anon,authenticated,public;
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
   then v_missing:=array_append(v_missing,'مصدر أصلي مطلوب');end if;
   if cardinality(v_missing)>0 then return jsonb_build_object('approved',false,'problems',to_jsonb(v_missing));end if;
 end if;
 insert into sas.editorial_approvals(target_kind,target_id,target_version,approved_by,decision,note)
 values('development',p_id,x.updated_at,v_owner,case when p_decision='approve' then 'approved' else 'returned' end,nullif(trim(p_note),'')) returning id into v_approval;
 if p_decision='approve' then
   update sas.developments set editorial_status='approved',reviewed_by=v_owner,reviewed_at=now(),review_note=nullif(trim(p_note),'') where id=p_id;
 else
   if length(trim(p_note))<5 then raise exception 'سبب الإعادة مطلوب';end if;
   update sas.developments set editorial_status='draft',reviewed_by=v_owner,reviewed_at=now(),review_note=trim(p_note) where id=p_id;
 end if;
 return jsonb_build_object('approved',p_decision='approve','approval_id',v_approval,'target_id',p_id);
end $$;
revoke all on function public.sas_owner_review_development(uuid,timestamptz,text,text) from public,anon;
grant execute on function public.sas_owner_review_development(uuid,timestamptz,text,text) to authenticated;
commit;
