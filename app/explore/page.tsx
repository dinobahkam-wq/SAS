'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
type Kind='dossiers'|'issues'|'events';
type Entry={slug:string;title_ar:string;summary_ar:string|null;starts_at:string|null};
type Related={slug:string;title:string;summary?:string|null;kind:Kind};
type Development={headline:string;description:string|null;occurred_at:string|null;sources:{name:string;url:string}[]};
const labels:Record<Kind,string>={dossiers:'الملفات',issues:'القضايا',events:'الأحداث'};
const next:Record<Kind,Kind|null>={dossiers:'issues',issues:'events',events:null};
const base=process.env.NEXT_PUBLIC_SUPABASE_URL??'';
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??'';
async function rpc<T>(fn:string,args:object,signal:AbortSignal):Promise<T>{
 if(!base||!key)throw new Error('إعداد الاتصال بقاعدة البيانات غير مكتمل');
 const response=await fetch(base.replace(/\/$/,'')+'/rest/v1/rpc/'+fn,{method:'POST',signal,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args)});
 if(!response.ok)throw new Error('تعذر تحميل البيانات. تحقق من الاتصال وأعد المحاولة.');
 return await response.json() as T;
}
export default function Explorer(){
 const [kind,setKind]=useState<Kind>('dossiers');
 const [selected,setSelected]=useState<{kind:Kind;slug:string;title:string}|null>(null);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [relations,setRelations]=useState<Related[]>([]);
 const [developments,setDevelopments]=useState<Development[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 const choose=useCallback((k:Kind,slug:string,title:string)=>{setSelected({kind:k,slug,title});setKind(k);setRelations([]);setDevelopments([]);setError('')},[]);
 useEffect(()=>{const ctrl=new AbortController();setBusy(true);setError('');
 rpc<Entry[]>('sas_public_directory',{p_kind:kind},ctrl.signal).then(setEntries).catch(e=>{if(!ctrl.signal.aborted)setError(String(e.message))}).finally(()=>{if(!ctrl.signal.aborted)setBusy(false)});
 return()=>ctrl.abort()},[kind,retry]);
 useEffect(()=>{if(!selected)return;const ctrl=new AbortController();setBusy(true);setError('');
 const jobs:Promise<unknown>[]=[rpc<Related[]>('sas_public_related',{p_kind:selected.kind,p_slug:selected.slug},ctrl.signal).then(setRelations)];
 if(selected.kind==='events')jobs.push(rpc<Development[]>('sas_public_event_developments',{p_slug:selected.slug},ctrl.signal).then(setDevelopments));
 Promise.all(jobs).catch(e=>{if(!ctrl.signal.aborted)setError(String(e.message))}).finally(()=>{if(!ctrl.signal.aborted)setBusy(false)});
 return()=>ctrl.abort()},[selected,retry]);
 return <main className="knowledge-page explorer"><div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><strong>استكشف معرفة ساس</strong></div>
 <header className="knowledge-hero"><span className="eyebrow">تصفح مترابط</span><h1>استكشف معرفة ساس</h1><p>انتقل بين الملفات والقضايا والأحداث والتطورات داخل مساحة واحدة، دون فتح صفحة جديدة عند كل خطوة.</p></header>
 <div className="explorer-layout"><aside className="admin-panel explorer-list"><div className="admin-tabs">{(Object.keys(labels) as Kind[]).map(k=><button key={k} className={kind===k?'selected':''} type="button" onClick={()=>{setKind(k);setSelected(null);setRelations([]);setDevelopments([])}}>{labels[k]}</button>)}</div><h2>{labels[kind]} المنشورة</h2>{entries.map(x=><button className={'explorer-item '+(selected?.slug===x.slug&&selected.kind===kind?'active':'')} key={x.slug} type="button" onClick={()=>choose(kind,x.slug,x.title_ar)}>{x.title_ar}</button>)}{!busy&&!entries.length&&<p>لا توجد مواد منشورة في هذا القسم.</p>}</aside>
 <section className="admin-panel explorer-detail">{error&&<div role="alert" className="admin-feedback">{error}<button type="button" onClick={()=>setRetry(x=>x+1)}>إعادة المحاولة</button></div>}
 {busy&&<p role="status">جارٍ تحميل المحتوى…</p>}
 {!selected?<div className="knowledge-empty"><h2>اختر مادة لاستعراض ارتباطاتها</h2><p>ستظهر تفاصيل المادة والأجزاء المتصلة بها هنا.</p></div>:<><span className="eyebrow">{labels[selected.kind]}</span><h2>{selected.title}</h2><p><Link href={'/'+selected.kind+'/'+encodeURIComponent(selected.slug)}>الرابط المباشر للمادة ↗</Link></p><div className="knowledge-section-head"><h2>{next[selected.kind]?labels[next[selected.kind]! ]+' المرتبطة':'التطورات المنشورة'}</h2></div>
 {relations.length>0?<div className="directory-results">{relations.map(x=><button type="button" className="explorer-related" key={x.kind+':'+x.slug} onClick={()=>choose(x.kind,x.slug,x.title)}><strong>{x.title}</strong>{x.summary&&<small>{x.summary}</small>}<span>استعراض ←</span></button>)}</div>:!busy&&selected.kind!=='events'&&<p>لا توجد عناصر مرتبطة منشورة.</p>}
 {selected.kind==='events'&&(developments.length?<div className="directory-results">{developments.map((d,i)=><article key={i} className="directory-entry"><h3>{d.headline}</h3>{d.description&&<p>{d.description}</p>}{d.sources.map((src,j)=><a key={j} href={src.url} target="_blank" rel="noopener noreferrer">{src.name} ↗</a>)}</article>)}</div>:!busy&&<p>لا توجد تطورات منشورة لهذا الحدث.</p>)}</>}
 </section></div></main>
}
