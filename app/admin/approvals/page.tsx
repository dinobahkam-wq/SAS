'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
type Event={id:string;title:string};
type RecordItem={id:string;headline:string;description:string|null;occurred_at:string|null;editorial_status:string;updated_at:string;sources:{name:string;url:string}[]};
const client=():SupabaseClient|null=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null};
export default function OwnerReview(){
 const [db]=useState(client),[role,setRole]=useState(''),[events,setEvents]=useState<Event[]>([]);
 const [eventId,setEventId]=useState(''),[items,setItems]=useState<RecordItem[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!db)return;let active=true;void db.auth.getSession().then(async ({data})=>{if(!data.session||!active)return;const r=await db.rpc('sas_admin_overview');if(!active)return;const overview=r.data as {role?:string;events?:{id:string;title:string}[]}|null;setRole(overview?.role||'');setEvents(overview?.events||[])});return()=>{active=false}},[db]);
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
 return <main className="knowledge-page"><div className="knowledge-breadcrumb"><Link href="/admin">الإدارة</Link><span>←</span><strong>الاعتماد التحريري</strong></div><header className="knowledge-hero"><h1>اعتماد مدير ساس</h1><p>راجع المادة والمصادر وتاريخها قبل اتخاذ القرار. الاعتماد مرتبط بإصدار محدد، ولا ينشر المادة تلقائيًا.</p></header>
 {role!=='admin'?<p>يرجى تسجيل الدخول من لوحة الإدارة بحساب مدير ساس.</p>:<section className="knowledge-primary"><label>الحدث <select value={eventId} onChange={e=>void load(e.target.value)}><option value="">اختر الحدث</option>{events.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
 {message&&<p role="status">{message}</p>}
 {items.map(item=><article className="sas-news-item" key={item.id}><h2>{item.headline}</h2>{item.occurred_at&&<time dir="ltr">{item.occurred_at}</time>}<p className="sas-news-body">{item.description}</p><p><strong>المصادر</strong></p>{item.sources?.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></p>)}<small>إصدار المسودة: {item.updated_at}</small><div style={{display:'flex',gap:12,marginTop:16}}><button disabled={busy} type="button" onClick={()=>void decide(item,'approve')}>اعتماد هذه النسخة</button><button disabled={busy} type="button" onClick={()=>void decide(item,'return')}>إعادة للتحرير</button></div></article>)}
 </section>}</main>;
}
