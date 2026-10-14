'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
type AuthorizationResult={authorization_id?:string;redirect_url?:string;client?:{name?:string};redirect_uri?:string;scope?:string};
type Result<T>={data:T|null;error:{message:string}|null};
type OAuthApi={
 getAuthorizationDetails:(id:string)=>Promise<Result<AuthorizationResult>>;
 approveAuthorization:(id:string)=>Promise<Result<{redirect_url:string}>>;
 denyAuthorization:(id:string)=>Promise<Result<{redirect_url:string}>>;
};
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
const supabase=supabaseUrl&&publicKey?createClient(supabaseUrl,publicKey):null;
function oauth(){return (supabase?.auth as unknown as {oauth?:OAuthApi})?.oauth}
export default function SasOAuthConsent(){
 const [authorizationId,setAuthorizationId]=useState('');
 const [details,setDetails]=useState<AuthorizationResult|null>(null);
 const [signedIn,setSignedIn]=useState(false);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('authorization_id')||'';setAuthorizationId(id);
 if(!supabase||!id){setMessage('طلب تفويض غير صالح');return}
 void supabase.auth.getUser().then(async ({data,error})=>{if(!error&&data.user){setSignedIn(true);await load(id)}})
 },[]);
 async function load(id:string){
  const api=oauth();if(!api){setMessage('يلزم تحديث مكتبة مصادقة Supabase لدعم OAuth 2.1');return}
  const {data,error}=await api.getAuthorizationDetails(id);
  if(error||!data){setMessage(error?.message||'تعذر تحميل معلومات التفويض');return}
  if(!data.authorization_id&&data.redirect_url){window.location.assign(data.redirect_url);return}
  setDetails(data);
 }
 async function signIn(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!supabase)return;setBusy(true);setMessage('');
  const {error}=await supabase.auth.signInWithPassword({email,password});
  setPassword('');setBusy(false);
  if(error){setMessage(error.message);return}
  setSignedIn(true);await load(authorizationId);
 }
 async function decide(approve:boolean){
  const api=oauth();if(!api||!authorizationId)return;
  setBusy(true);setMessage('');
  const {data,error}=await (approve?api.approveAuthorization(authorizationId):api.denyAuthorization(authorizationId));
  setBusy(false);
  if(error||!data?.redirect_url){setMessage(error?.message||'تعذر تنفيذ التفويض');return}
  window.location.assign(data.redirect_url);
 }
 return <main className="admin-page" dir="rtl"><div className="admin-heading"><div><span className="eyebrow">ساس</span><h1>تفويض SAS Operator</h1><p>هذه الموافقة تسمح للتطبيق المتصل باستدعاء أدوات ساس بصلاحيات حسابك. لا توافق إلا على تطبيق تثق به.</p></div></div>
 <section className="admin-panel" style={{maxWidth:600}}>
 {!signedIn?<form onSubmit={signIn}><h2>الدخول إلى حساب ساس</h2><label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" disabled={busy||!authorizationId}>الدخول والمتابعة</button></form>
 :details?<><h2>طلب اتصال جديد</h2><p><strong>التطبيق:</strong> {details.client?.name||'تطبيق غير مسمى'}</p><p><strong>وجهة العودة:</strong> <span dir="ltr">{details.redirect_uri||'غير محددة'}</span></p><p><strong>النطاقات المطلوبة:</strong> {details.scope||'غير محددة'}</p><p>سيظل نشر أي مادة مرهونًا باعتمادك الصريح لنسختها. يمكنك إلغاء الوصول من إعدادات المصادقة لاحقًا.</p><div style={{display:'flex',gap:12}}><button type="button" disabled={busy} onClick={()=>void decide(true)}>أوافق على ربط التطبيق</button><button type="button" disabled={busy} onClick={()=>void decide(false)}>رفض</button></div></>
 :<p>جارٍ التحقق من طلب التفويض...</p>}
 {message&&<p role="alert">{message}</p>}</section></main>
}
