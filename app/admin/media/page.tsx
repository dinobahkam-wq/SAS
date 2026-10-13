'use client';
import {useCallback,useEffect,useState} from 'react';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import Link from 'next/link';
type Media={id:string;path:string;alt:string;caption:string;source:string;license:string;rights:string;verification:string;kind:string;created_at:string};
const createDb=():SupabaseClient|null=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return u&&k?createClient(u,k,{auth:{persistSession:true}}):null};
export default function MediaLibrary(){
 const [db]=useState(createDb),[session,setSession]=useState(false),[assets,setAssets]=useState<Media[]>([]);
 const [file,setFile]=useState<File|null>(null),[alt,setAlt]=useState(''),[caption,setCaption]=useState(''),[source,setSource]=useState(''),[sourceUrl,setSourceUrl]=useState(''),[license,setLicense]=useState(''),[licenseUrl,setLicenseUrl]=useState(''),[creator,setCreator]=useState(''),[kind,setKind]=useState('archival');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=useCallback(async()=>{if(!db)return;const r=await db.rpc('sas_media_editor_list');if(r.error)setMessage('تعذر تحميل المكتبة: '+r.error.message);else{setAssets((r.data as Media[])||[]);setMessage('')}},[db]);
 useEffect(()=>{if(!db)return;let live=true;void db.auth.getSession().then(({data})=>{if(live)setSession(!!data.session)});const {data:listener}=db.auth.onAuthStateChange((_e,s)=>{if(live)setSession(!!s)});return()=>{live=false;listener.subscription.unsubscribe()}},[db]);
 useEffect(()=>{if(session)void load();else setAssets([])},[session,load]);
 async function upload(e:React.FormEvent){e.preventDefault();if(!db||!file||busy)return;setBusy(true);setMessage('');
  try{
   const accepted=['image/jpeg','image/png','image/webp','image/avif'];
   if(!accepted.includes(file.type)||file.size>10485760)throw Error('استخدم JPEG أو PNG أو WebP أو AVIF، بحجم لا يتجاوز 10 ميجابايت.');
   const {data:userData,error:userError}=await db.auth.getUser();if(userError||!userData.user)throw Error('يجب تسجيل الدخول بحساب عضو هيئة التحرير.');
   const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'} as Record<string,string>)[file.type];
   const path=userData.user.id+'/'+crypto.randomUUID()+'.'+ext;
   const uploaded=await db.storage.from('sas-media').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
   if(uploaded.error)throw Error('فشل رفع الملف: '+uploaded.error.message);
   const registered=await db.rpc('sas_media_register',{p_storage_path:path,p_original_filename:file.name,p_mime_type:file.type,p_byte_size:file.size,p_alt_ar:alt.trim(),p_caption_ar:caption.trim(),p_source_name:source.trim(),p_source_url:sourceUrl.trim()||null,p_license_name:license.trim(),p_license_url:licenseUrl.trim()||null,p_creator_name:creator.trim()||null,p_media_kind:kind});
   if(registered.error)throw Error('رُفع الملف لكن فشل تسجيل بياناته. مسار الملف: '+path+' — '+registered.error.message);
   setMessage('حُفظ الوسيط في المكتبة بحالة حقوق غير معتمدة؛ لن يظهر للجمهور قبل مراجعته.');
   setFile(null);setAlt('');setCaption('');setSource('');setSourceUrl('');setLicense('');setLicenseUrl('');setCreator('');
   await load();
  }catch(err){setMessage(err instanceof Error?err.message:'تعذر رفع الصورة')}finally{setBusy(false)}
 }
 return <main className="knowledge-page sas-media-admin"><header className="knowledge-hero"><span className="eyebrow">ساس / مساحة التحرير</span><h1>مكتبة الوسائط</h1><p>مخزن خاص للصور وبيانات حقوقها ومصادرها. لا تُنشر الوسائط تلقائيًا.</p><Link href="/admin/briefings">العودة إلى محرر الإحاطة ←</Link></header>
 {!session?<section className="sas-media-panel"><p>سجّل الدخول أولًا من <Link href="/admin">لوحة إدارة ساس</Link> ثم عد إلى هنا.</p></section>:<div className="sas-media-columns"><form className="sas-media-panel" onSubmit={e=>void upload(e)}><h2>إضافة وسيط</h2><label>الصورة<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label><label>وصف بديل دقيق<input minLength={8} maxLength={500} required value={alt} onChange={e=>setAlt(e.target.value)}/></label><label>تعليق الصورة<textarea rows={2} value={caption} onChange={e=>setCaption(e.target.value)}/></label><label>اسم المصدر<input required minLength={3} value={source} onChange={e=>setSource(e.target.value)}/></label><label>رابط المصدر الأصلي<input type="url" placeholder="https://" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}/></label><label>نوع الترخيص أو الإذن<input required minLength={3} value={license} onChange={e=>setLicense(e.target.value)}/></label><label>رابط الترخيص<input type="url" placeholder="https://" value={licenseUrl} onChange={e=>setLicenseUrl(e.target.value)}/></label><label>المصور أو صاحب العمل<input value={creator} onChange={e=>setCreator(e.target.value)}/></label><label>وظيفة الصورة<select value={kind} onChange={e=>setKind(e.target.value)}><option value="archival">أرشيفية</option><option value="documentary">توثيقية</option><option value="illustrative">تعبيرية</option><option value="graphic">رسم معلوماتي</option></select></label><button type="submit" disabled={!file||busy}>{busy?'جارٍ الحفظ…':'رفع الصورة وتسجيل بياناتها'}</button></form><section className="sas-media-panel"><h2>الوسائط المضافة</h2><p>جميع الوسائط أدناه داخل المخزن الخاص، وحقوقها تنتظر اعتماد المراجع.</p><div className="sas-media-list">{assets.map(a=><article key={a.id}><strong>{a.alt}</strong><small>{a.source} · {a.license}</small><small>الحقوق: {a.rights} · التحقق: {a.verification}</small><code>{a.id}</code></article>)}{!assets.length&&<p>لا توجد صور مسجلة بعد.</p>}</div></section></div>}
 {message&&<p role="status" className="admin-feedback">{message}</p>}
 </main>
}
