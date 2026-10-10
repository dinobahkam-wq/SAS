import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPublicDirectory,getPublicRelated} from '../../../lib/public-content';
export default async function Detail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const items=await getPublicDirectory('dossiers');
 const item=items.find(x=>x.slug===slug);
 const related=await getPublicRelated('dossiers',slug);
 if(!item)notFound();
 return <main className="knowledge-page">
  <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><Link href="/dossiers">الملفات</Link><span>←</span><strong>{item.title_ar}</strong></div>
  <header className="knowledge-hero"><span className="eyebrow">الملفات</span><h1>{item.title_ar}</h1>{item.summary_ar&&<p>{item.summary_ar}</p>}</header>
  <section className="knowledge-primary" style={{marginTop:24}}><div className="knowledge-section-head"><h2>القضايا المرتبطة</h2><span>{related.length} مادة منشورة</span></div>{related.length?<div className="directory-results">{related.map(x=><article key={x.slug} className="directory-entry"><h3><Link href={'/issues/'+encodeURIComponent(x.slug)}>{x.title}</Link></h3>{x.summary&&<p>{x.summary}</p>}</article>)}</div>:<div className="knowledge-empty"><h3>لا توجد مواد مرتبطة منشورة حاليًا</h3><p>ستظهر هنا المواد فور نشرها وربطها بهذا السجل.</p></div>}</section>
 </main>
}
