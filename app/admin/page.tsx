'use client';
import {formatSasDate} from '../../lib/date-format';
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
 const [quickEdit,setQuickEdit]=useState<string|null>(null);
 const [quickTitle,setQuickTitle]=useState('');
 const [quickDescription,setQuickDescription]=useState('');
 const [editTitle,setEditTitle]=useState('');
 const [editDescription,setEditDescription]=useState('');
 const [linkOptions,setLinkOptions]=useState<{id:string;title:string}[]>([]);
 const [linkSelected,setLinkSelected]=useState<string[]>([]);
 const [developmentHeadline,setDevelopmentHeadline]=useState('');
 const [developmentDescription,setDevelopmentDescription]=useState('');
 const [developmentDate,setDevelopmentDate]=useState('');
 const [developmentSource,setDevelopmentSource]=useState('');
 const [developmentUrl,setDevelopmentUrl]=useState('');
 const [activeDevelopment,setActiveDevelopment]=useState<string|null>(null);
 const [devEditHeadline,setDevEditHeadline]=useState('');
 const [devEditDescription,setDevEditDescription]=useState('');
 const [devEditDate,setDevEditDate]=useState('');
 const [additionalSourceName,setAdditionalSourceName]=useState('');
 const [additionalSourceUrl,setAdditionalSourceUrl]=useState('');
 const [evidenceRole,setEvidenceRole]=useState('reports');
 const [reviewNote,setReviewNote]=useState('');
 const [publicationChecks,setPublicationChecks]=useState<Record<string,{ready:boolean;problems:string[]}>>({});
 const [publicationQueue,setPublicationQueue]=useState<{id:string;headline:string;event_title:string;event_slug:string}[]>([]);
 const [queueError,setQueueError]=useState('');
 const [developments,setDevelopments]=useState<{id:string;headline:string;description:string|null;occurred_at:string|null;editorial_status:string;submitted_by:string|null;review_note:string|null;sources:{name:string;url:string}[]}[]>([]);

 const refresh=useCallback(async()=>{
  if(!db)return;
  const {data,error}=await db.rpc('sas_admin_overview');
  if(error){setOverview(null);setMessage(error.message);return}
  const latest=data as Overview;setOverview(latest);setMessage('');
  if(latest.role==='admin'){
   const queue=await db.rpc('sas_admin_publication_queue');
   if(queue.error){setQueueError(queue.error.message);setPublicationQueue([])}
   else {setQueueError('');setPublicationQueue(queue.data??[])}
  }else{setPublicationQueue([]);setPublicationChecks({});setQueueError('')}
 },[db]);
 useEffect(()=>{
  if(!db)return;
  let active=true;
  db.auth.getSession().then(({data})=>{if(!active)return;const signed=!!data.session;setSession(signed);if(signed)void refresh()});
  const {data:listener}=db.auth.onAuthStateChange((_event,s)=>{setSession(!!s);if(!s){setOverview(null);setPublicationQueue([]);setEditing(null)}else{void refresh()}});
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
  setLinkOptions([]);setLinkSelected([]);setDevelopments([]);setActiveDevelopment(null);
  if(kind==='events'){
    const devs=await db.rpc('sas_admin_event_developments',{p_event_id:item.id});
    if(devs.error)setMessage('تعذر عرض التطورات: '+devs.error.message);
    else setDevelopments(devs.data??[]);
  }
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
 async function addDevelopment(e:React.FormEvent){
  e.preventDefault();if(!db||!editing||kind!=='events')return;
  setBusy(true);setMessage('');
  const {error}=await db.rpc('sas_admin_create_development',{
    p_event_id:editing,p_headline:developmentHeadline.trim(),p_description:developmentDescription.trim(),
    p_occurred_at:developmentDate?new Date(developmentDate).toISOString():null,
    p_source_name:developmentSource.trim()||null,p_source_url:developmentUrl.trim()||null
  });
  setBusy(false);
  if(error){setMessage('تعذر حفظ التطور: '+error.message);return}
  setDevelopmentHeadline('');setDevelopmentDescription('');setDevelopmentDate('');setDevelopmentSource('');setDevelopmentUrl('');
  const {data}=await db.rpc('sas_admin_event_developments',{p_event_id:editing});
  setDevelopments(data??[]);setMessage('حُفظ التطور كمسودة غير منشورة.');
 }
 async function reloadDevelopments(){if(!db||!editing)return;const {data,error}=await db.rpc('sas_admin_event_developments',{p_event_id:editing});if(error)setMessage('تعذر تحديث التطورات: '+error.message);else setDevelopments(data??[])}
 function selectDevelopment(d:(typeof developments)[number]){setActiveDevelopment(d.id);setDevEditHeadline(d.headline);setDevEditDescription(d.description??'');setDevEditDate(d.occurred_at?new Date(d.occurred_at).toISOString().slice(0,16):'');setAdditionalSourceName('');setAdditionalSourceUrl('')}
 async function editDevelopment(e:React.FormEvent){e.preventDefault();if(!db||!activeDevelopment)return;setBusy(true);const {error}=await db.rpc('sas_admin_update_development',{p_development_id:activeDevelopment,p_headline:devEditHeadline.trim(),p_description:devEditDescription.trim(),p_occurred_at:devEditDate?new Date(devEditDate).toISOString():null});setBusy(false);if(error){setMessage('تعذر تعديل التطور: '+error.message);return}await reloadDevelopments();setMessage('حُفظ تعديل التطور دون نشره.')}
 async function attachSource(e:React.FormEvent){e.preventDefault();if(!db||!activeDevelopment)return;setBusy(true);const {error}=await db.rpc('sas_admin_add_development_source',{p_development_id:activeDevelopment,p_source_name:additionalSourceName.trim(),p_source_url:additionalSourceUrl.trim(),p_evidence_role:evidenceRole});setBusy(false);if(error){setMessage('تعذر ربط المصدر: '+error.message);return}setAdditionalSourceName('');setAdditionalSourceUrl('');await reloadDevelopments();setMessage('أُضيف المصدر إلى التطور.')}
 async function reviewDevelopment(id:string,action:'submit'|'approve'|'return'){
 if(!db)return;
 setBusy(true);setMessage('');
 const {error}=await db.rpc('sas_development_review_action',{p_id:id,p_action:action,p_note:reviewNote.trim()});
 setBusy(false);
 if(error){setMessage('لم يكتمل الإجراء: '+error.message);return}
 await reloadDevelopments();setReviewNote('');
 setMessage(action==='submit'?'أُرسلت المادة للمراجعة دون نشر.':action==='approve'?'اعتمدت المادة تحريرياً دون نشر.':'أُعيدت المادة للتعديل.');
 }
 async function checkPublication(id:string){
 if(!db)return;setBusy(true);setMessage('');
 const {data,error}=await db.rpc('sas_publication_check',{p_id:id});
 setBusy(false);
 if(error){setMessage('تعذر فحص الجاهزية: '+error.message);return}
 setPublicationChecks(old=>({...old,[id]:data as {ready:boolean;problems:string[]}}));
 }
 async function publishDevelopment(id:string){
 if(!db||!publicationChecks[id]?.ready||!window.confirm('تأكيد قرار النشر العام لهذا التطور؟'))return;
 setBusy(true);setMessage('');
 const {error}=await db.rpc('sas_publish_development',{p_id:id});
 setBusy(false);
 if(error){setMessage('لم يتم النشر: '+error.message);return}
 setPublicationChecks(old=>({...old,[id]:{ready:false,problems:[]}}));
 await reloadDevelopments();await refresh();setMessage('سُجل قرار النشر؛ تحقق من إتاحة المادة في واجهة الجمهور.');
 }
 async function quickAction(item:Item,action:'publish'|'withdraw'|'save'){
 if(!db||!overview||!['admin','reviewer'].includes(overview.role))return;
 if(action!=='save'&&!window.confirm(action==='publish'?'هل تريد نشر هذه المادة للجمهور؟':'هل تريد سحب هذه المادة من العرض العام مع الاحتفاظ بسجلها؟'))return;
 setBusy(true);setMessage('');
 const {error}=await db.rpc('sas_quick_content_action',{p_kind:kind,p_id:item.id,p_action:action,p_title:action==='save'?quickTitle.trim():null,p_description:action==='save'?quickDescription.trim():null});
 setBusy(false);
 if(error){setMessage('تعذر تنفيذ الإجراء: '+error.message);return}
 setQuickEdit(null);await refresh();setMessage(action==='save'?'حُفظ التعديل.':action==='publish'?'تم نشر المادة.':'سُحبت المادة من العرض العام.');
 }
 async function openQuickEdit(item:Item){
 if(!db)return;setBusy(true);setMessage('');
 const {data,error}=await db.rpc('sas_admin_draft_details',{p_kind:kind,p_id:item.id});
 setBusy(false);if(error||!data){setMessage('تعذر فتح المادة للتعديل: '+(error?.message??''));return}
 setQuickEdit(item.id);setQuickTitle(data.title??'');setQuickDescription(data.description??'');
 }
 async function quickDevelopment(d:(typeof developments)[number],action:'publish'|'withdraw'|'save'){
 if(!db||!overview||!['admin','reviewer'].includes(overview.role))return;
 if(action!=='save'&&!window.confirm(action==='publish'?'تأكيد نشر التطور للجمهور؟':'تأكيد سحب التطور من النشر؟'))return;
 setBusy(true);setMessage('');
 const {error}=await db.rpc('sas_quick_development_action',{p_id:d.id,p_action:action,p_headline:action==='save'?devEditHeadline.trim():null,p_description:action==='save'?devEditDescription.trim():null});
 setBusy(false);
 if(error){setMessage('تعذر تنفيذ الإجراء: '+error.message);return}
 setActiveDevelopment(null);await reloadDevelopments();setMessage(action==='save'?'تم تعديل التطور.':action==='publish'?'نُشر التطور.':'سُحب التطور من النشر.');
 }
 async function logout(){await db?.auth.signOut();setOverview(null);setSession(false)}
 return <main className="admin-page">
 <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><strong>إدارة المحتوى</strong></div>
 <div className="admin-heading"><div><span className="eyebrow">مساحة الفريق</span><h1>إدارة محتوى ساس</h1><p>إنشاء المسودات ومراجعة السجلات قبل إتاحتها للقراء.</p></div>{session&&<button type="button" onClick={logout}>تسجيل الخروج</button>}</div>
 {!db?<section className="admin-panel"><h2>إعداد الاتصال مطلوب</h2><p>أضف عنوان Supabase والمفتاح العام إلى ملف البيئة المحلي ثم أعد تشغيل الخادم.</p></section>
 :!session?<form className="admin-panel admin-login" onSubmit={login}><h2>دخول أعضاء الفريق</h2><p>حسابات العاملين المعتمدين فقط؛ لا يتاح التسجيل الذاتي من هذه الصفحة.</p><label>البريد الإلكتروني<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" disabled={busy}>دخول</button>{message&&<p role="alert" className="admin-feedback">{message}</p>}</form>
 :!overview?<section className="admin-panel"><h2>التحقق من صلاحية الوصول</h2><p>يتطلب الدخول عضوية نشطة في فريق تحرير ساس.</p><button type="button" onClick={()=>void refresh()}>إعادة التحقق</button>{message&&<p role="alert">{message}</p>}</section>
 :<><div className="admin-role-line">الدور الحالي: <strong>{overview.role==='admin'?'مدير':overview.role==='reviewer'?'مراجع':overview.role==='editor'?'محرر':'باحث'}</strong><button type="button" disabled={busy} onClick={()=>void refresh()}>تحديث الصلاحيات والسجلات</button></div>
 {false&&overview?.role==='admin'&&<section className="admin-panel publication-queue"><h2>مركز النشر — المواد المعتمدة</h2><p>تظهر هنا التطورات المعتمدة تحريرياً بغض النظر عن فتح محرر الحدث. الفحص لا ينشر المادة.</p>{queueError&&<p role="alert" className="admin-feedback">تعذر تحميل قائمة النشر: {queueError}</p>}{publicationQueue.length?publicationQueue.map(item=><article key={item.id} className="publication-queue-item"><strong>{item.headline}</strong><small>الحدث: {item.event_title}</small><button type="button" disabled={busy} onClick={()=>void checkPublication(item.id)}>فحص جاهزية النشر</button>{publicationChecks[item.id]&&<div><strong>{publicationChecks[item.id].ready?'جاهز للنشر':'لم تكتمل شروط النشر'}</strong>{publicationChecks[item.id].problems.map((problem,i)=><p key={i}>{problem}</p>)}{publicationChecks[item.id].ready&&<button disabled={busy} type="button" onClick={()=>void publishDevelopment(item.id)}>تأكيد النشر العام</button>}</div>}</article>):<p>لا توجد تطورات معتمدة في قائمة النشر حاليًا.</p>}</section>}
 <div className="admin-grid"><section className="admin-panel"><span className="tag">صلاحية: {overview.role==='admin'?'مدير':overview.role==='editor'?'محرر':overview.role==='reviewer'?'مراجع':'باحث'}</span><h2>السجلات التحريرية</h2><div className="admin-tabs">{(Object.keys(names) as Kind[]).map(k=><button key={k} type="button" className={kind===k?'selected':''} onClick={()=>setKind(k)}>{names[k]} <span>{overview[k]?.length??0}</span></button>)}</div><div className="admin-records">{overview[kind]?.length?overview[kind].map(item=><article key={item.id}><strong>{item.title}</strong><small>{item.slug}</small><span>{item.public_visible?'متاح للجمهور':'غير منشور'} · {item.status==='draft'?'مسودة':item.status}</span>{['admin','reviewer'].includes(overview.role)&&<div className="quick-actions"><button type="button" disabled={busy} onClick={()=>void openQuickEdit(item)}>تعديل</button><button type="button" disabled={busy} onClick={()=>void quickAction(item,'publish')}>نشر</button>{item.public_visible&&<button type="button" disabled={busy} onClick={()=>void quickAction(item,'withdraw')}>سحب من النشر</button>}{quickEdit===item.id&&<div className="quick-edit"><label>العنوان<input value={quickTitle} onChange={e=>setQuickTitle(e.target.value)}/></label><label>الوصف<textarea rows={4} value={quickDescription} onChange={e=>setQuickDescription(e.target.value)}/></label><button type="button" onClick={()=>void quickAction(item,'save')} disabled={busy}>حفظ التعديل</button><button type="button" onClick={()=>setQuickEdit(null)}>إلغاء</button></div>}</div>}
 {item.status==='draft'&&!item.public_visible&&<button type="button" disabled={busy} onClick={()=>void openDraft(item)}>فتح المسودة</button>}</article>):<p>لا توجد سجلات ضمن هذا القسم.</p>}</div></section>
 <section className="admin-panel">{editing?<><h2>تحرير المسودة</h2><p>التعديل لا ينشر المادة.</p><form onSubmit={updateDraft}><label>العنوان<input required minLength={4} maxLength={220} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label><label>الوصف<textarea rows={7} maxLength={8000} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>{(kind==='issues'||kind==='events')&&<fieldset className="admin-links"><legend>{kind==='issues'?'ربط القضية بالملفات':'ربط الحدث بالقضايا'}</legend>{linkOptions.length?linkOptions.map(option=><label key={option.id}><input type="checkbox" checked={linkSelected.includes(option.id)} onChange={e=>setLinkSelected(old=>e.target.checked?[...old,option.id]:old.filter(x=>x!==option.id))}/>{option.title}</label>):<p>لا توجد عناصر متاحة للربط حاليًا.</p>}</fieldset>}<button type="submit" disabled={busy}>حفظ التعديلات والعلاقات</button><button type="button" onClick={()=>setEditing(null)}>إلغاء التحرير</button></form>
 {kind==='events'&&<section className="admin-developments"><h3>تطورات الحدث</h3>
 <div className="admin-records">{developments.length?developments.map(d=><article key={d.id}><strong>{d.headline}</strong><small className="sas-date">{d.occurred_at?formatSasDate(d.occurred_at):'لم يُحدد تاريخ الوقوع'}</small><span>{d.editorial_status==='draft'?'مسودة':d.editorial_status==='review'?'بانتظار المراجعة':d.editorial_status==='approved'?'معتمدة تحريرياً وغير منشورة':d.editorial_status}</span>{d.review_note&&<small>ملاحظة المراجع: {d.review_note}</small>}{d.sources?.map(x=><a dir="ltr" className="sas-source-link" href={x.url} target="_blank" rel="noopener noreferrer" key={x.url}>{x.name} ↗</a>)}{['admin','reviewer'].includes(overview.role)&&<div className="quick-actions"><button type="button" disabled={busy} onClick={()=>selectDevelopment(d)}>تعديل</button><button type="button" disabled={busy} onClick={()=>void quickDevelopment(d,'publish')}>نشر</button>{d.editorial_status==='published'&&<button type="button" disabled={busy} onClick={()=>void quickDevelopment(d,'withdraw')}>سحب من النشر</button>}</div>}
 {false&&d.editorial_status==='draft'&&<button type="button" onClick={()=>selectDevelopment(d)} disabled={busy}>تحرير التطور وإدارة مصادره</button>}
 {false&&d.editorial_status==='draft'&&['admin','editor'].includes(overview?.role??'')&&<button type="button" disabled={busy} onClick={()=>void reviewDevelopment(d.id,'submit')}>تقديم للمراجعة</button>}
 {false&&d.editorial_status==='approved'&&overview?.role!=='admin'&&<p className="admin-feedback">اكتملت المراجعة التحريرية. فحص جاهزية النشر وإصدار قرار النشر متاحان لحساب المدير فقط. سجّل الدخول بحساب المدير لعرض المتطلبات.</p>}
 {false&&d.editorial_status==='approved'&&overview?.role==='admin'&&<div className="publication-gate"><button type="button" disabled={busy} onClick={()=>void checkPublication(d.id)}>فحص جاهزية النشر</button>{publicationChecks[d.id]&&<div><strong>{publicationChecks[d.id].ready?'الشروط مكتملة':'متطلبات قبل النشر'}</strong>{publicationChecks[d.id].problems.map((problem,i)=><p key={i}>{problem}</p>)}{publicationChecks[d.id].ready&&<button type="button" disabled={busy} onClick={()=>void publishDevelopment(d.id)}>تأكيد النشر العام</button>}</div>}</div>}
 {false&&d.editorial_status==='review'&&['admin','reviewer'].includes(overview?.role??'')&&<div className="review-actions"><label>ملاحظة المراجع<textarea rows={2} value={reviewNote} onChange={e=>setReviewNote(e.target.value)}/></label><button type="button" disabled={busy} onClick={()=>void reviewDevelopment(d.id,'approve')}>اعتماد تحريري</button><button type="button" disabled={busy||reviewNote.trim().length<5} onClick={()=>void reviewDevelopment(d.id,'return')}>إعادة للتعديل</button><small>لا يجوز اعتماد المادة بواسطة مقدمها نفسه.</small></div>}</article>):<p>لم تُضف تطورات لهذا الحدث بعد.</p>}</div>
 {activeDevelopment&&<div className="development-editor"><h3>تحرير التطور</h3><form onSubmit={editDevelopment}><label>العنوان<input minLength={5} maxLength={250} required value={devEditHeadline} onChange={e=>setDevEditHeadline(e.target.value)}/></label><label>تاريخ الوقوع<input type="datetime-local" value={devEditDate} onChange={e=>setDevEditDate(e.target.value)}/></label><label>التفاصيل<textarea rows={4} maxLength={12000} value={devEditDescription} onChange={e=>setDevEditDescription(e.target.value)}/></label><button disabled={busy} type="button" onClick={()=>{const d=developments.find(x=>x.id===activeDevelopment);if(d)void quickDevelopment(d,'save')}}>حفظ تعديل التطور</button></form><h3>إضافة مصدر لهذا التطور</h3><form onSubmit={attachSource}><label>اسم المصدر<input required minLength={2} maxLength={250} value={additionalSourceName} onChange={e=>setAdditionalSourceName(e.target.value)}/></label><label>الرابط الأصلي<input dir="ltr" type="url" required placeholder="https://" value={additionalSourceUrl} onChange={e=>setAdditionalSourceUrl(e.target.value)}/></label><label>وظيفة المصدر<select value={evidenceRole} onChange={e=>setEvidenceRole(e.target.value)}><option value="reports">ينقل الخبر</option><option value="primary">مصدر أصلي</option><option value="corroborates">يؤيد المعلومة</option><option value="contradicts">يعارض المعلومة</option></select></label><button disabled={busy} type="submit">إضافة المصدر</button></form><button type="button" onClick={()=>setActiveDevelopment(null)}>إغلاق تحرير التطور</button></div>}
 <form onSubmit={addDevelopment}><h3>إضافة تطور</h3><label>عنوان التطور<input required minLength={5} maxLength={250} value={developmentHeadline} onChange={e=>setDevelopmentHeadline(e.target.value)}/></label><label>تاريخ وقوع التطور<input type="datetime-local" value={developmentDate} onChange={e=>setDevelopmentDate(e.target.value)}/></label><label>التفاصيل<textarea rows={4} maxLength={12000} value={developmentDescription} onChange={e=>setDevelopmentDescription(e.target.value)}/></label><label>اسم المصدر (اختياري)<input maxLength={250} value={developmentSource} onChange={e=>setDevelopmentSource(e.target.value)}/></label><label>رابط المصدر (اختياري، مع الاسم)<input type="url" placeholder="https://" value={developmentUrl} onChange={e=>setDevelopmentUrl(e.target.value)}/></label><button type="submit" disabled={busy}>حفظ التطور كمسودة</button></form></section>}
</>:<><h2>مسودة جديدة</h2><p>كل محتوى يُنشأ هنا يبقى غير منشور حتى استكمال المراجعة وإجراء الاعتماد التحريري.</p>{['admin','editor','reviewer'].includes(overview.role)?<form onSubmit={save} className="admin-form"><label>نوع المادة<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{(Object.keys(names) as Kind[]).map(k=><option value={k} key={k}>{names[k]}</option>)}</select></label><label>العنوان<input minLength={4} maxLength={220} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان المادة"/></label><label>المعرّف في الرابط (حروف لاتينية صغيرة وأرقام وشرطات)<input dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} required value={slug} onChange={e=>setSlug(e.target.value)} placeholder="yemen-crisis"/></label><label>وصف أو ملخص<textarea rows={5} maxLength={8000} value={description} onChange={e=>setDescription(e.target.value)}/></label><button disabled={busy} type="submit">حفظ كمسودة</button></form>:<p>دورك يسمح بالاطلاع دون إنشاء مسودات.</p>}</>}{message&&<p role="status" className="admin-feedback">{message}</p>}</section></div></>}
 </main>;
}
