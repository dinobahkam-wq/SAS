import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPublicDirectory} from '../../../lib/public-content';
export default async function Detail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const items=await getPublicDirectory('issues');
 const item=items.find(x=>x.slug===slug);
 if(!item)notFound();
 return <main className="knowledge-page">
  <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><Link href="/issues">القضايا</Link><span>←</span><strong>{item.title_ar}</strong></div>
  <header className="knowledge-hero"><span className="eyebrow">القضايا</span><h1>{item.title_ar}</h1>{item.summary_ar&&<p>{item.summary_ar}</p>}</header>
  <section className="knowledge-primary" style={{marginTop:24}}><h2>المحتوى المرتبط</h2><div className="knowledge-empty"><h3>لا توجد مواد مرتبطة منشورة حاليًا</h3><p>ستظهر هنا الروابط إلى القضايا والأحداث والتطورات بعد اعتمادها للنشر.</p></div></section>
 </main>
}
