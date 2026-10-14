'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';

type Tool={name:string;description:string};
type Outcome={ok:boolean;message:string;tools:Tool[];details:string};
function client():SupabaseClient|null{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null;
}
export default function OperatorDiagnostics(){
 const [db]=useState(client);
 const [status,setStatus]=useState<'loading'|'logged-out'|'ready'>('loading');
 const [busy,setBusy]=useState(false);
 const [outcome,setOutcome]=useState<Outcome|null>(null);
 useEffect(()=>{
  if(!db){setStatus('logged-out');return}
  let live=true;
  void db.auth.getSession().then(({data})=>{if(live)setStatus(data.session?'ready':'logged-out')});
  const {data:listener}=db.auth.onAuthStateChange((_event,session)=>{if(live)setStatus(session?'ready':'logged-out')});
  return()=>{live=false;listener.subscription.unsubscribe()};
 },[db]);
 async function verify(){
  if(!db||busy)return;
  setBusy(true);setOutcome(null);
  try{
   const {data:{session},error}=await db.auth.getSession();
   if(error||!session?.access_token)throw new Error('يرجى تسجيل الدخول من إدارة ساس');
   async function call(method:string,params?:Record<string,unknown>){
    const res=await fetch('/mcp',{method:'POST',cache:'no-store',
     headers:{'Content-Type':'application/json','Authorization':'Bearer '+session!.access_token},
     body:JSON.stringify({jsonrpc:'2.0',id:method,method,params})});
    const json=await res.json() as {result?:{tools?:Tool[];content?:{text?:string}[]};error?:{message?:string}};
    if(!res.ok||json.error)throw new Error('MCP '+res.status+': '+(json.error?.message||'request failed'));
    return json.result;
   }
   const initialized=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'sas-admin-diagnostics',version:'1.0.0'}});
   if(!initialized)throw new Error('تعذر تهيئة MCP');
   const list=await call('tools/list');
   const tools=Array.isArray(list?.tools)?list.tools:[];
   const overview=await call('tools/call',{name:'sas_read_overview',arguments:{}});
   const raw=overview?.content?.find(item=>typeof item.text==='string')?.text||'';
   if(!raw)throw new Error('لم ترد بيانات القراءة من Supabase');
   const parsed=JSON.parse(raw) as {source?:string;records?:unknown};
   if(parsed.source!=='supabase')throw new Error('مصدر البيانات غير متوقع');
   setOutcome({ok:true,message:'نجح الاتصال المصادق عليه بخادم MCP وقراءة بيانات ساس الحقيقية.',tools,details:'تم اختبار initialize وtools/list وsas_read_overview. لم تُنفذ أي عملية كتابة أو نشر.'});
  }catch(e){setOutcome({ok:false,message:e instanceof Error?e.message:'تعذّر إكمال التحقق',tools:[],details:'لا تشارك رموز الجلسات أو كلمات المرور أثناء التشخيص.'})}
  finally{setBusy(false)}
 }
 return <main className="knowledge-page">
  <div className="knowledge-breadcrumb"><Link href="/admin">الإدارة</Link><span>←</span><strong>اتصال المشغّل</strong></div>
  <header className="knowledge-hero"><span className="eyebrow">SAS MCP</span><h1>فحص اتصال المشغّل</h1><p>اختبار قراءة حقيقي باستخدام جلسة المحرر الحالية. تُرسل بيانات التفويض مباشرة من متصفحك إلى خادم ساس، ولا تُعرض في الصفحة أو المحادثة.</p></header>
  <section className="knowledge-primary">
  {status==='logged-out'&&<p>يرجى <Link href="/admin">تسجيل الدخول إلى الإدارة</Link> أولًا.</p>}
  {status==='loading'&&<p>جار التحقق من جلسة المستخدم...</p>}
  <button type="button" onClick={()=>void verify()} disabled={status!=='ready'||busy} style={{padding:'12px 24px',cursor:'pointer'}}>{busy?'جار اختبار الاتصال...':'اختبار قراءة MCP الآن'}</button>
  {outcome&&<section aria-live="polite" style={{marginTop:24}}><h2>{outcome.ok?'الاتصال ناجح':'فشل الاتصال'}</h2><p>{outcome.message}</p><p>{outcome.details}</p>{outcome.ok&&<><h3>الأدوات التي أعلنها الخادم</h3><ul>{outcome.tools.map(t=><li key={t.name}><code>{t.name}</code> — {t.description}</li>)}</ul></>}</section>}
  </section>
 </main>;
}
