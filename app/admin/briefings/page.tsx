'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
type Edition={id:string;edition_no:number;date:string;status:string;title:string;lead:string;analysis:string;watchpoints:string;methodology:string;coverage_note:string;window_start:string;window_end:string;items:EditionItem[]};
type EditionItem={id:string;development_id:string;placement:Placement;position:number;headline:string;what_changed:string;why_it_matters:string;context:string};
type Option={id:string;headline:string;occurred_at:string|null;editorial_status:string;event_title:string};
type Placement='lead'|'major'|'ledger';
type Chosen={development_id:string;placement:Placement;position:number;what_changed:string;why_it_matters:string;context:string};
const headings:Record<Placement,string>={lead:'افتتاحية',major:'تحول رئيسي',ledger:'سجل التطورات'};
function client():SupabaseClient|null{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key,{auth:{persistSession:true}}):null}
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
const dateToLocal=(v:string)=>v?v.slice(0,16):'';
const initial=()=>({id:'' as string,date:localDate(),windowStart:'',windowEnd:'',title:'الإحاطة اليمنية',lead:'',analysis:'',watchpoints:'',methodology:'',coverageNote:''});
export default function BriefingAdmin(){
 const [db]=useState(client),[session,setSession]=useState(false),[role,setRole]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [editions,setEditions]=useState<Edition[]>([]),[options,setOptions]=useState<Option[]>([]);
 const [form,setForm]=useState(initial),[chosen,setChosen]=useState<Chosen[]>([]);
 const [newDevelopment,setNewDevelopment]=useState(''),[newPlacement,setNewPlacement]=useState<Placement>('ledger');
 const [status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const writable=role==='admin'||role==='editor';
 useEffect(()=>{
  if(!db)return;
  let live=true;db.auth.getSession().then(({data})=>{if(live)setSession(Boolean(data.session))});
  const {data:auth}=db.auth.onAuthStateChange((_event,s)=>{if(live)setSession(Boolean(s))});
  return()=>{live=false;auth.subscription.unsubscribe()};
 },[db]);
 useEffect(()=>{
  if(!db||!session){setRole('');setEditions([]);setOptions([]);return}
  let live=true;
  void Promise.all([db.rpc('sas_admin_overview'),db.rpc('sas_briefing_admin_list'),db.rpc('sas_briefing_admin_development_options')]).then(([overview,list,developments])=>{
   if(!live)return;
   if(overview.error){setStatus('تعذر تحديد الصلاحيات: '+overview.error.message);return}
   const r=String((overview.data as {role?:string}|null)?.role||'');setRole(r);
   if(list.error||developments.error){
    setStatus('وظائف الإحاطة غير مفعّلة على قاعدة البيانات بعد. يجب اعتماد ترحيل SQL قبل الحفظ. '+(list.error?.message||developments.error?.message||''));
    return;
   }
   setEditions((list.data as Edition[])||[]);setOptions((developments.data as Option[])||[]);setStatus('');
  }).catch(()=>{if(live)setStatus('تعذر الاتصال بوظائف الإحاطة')});
  return()=>{live=false};
 },[db,session]);
 async function login(e:React.FormEvent){e.preventDefault();if(!db)return;setBusy(true);setStatus('');const {error}=await db.auth.signInWithPassword({email,password});setBusy(false);setPassword('');if(error)setStatus('فشل تسجيل الدخول: '+error.message)}
 async function reload(){if(!db)return;const [a,b]=await Promise.all([db.rpc('sas_briefing_admin_list'),db.rpc('sas_briefing_admin_development_options')]);if(a.error||b.error){setStatus(a.error?.message||b.error?.message||'فشل التحديث');return}setEditions((a.data as Edition[])||[]);setOptions((b.data as Option[])||[])}
 function loadEdition(e:Edition){setForm({id:e.id,date:e.date,title:e.title,lead:e.lead,analysis:e.analysis,watchpoints:e.watchpoints,methodology:e.methodology,coverageNote:e.coverage_note,windowStart:dateToLocal(e.window_start),windowEnd:dateToLocal(e.window_end)});setChosen((e.items||[]).map(x=>({development_id:x.development_id,placement:x.placement,position:x.position,what_changed:x.what_changed||'',why_it_matters:x.why_it_matters||'',context:x.context||''})));setStatus(e.status==='draft'?'':'هذا الإصدار خارج حالة المسودة؛ عرضه للمراجعة فقط.')}
 function update<K extends keyof ReturnType<typeof initial>>(key:K,value:ReturnType<typeof initial>[K]){setForm(p=>({...p,[key]:value}))}
 function add(){if(!newDevelopment||chosen.some(x=>x.development_id===newDevelopment))return;const position=chosen.filter(x=>x.placement===newPlacement).length+1;setChosen(v=>[...v,{development_id:newDevelopment,placement:newPlacement,position,what_changed:'',why_it_matters:'',context:''}]);setNewDevelopment('')}
 function changeItem(i:number,key:keyof Chosen,value:string){setChosen(v=>v.map((x,j)=>j===i?{...x,[key]:value}:x))}
 function removeItem(i:number){setChosen(v=>v.filter((_,j)=>j!==i).map((x,j,a)=>({...x,position:a.slice(0,j+1).filter(z=>z.placement===x.placement).length})))}
 async function save(e:React.FormEvent){e.preventDefault();if(!db||!writable||busy)return;setBusy(true);setStatus('');
  try{
   const a=new Date(form.windowStart),b=new Date(form.windowEnd);
   if(!form.windowStart||!form.windowEnd||Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))throw Error('أدخل نافذة الرصد كاملة');
   const {data,error}=await db.rpc('sas_briefing_admin_save',{p_id:form.id||null,p_date:form.date,p_window_start:a.toISOString(),p_window_end:b.toISOString(),p_title:form.title,p_lead:form.lead,p_analysis:form.analysis,p_watchpoints:form.watchpoints,p_methodology:form.methodology,p_coverage_note:form.coverageNote});
   if(error)throw Error(error.message);
   const id=String(data);setForm(p=>({...p,id}));
   const items=chosen.map((x,i)=>({...x,position:chosen.slice(0,i+1).filter(y=>y.placement===x.placement).length}));
   const linked=await db.rpc('sas_briefing_admin_set_items',{p_edition_id:id,p_items:items});
   if(linked.error)throw Error('حُفظت بيانات العدد، لكن ربط التطورات لم ينجح: '+linked.error.message);
   setStatus('حُفظت المسودة ومحتوياتها دون نشر.');await reload();
  }catch(err){setStatus(err instanceof Error?err.message:'فشل الحفظ')}finally{setBusy(false)}
 }
 return <main className="knowledge-page brief-admin"><header className="knowledge-hero"><span className="eyebrow">ساس / بيئة التحرير</span><h1>محرر الإحاطة اليومية</h1><p>مسودات فقط · لا يوجد إجراء نشر أو تعديل على البيانات الأصلية للتطورات في هذا الإصدار.</p></header>
 {!db?<p role="alert">إعدادات Supabase العامة غير متاحة.</p>:!session?<form className="brief-admin-panel" onSubmit={e=>void login(e)}><h2>دخول هيئة التحرير</h2><label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>دخول</button></form>:<div className="brief-admin-layout"><aside className="brief-admin-panel"><h2>الإصدارات</h2><button type="button" onClick={()=>{setForm(initial());setChosen([]);setStatus('')}}>+ إصدار جديد</button>{editions.map(x=><button type="button" className="brief-admin-edition" key={x.id} onClick={()=>loadEdition(x)}><strong>{x.date} · العدد {x.edition_no}</strong><small>{x.status} · {x.items?.length||0} تطورات</small></button>)}{!editions.length&&<p>لا توجد إصدارات محفوظة بعد.</p>}<p><Link href="/briefings/preview">فتح معاينة الإحاطة ←</Link></p></aside>
 <section className="brief-admin-panel"><h2>{form.id?'تحرير المسودة':'إعداد إصدار جديد'}</h2>{!writable&&<p role="alert">الحساب الحالي مخصص للمراجعة، ولا يملك صلاحية تحرير المسودات.</p>}
 <form onSubmit={e=>void save(e)}><div className="brief-admin-row"><label>تاريخ الإصدار<input type="date" required value={form.date} onChange={e=>update('date',e.target.value)}/></label><label>بداية الرصد<input type="datetime-local" required value={form.windowStart} onChange={e=>update('windowStart',e.target.value)}/></label><label>نهاية الرصد<input type="datetime-local" required value={form.windowEnd} onChange={e=>update('windowEnd',e.target.value)}/></label></div>
 <label>عنوان الإحاطة<input value={form.title} required maxLength={220} onChange={e=>update('title',e.target.value)}/></label>
 {([['lead','المشهد في دقيقة'],['analysis','قراءة ساس'],['watchpoints','ما الذي نراقبه؟'],['methodology','منهجية الاختيار'],['coverageNote','حدود التغطية']] as const).map(([key,label])=><label key={key}>{label}<textarea rows={key==='lead'?4:3} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}
 <h3>التطورات المرتبطة</h3><p className="studio-note">لا ننسخ التطور. نربطه بالإصدار ونكتب تفسيره الخاص. تظهر التطورات المعتمدة فقط.</p>
 <div className="brief-admin-row"><label>التطور<select value={newDevelopment} onChange={e=>setNewDevelopment(e.target.value)}><option value="">اختر تطورًا معتمدًا</option>{options.filter(o=>!chosen.some(x=>x.development_id===o.id)).map(o=><option key={o.id} value={o.id}>{o.event_title} — {o.headline}</option>)}</select></label><label>مكان العرض<select value={newPlacement} onChange={e=>setNewPlacement(e.target.value as Placement)}>{(Object.keys(headings) as Placement[]).map(k=><option key={k} value={k}>{headings[k]}</option>)}</select></label><button type="button" onClick={add} disabled={!newDevelopment}>إضافة</button></div>
 {chosen.map((x,i)=><div className="brief-admin-item" key={x.development_id}><div className="brief-admin-item-head"><strong>{headings[x.placement]} · {options.find(o=>o.id===x.development_id)?.headline||x.development_id}</strong><button type="button" onClick={()=>removeItem(i)}>إزالة</button></div><label>ما الذي تغيّر؟<textarea rows={2} value={x.what_changed} onChange={e=>changeItem(i,'what_changed',e.target.value)}/></label><label>لماذا يهم؟<textarea rows={2} value={x.why_it_matters} onChange={e=>changeItem(i,'why_it_matters',e.target.value)}/></label><label>السياق<textarea rows={2} value={x.context} onChange={e=>changeItem(i,'context',e.target.value)}/></label></div>)}
 <button type="submit" disabled={!writable||busy}>{busy?'جارٍ الحفظ…':'حفظ المسودة والتطورات'}</button></form>
 {status&&<p role="status" className="admin-feedback">{status}</p>}</section></div>}
 </main>
}
