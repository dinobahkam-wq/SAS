'use client';
import {useCallback,useEffect,useState} from 'react';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import Link from 'next/link';
type Kind='dossiers'|'issues'|'events';
type Item={id:string;title:string;slug:string;status:string;public_visible:boolean};
type Overview={role:string;dossiers:Item[];issues:Item[];events:Item[]};
const names:Record<Kind,string>={dossiers:'الملفات',issues:'القضايا',events:'الأحداث'};
function client():SupabaseClient|null{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null;
}
export default function Admin(){
 const [db]=useState(client);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [session,setSession]=useState(false);
 const [overview,setOverview]=useState<Overview|null>(null);
 const [kind,setKind]=useState<Kind>('dossiers');
 const [title,setTitle]=useState('');
 const [slug,setSlug]=useState('');
 const [description,setDescription]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 const [editTitle,setEditTitle]=useState('');
 const [editDescription,setEditDescription]=useState('');
 const [linkOptions,setLinkOptions]=useState<{id:string;title:string}[]>([]);
 const [linkSelected,setLinkSelected]=useState<string[]>([]);
 const refresh=useCallback(async()=>{
  if(!db)return;
  const {data,error}=await db.rpc('sas_admin_overview');
  if(error){setOverview(null);setMessage(error.message);return}
  setOverview(data as Overview);setMessage('');
 },[db]);
 useEffect(()=>{
  if(!db)return;
  let active=true;
  db.auth.getSession().then(({data})=>{if(!active)return;const signed=!!data.session;setSession(signed);if(signed)void refresh()});
  const {data:listener}=db.auth.onAuthStateChange((_event,s)=>{setSession(!!s);if(!s)setOverview(null);});
  return()=>{active=false;listener.subscription.unsubscribe()};
 },[db,refresh]);
 async function login(e:React.FormEvent){e.preventDefault();if(!db)return;setBusy(true);setMessage('');
  const {error}=await db.auth.signInWithPassword({email,password});
  setBusy(false);setPassword('');
  if(error){setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');return}
  setSession(true);await refresh();
 }
 async function save(e:React.FormEvent){e.preventDefault();if(!db||!overview)return;setBusy(true);setMessage('');
  const {error}=await db.rpc('sas_admin_create_draft',{p_kind:kind,p_title:title.trim(),p_slug:slug.trim().toLowerCase(),p_description:description.trim()});
  setBusy(false);
  if(error){setMessage('لم تحفظ المسودة: '+error.message);return}
  setTitle('');setSlug('');setDescription('');await refresh();setMessage('حُفظت المسودة دون نشرها.');
 }
 async function openDraft(item:Item){
  if(!db||item.status!=='draft'||item.public_visible)return;
  setBusy(true);setMessage('');
  const {data,error}=await db.rpc('sas_admin_draft_details',{p_kind:kind,p_id:item.id});
  setBusy(false);
  if(error||!data){setMessage('تعذر فتح المسودة');return}
  setEditing(item.id);setEditTitle(data.title??'');setEditDescription(data.description??'');
  setLinkOptions([]);setLinkSelected([]);
  if(kind==='issues'||kind==='events'){
   const result=await db.rpc('sas_admin_links',{p_kind:kind,p_id:item.id});
   if(result.error){setMessage('تعذر تحميل العلاقات: '+result.error.message)}
   else{setLinkOptions(result.data?.options??[]);setLinkSelected(result.data?.selected??[])}
  }
 }
 async function updateDraft(e:React.FormEvent){
  e.preventDefault();if(!db||!editing)return;
  setBusy(true);
  const {error}=await db.rpc('sas_admin_update_draft',{p_kind:kind,p_id:editing,p_title:editTitle.trim(),p_description:editDescription.trim()});
  setBusy(false);
  if(error){setMessage('تعذر حفظ التعديل: '+error.message);return}
  if(kind==='issues'||kind==='events'){
   const links=await db.rpc('sas_admin_set_links',{p_kind:kind,p_id:editing,p_target_ids:linkSelected});
   if(links.error){setMessage('حفظ النص بنجاح، لكن حفظ العلاقات تعذر: '+links.error.message);return}
  }
  setEditing(null);await refresh();setMessage('حُفظت التعديلات دون نشر.');
 }
 async function logout(){await db?.auth.signOut();setOverview(null);setSession(false)}
 return <main className="admin-page">
 <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><strong>إدارة المحتوى</strong></div>
 <div className="admin-heading"><div><span className="eyebrow">مساحة الفريق</span><h1>إدارة محتوى ساس</h1><p>إنشاء المسودات ومراجعة السجلات قبل إتاحتها للقراء.</p></div>{session&&<button type="button" onClick={logout}>تسجيل الخروج</button>}</div>
 {!db?<section className="admin-panel"><h2>إعداد الاتصال مطلوب</h2><p>أضف عنوان Supabase والمفتاح العام إلى ملف البيئة المحلي ثم أعد تشغيل الخادم.</p></section>
 :!session?<form className="admin-panel admin-login" onSubmit={login}><h2>دخول أعضاء الفريق</h2><p>حسابات العاملين المعتمدين فقط؛ لا يتاح التسجيل الذاتي من هذه الصفحة.</p><label>البريد الإلكتروني<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" disabled={busy}>دخول</button>{message&&<p role="alert" className="admin-feedback">{message}</p>}</form>
 :!overview?<section className="admin-panel"><h2>التحقق من صلاحية الوصول</h2><p>يتطلب الدخول عضوية نشطة في فريق تحرير ساس.</p><button type="button" onClick={()=>void refresh()}>إعادة التحقق</button>{message&&<p role="alert">{message}</p>}</section>
 :<div className="admin-grid"><section className="admin-panel"><span className="tag">صلاحية: {overview.role==='admin'?'مدير':overview.role==='editor'?'محرر':overview.role==='reviewer'?'مراجع':'باحث'}</span><h2>السجلات التحريرية</h2><div className="admin-tabs">{(Object.keys(names) as Kind[]).map(k=><button key={k} type="button" className={kind===k?'selected':''} onClick={()=>setKind(k)}>{names[k]} <span>{overview[k]?.length??0}</span></button>)}</div><div className="admin-records">{overview[kind]?.length?overview[kind].map(item=><article key={item.id}><strong>{item.title}</strong><small>{item.slug}</small><span>{item.public_visible?'متاح للجمهور':'غير منشور'} · {item.status==='draft'?'مسودة':item.status}</span>{item.status==='draft'&&!item.public_visible&&<button type="button" disabled={busy} onClick={()=>void openDraft(item)}>فتح المسودة</button>}</article>):<p>لا توجد سجلات ضمن هذا القسم.</p>}</div></section>
 <section className="admin-panel">{editing?<><h2>تحرير المسودة</h2><p>التعديل لا ينشر المادة.</p><form onSubmit={updateDraft}><label>العنوان<input required minLength={4} maxLength={220} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label><label>الوصف<textarea rows={7} maxLength={8000} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>{(kind==='issues'||kind==='events')&&<fieldset className="admin-links"><legend>{kind==='issues'?'ربط القضية بالملفات':'ربط الحدث بالقضايا'}</legend>{linkOptions.length?linkOptions.map(option=><label key={option.id}><input type="checkbox" checked={linkSelected.includes(option.id)} onChange={e=>setLinkSelected(old=>e.target.checked?[...old,option.id]:old.filter(x=>x!==option.id))}/>{option.title}</label>):<p>لا توجد عناصر متاحة للربط حاليًا.</p>}</fieldset>}<button type="submit" disabled={busy}>حفظ التعديلات والعلاقات</button><button type="button" onClick={()=>setEditing(null)}>إلغاء التحرير</button></form></>:<><h2>مسودة جديدة</h2><p>كل محتوى يُنشأ هنا يبقى غير منشور حتى استكمال المراجعة وإجراء الاعتماد التحريري.</p>{['admin','editor'].includes(overview.role)?<form onSubmit={save} className="admin-form"><label>نوع المادة<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{(Object.keys(names) as Kind[]).map(k=><option value={k} key={k}>{names[k]}</option>)}</select></label><label>العنوان<input minLength={4} maxLength={220} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان المادة"/></label><label>المعرّف في الرابط (حروف لاتينية صغيرة وأرقام وشرطات)<input dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} required value={slug} onChange={e=>setSlug(e.target.value)} placeholder="yemen-crisis"/></label><label>وصف أو ملخص<textarea rows={5} maxLength={8000} value={description} onChange={e=>setDescription(e.target.value)}/></label><button disabled={busy} type="submit">حفظ كمسودة</button></form>:<p>دورك يسمح بالاطلاع دون إنشاء مسودات.</p>}</>}{message&&<p role="status" className="admin-feedback">{message}</p>}</section></div>}
 </main>;
}
