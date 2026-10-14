import Link from 'next/link';
export const revalidate=60;
export const metadata={title:'الإحاطة اليومية | ساس',description:'الإحاطة السياسية المنشورة والمعتمدة من ساس، موثقة بمصادرها'};
type Source={name:string;url:string|null};type Item={title:string;description:string|null;what_changed:string;why_it_matters:string;event_title:string;sources:Source[]};
type Edition={date:string;title:string;lead:string;analysis:string;watchpoints:string;methodology:string;coverage_note:string;items:Item[]};
async function latest():Promise<Edition|null>{
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL,token=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!token)return null;
 try{const r=await fetch(base.replace(/\/$/,'')+'/rest/v1/rpc/sas_public_briefing_latest',{method:'POST',headers:{apikey:token,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',next:{revalidate:60}});
 if(!r.ok){console.error('Public briefing:',r.status);return null}const data:unknown=await r.json();return data&&typeof data==='object'&&'title' in data?data as Edition:null}
 catch(e){console.error('Public briefing unavailable:',e);return null}
}
export default async function PublicBriefing(){
 const edition=await latest();
 if(!edition)return <main className="knowledge-page"><header className="knowledge-hero"><span className="eyebrow">ساس | الإحاطة اليومية</span><h1>الإحاطة اليومية</h1><p>لا توجد إحاطة معتمدة ومنشورة حاليًا. نعرض هنا الإصدارات بعد اكتمال التحقق والموافقة التحريرية.</p><Link href="/events">تصفح الأحداث المنشورة ←</Link></header></main>;
 return <main className="knowledge-page sas-public-briefing"><header className="knowledge-hero"><span className="eyebrow">ساس | عدد {edition.date}</span><h1>{edition.title}</h1><p>{edition.lead}</p></header><section className="sas-published-items"><h2>أبرز التطورات</h2>{edition.items.map((x,i)=><article key={i}><span className="eyebrow">{x.event_title}</span><h3>{x.title}</h3><p>{x.what_changed||x.description}</p>{x.why_it_matters&&<p><strong>لماذا يهم؟ </strong>{x.why_it_matters}</p>}{x.sources.length>0&&<div className="sas-public-sources"><strong>المصادر: </strong>{x.sources.filter(s=>s.url?.startsWith('https://')).map((s,j)=><a key={j} href={s.url||'#'} target="_blank" rel="noopener noreferrer">{s.name} ↗</a>)}</div>}</article>)}</section><section className="sas-published-analysis"><h2>قراءة ساس</h2><p>{edition.analysis}</p><h3>ما الذي نراقبه؟</h3><p style={{whiteSpace:'pre-line'}}>{edition.watchpoints}</p><h3>المنهجية</h3><p>{edition.methodology}</p><p>{edition.coverage_note}</p></section></main>
}
