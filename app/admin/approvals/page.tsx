'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
type Event={id:string;title:string};
type EventReview={id:string;title:string;summary:string;updated_at:string;starts_at:string|null;editorial_stage:string;verification_status:string;public_visible:boolean};
type RecordItem={id:string;headline:string;description:string|null;occurred_at:string|null;editorial_status:string;updated_at:string;sources:{name:string;url:string}[]};
const client=():SupabaseClient|null=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null};
export default function OwnerReview(){
 const [db]=useState(client),[role,setRole]=useState(''),[events,setEvents]=useState<Event[]>([]);
 const [eventId,setEventId]=useState(''),[items,setItems]=useState<RecordItem[]>([]);
 const [eventReviews,setEventReviews]=useState<EventReview[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!db)return;let active=true;void db.auth.getSession().then(async ({data})=>{if(!data.session||!active)return;const r=await db.rpc('sas_admin_overview');if(!active)return;const overview=r.data as {role?:string;events?:{id:string;title:string}[]}|null;setRole(overview?.role||'');setEvents(overview?.events||[]);if(overview?.role==='admin'){const ev=await db.rpc('sas_owner_event_review_packet');if(active&& !ev.error)setEventReviews((ev.data as EventReview[])||[])}});return()=>{active=false}},[db]);
 async function load(id:string){if(!db||!id)return;setEventId(id);setBusy(true);setMessage('');const {data,error}=await db.rpc('sas_owner_review_packet',{p_event_id:id});setBusy(false);if(error){setMessage('تعذر فتح حزمة الاعتماد: '+error.message);return}setItems((data as RecordItem[])||[])}
 async function decide(item:RecordItem,decision:'approve'|'return'){
  if(!db||busy||role!=='admin')return;
  const prompt=decision==='approve'?'هل قرأت العنوان والمتن والمصدر وتاريخ التطور وتوافق على اعتماد هذه النسخة تحديدًا؟':'هل تريد إرجاع هذه المسودة للتحرير؟';
  if(!window.confirm(prompt))return;
  let note='';
  if(decision==='return'){const entered=window.prompt('أدخل سبب الإعادة (خمسة أحرف على الأقل)');if(!entered||entered.trim().length<5)return;note=entered.trim()}
  setBusy(true);setMessage('');
  const {data,error}=await db.rpc('sas_owner_review_development',{p_id:item.id,p_expected_updated_at:item.updated_at,p_decision:decision,p_note:note});
  if(error)setMessage('فشل اعتماد النسخة: '+error.message);
  else {const reply=data as {approved?:boolean;problems?:string[]};setMessage(reply.approved?'اعتمد المدير هذه النسخة وسُجّل القرار، ولم يتم نشرها بعد.':(reply.problems?.length?'متطلبات ناقصة: '+reply.problems.join('، '):'أعيدت المسودة للتحرير'))}
  setBusy(false);await load(eventId);
 }
 async function refreshEvents(){if(!db)return;const r=await db.rpc('sas_owner_event_review_packet');if(!r.error)setEventReviews((r.data as EventReview[])||[])}
 async function eventDecision(item:EventReview,operation:'approve'|'publish'){
  if(!db||busy||role!=='admin')return;
  if(!window.confirm(operation==='approve'?'هل اطلعت على ملخص الحدث وتاريخه ومصادره وتوافق على اعتماد النسخة الحالية؟':'هل تريد نشر الحدث المعتمد للجمهور الآن؟'))return;
  setBusy(true);setMessage('');
  const request=operation==='approve'?db.rpc('sas_owner_approve_event',{p_id:item.id,p_expected_updated_at:item.updated_at}):db.rpc('sas_owner_publish_event',{p_id:item.id});
  const {data,error}=await request;
  if(error)setMessage('تعذر تنفيذ القرار: '+error.message);
  else {const result=data as {approved?:boolean;published?:boolean;problems?:string[]};setMessage(result.approved?'تم تسجيل اعتماد الحدث، ولم يُنشر بعد.':result.published?'تم نشر الحدث في قاعدة ساس.':(result.problems||['لم يجتز الحدث فحص الجاهزية']).join('، '))}
  setBusy(false);await refreshEvents();
 }
 async function publish(item:RecordItem){
  if(!db||busy||role!=='admin')return;
  setBusy(true);setMessage('');
  const check=await db.rpc('sas_owner_publication_check',{p_id:item.id});
  if(check.error){setMessage('تعذر فحص النشر: '+check.error.message);setBusy(false);return}
  const result=check.data as {ready:boolean;problems?:string[]};
  if(!result.ready){setMessage('النشر غير جاهز: '+(result.problems||[]).join('، '));setBusy(false);return}
  if(!window.confirm('نشر هذا التطور المعتمد الآن للجمهور؟')){setBusy(false);return}
  const answer=await db.rpc('sas_owner_publish_development',{p_id:item.id});
  if(answer.error)setMessage('فشل النشر: '+answer.error.message);
  else {const output=answer.data as {published?:boolean;problems?:string[]};setMessage(output.published?'نُشر التطور المعتمد في قاعدة ساس؛ راجع واجهة الحدث العامة.':'تعذر النشر: '+(output.problems||[]).join('، '))}
  setBusy(false);await load(eventId);
 }
 return <main className="knowledge-page"><div className="knowledge-breadcrumb"><Link href="/admin">الإدارة</Link><span>←</span><strong>الاعتماد التحريري</strong></div><header className="knowledge-hero"><h1>اعتماد مدير ساس</h1><p>راجع المادة والمصادر وتاريخها قبل اتخاذ القرار. الاعتماد مرتبط بإصدار محدد، ولا ينشر المادة تلقائيًا.</p></header>
 {role!=='admin'?<p>يرجى تسجيل الدخول من لوحة الإدارة بحساب مدير ساس.</p>:<section className="knowledge-primary"><label>الحدث <select value={eventId} onChange={e=>void load(e.target.value)}><option value="">اختر الحدث</option>{events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
 {message&&<p role="status">{message}</p>}
 <section><h2>مراجعة الأحداث</h2>{eventReviews.map(ev=><article key={ev.id} className="sas-news-item"><h3>{ev.title}</h3><p>{ev.summary}</p><p>التاريخ: {ev.starts_at||'لم يحدد'} — التحقق: {ev.verification_status}</p><p>إصدار: {ev.updated_at}</p><div style={{display:'flex',gap:12}}>{ev.editorial_stage!=='approved'?<button type="button" disabled={busy} onClick={()=>void eventDecision(ev,'approve')}>اعتماد الحدث</button>:<button type="button" disabled={busy} onClick={()=>void eventDecision(ev,'publish')}>نشر الحدث المعتمد</button>}</div></article>)}</section>
 {items.map(item=><article className="sas-news-item" key={item.id}><h2>{item.headline}</h2>{item.occurred_at&&<time dir="ltr">{item.occurred_at}</time>}<p className="sas-news-body">{item.description}</p><p><strong>المصادر</strong></p>{item.sources?.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></p>)}<small>إصدار المسودة: {item.updated_at}</small><div style={{display:'flex',gap:12,marginTop:16}}>{item.editorial_status!=='approved'?<button disabled={busy} type="button" onClick={()=>void decide(item,'approve')}>اعتماد هذه النسخة</button>:<button disabled={busy} type="button" onClick={()=>void publish(item)}>نشر النسخة المعتمدة</button>}{item.editorial_status!=='approved'&&<button disabled={busy} type="button" onClick={()=>void decide(item,'return')}>إعادة للتحرير</button>}</div></article>)}
 </section>}</main>;
}
