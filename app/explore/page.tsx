'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {formatSasDate} from '../../lib/date-format';
type Kind='dossiers'|'issues'|'events';
type Entry={slug:string;title_ar:string;summary_ar:string|null;starts_at:string|null};
type Related={slug:string;title:string;summary?:string|null;kind:Kind};
type Development={headline:string;description:string|null;occurred_at:string|null;sources:{name:string;url:string}[]};
type Selection={kind:Kind;slug:string;title:string};
type Detail={relations:Related[];developments:Development[];parents:Related[]};
const kinds:Kind[]=['dossiers','issues','events'];
const labels:Record<Kind,string>={dossiers:'الملفات',issues:'القضايا',events:'الأحداث'};
const next:Record<Kind,Kind|null>={dossiers:'issues',issues:'events',events:null};
const base=process.env.NEXT_PUBLIC_SUPABASE_URL??'';
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??'';
const cache=new Map<string,{data:unknown;at:number}>();
const lifetime=60000;
async function rpc<T>(fn:string,args:object):Promise<T>{
 const cacheKey=fn+JSON.stringify(args);
 const hit=cache.get(cacheKey);
 if(hit&&Date.now()-hit.at<lifetime)return hit.data as T;
 if(!base||!key)throw new Error('إعداد الاتصال بقاعدة البيانات غير مكتمل');
 const response=await fetch(base.replace(/\/$/,'')+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args)});
 if(!response.ok)throw new Error('تعذر تحميل البيانات. تحقق من الاتصال ثم أعد المحاولة.');
 const json:unknown=await response.json();
 if(!Array.isArray(json))throw new Error('الاستجابة غير متوقعة');
 cache.set(cacheKey,{data:json,at:Date.now()});
 return json as T;
}
async function fetchDetails(value:Selection):Promise<Detail>{
 const [relations,developments,parents]=await Promise.all([
 rpc<Related[]>('sas_public_related',{p_kind:value.kind,p_slug:value.slug}),
 value.kind==='events'?rpc<Development[]>('sas_public_event_developments',{p_slug:value.slug}):Promise.resolve([] as Development[]),
 value.kind!=='dossiers'?rpc<Related[]>('sas_public_parents',{p_kind:value.kind,p_slug:value.slug}):Promise.resolve([] as Related[])
 ]);
 return {relations,developments,parents};
}
export default function Explorer(){
 const [kind,setKind]=useState<Kind>('dossiers');
 const [selected,setSelected]=useState<Selection|null>(null);
 const [trail,setTrail]=useState<Selection[]>([]);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [detail,setDetail]=useState<Detail>({relations:[],developments:[],parents:[]});
 const [search,setSearch]=useState('');
 const [listBusy,setListBusy]=useState(false);
 const [detailBusy,setDetailBusy]=useState(false);
 const [listError,setListError]=useState('');
 const [detailError,setDetailError]=useState('');
 const [retry,setRetry]=useState(0);
 const serial=useRef(0);
 const navigate=useCallback((value:Selection)=>{setTrail(t=>selected?[...t,selected].slice(-12):[]);setSelected(value);setKind(value.kind);setDetailError('')},[selected]);
 const back=useCallback(()=>{setTrail(t=>{if(!t.length){setSelected(null);return []}setSelected(t[t.length-1]);setKind(t[t.length-1].kind);return t.slice(0,-1)})},[]);
 const selectKind=(value:Kind)=>{setKind(value);setSelected(null);setTrail([]);setSearch('');setDetailError('')};
 useEffect(()=>{let live=true;setListBusy(true);setListError('');
 rpc<Entry[]>('sas_public_directory',{p_kind:kind}).then(data=>{if(live)setEntries(data)}).catch(e=>{if(live){setEntries([]);setListError(String(e.message))}}).finally(()=>{if(live)setListBusy(false)});
 return()=>{live=false}},[kind,retry]);
 useEffect(()=>{if(!selected){setDetail({relations:[],developments:[],parents:[]});setDetailBusy(false);return}let live=true;const seq=++serial.current;setDetailBusy(true);setDetailError('');
 fetchDetails(selected).then(data=>{if(live&&serial.current===seq)setDetail(data)}).catch(e=>{if(live&&serial.current===seq)setDetailError(String(e.message))}).finally(()=>{if(live&&serial.current===seq)setDetailBusy(false)});
 return()=>{live=false}},[selected,retry]);
 const shown=useMemo(()=>entries.filter(e=>e.title_ar.includes(search.trim())||e.summary_ar?.includes(search.trim())),[entries,search]);
 const openRelated=(entry:Related)=>navigate({kind:entry.kind,slug:entry.slug,title:entry.title});
 return <main className="knowledge-page explorer">
 <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><strong>استكشف معرفة ساس</strong></div>
 <header className="knowledge-hero"><span className="eyebrow">مساحة المعرفة</span><h1>استكشف معرفة ساس</h1><p>الملفات والقضايا والأحداث وتطوراتها في مساحة مترابطة، مع تحميل ما تحتاجه فقط.</p></header>
 <div className="explorer-layout">
 <aside className="admin-panel explorer-list" aria-label="استكشاف المواد">
 <div className="admin-tabs">{kinds.map(k=><button key={k} className={kind===k?'selected':''} type="button" aria-pressed={kind===k} onClick={()=>selectKind(k)}>{labels[k]}</button>)}</div>
 <label className="explorer-search">بحث في {labels[kind]}<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بعنوان المادة أو وصفها" type="search"/></label>
 <div className="explorer-list-heading"><h2>{labels[kind]} المنشورة</h2><small>{shown.length}</small></div>
 {listBusy&&<p role="status">جارٍ تحميل القائمة…</p>}
 {listError&&<p role="alert">{listError} <button type="button" onClick={()=>setRetry(v=>v+1)}>إعادة المحاولة</button></p>}
 {!listBusy&&shown.map(x=><button className={'explorer-item '+(selected?.slug===x.slug&&selected.kind===kind?'active':'')} aria-current={selected?.slug===x.slug&&selected.kind===kind?'true':undefined} key={x.slug} type="button" onClick={()=>navigate({kind,slug:x.slug,title:x.title_ar})}>{x.title_ar}</button>)}
 {!listBusy&&!listError&&!shown.length&&<p>لا توجد مواد تطابق البحث.</p>}
 </aside>
 <section className="admin-panel explorer-detail" aria-live="polite">
 {selected&&<nav className="explorer-trail" aria-label="مسار التصفح"><button type="button" onClick={()=>selectKind('dossiers')}>البداية</button>{trail.map((entry,i)=><span key={i}><span aria-hidden="true"> ← </span><button type="button" onClick={()=>{setSelected(entry);setKind(entry.kind);setTrail(trail.slice(0,i))}}>{entry.title}</button></span>)}<span aria-current="page"> ← {selected.title}</span></nav>}
 {selected&&trail.length>0&&<button className="explorer-back" type="button" onClick={back}>→ رجوع إلى السابق</button>}
 {!selected?<div className="knowledge-empty"><h2>اختر مادة لاستعراض ارتباطاتها</h2><p>سيظهر محتواها والمسارات المرتبطة بها هنا دون مغادرة الصفحة.</p></div>:<>
 <span className="eyebrow">{labels[selected.kind]}</span><h2>{selected.title}</h2>
 <p className="explorer-permalink"><Link href={'/'+selected.kind+'/'+encodeURIComponent(selected.slug)}>عرض الصفحة المستقلة ومشاركة رابطها ↗</Link></p>
 {detailBusy&&<p role="status">جارٍ تحميل العلاقات…</p>}
 {detailError&&<p role="alert">{detailError} <button type="button" onClick={()=>setRetry(v=>v+1)}>إعادة المحاولة</button></p>}
 {!detailBusy&&!detailError&&<>
 {detail.parents.length>0&&<div className="explorer-parents"><strong>ينتمي إلى</strong>{detail.parents.map(p=><button type="button" key={p.kind+':'+p.slug} onClick={()=>openRelated(p)}>{p.title} ↗</button>)}</div>}
 {selected.kind!=='events'&&<><div className="knowledge-section-head"><h2>{labels[next[selected.kind] as Kind]} المرتبطة</h2><span>{detail.relations.length}</span></div>
 {detail.relations.length?<div className="directory-results">{detail.relations.map(r=><button className="explorer-related" type="button" key={r.kind+':'+r.slug} onClick={()=>openRelated(r)}><strong>{r.title}</strong>{r.summary&&<small>{r.summary}</small>}<span>استعراض ←</span></button>)}</div>:<p>لا توجد مواد مرتبطة منشورة.</p>}</>}
 {selected.kind==='events'&&<><div className="knowledge-section-head"><h2>التطورات المنشورة</h2><span>{detail.developments.length}</span></div>
 {detail.developments.length?<div className="directory-results">{detail.developments.map((d,i)=><article key={i} className="directory-entry"><h3>{d.headline}</h3>{d.occurred_at&&<time className="sas-date" dir="ltr" dateTime={d.occurred_at}>{formatSasDate(d.occurred_at)}</time>}{d.description&&<p>{d.description}</p>}{d.sources?.map((source,j)=><a key={j} href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a>)}</article>)}</div>:<p>لا توجد تطورات منشورة لهذا الحدث.</p>}</>}
 </>}
 </>}</section></div></main>
}
