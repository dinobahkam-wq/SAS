import {formatSasDate} from '../../../lib/date-format';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPublicDirectory} from '../../../lib/public-content';
export default async function EventDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const events=await getPublicDirectory('events');
 const event=events.find(item=>item.slug===slug);
 if(!event)notFound();
 return <main className="knowledge-page">
 <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><Link href="/events">الأحداث</Link><span>←</span><strong>{event.title_ar}</strong></div>
 <header className="knowledge-hero"><span className="eyebrow">سجل الحدث</span><h1>{event.title_ar}</h1>{event.summary_ar&&<p>{event.summary_ar}</p>}{event.starts_at&&<p><time className="sas-date" dir="ltr" dateTime={event.starts_at}>{formatSasDate(event.starts_at)}</time></p>}</header>
 <div className="knowledge-columns"><section className="knowledge-primary"><div className="knowledge-section-head"><h2>التطورات</h2><span>المواد المنشورة</span></div><div className="knowledge-empty"><h3>لا توجد تطورات منشورة لهذا الحدث بعد</h3><p>ستظهر التطورات هنا بعد التحقق من معلوماتها ومصادرها واعتمادها.</p></div></section>
 <aside className="knowledge-aside"><h2>المصادر والسياق</h2><p>ستُعرض المصادر والجهات المرتبطة والتطورات بحسب الإجازة التحريرية لكل مادة.</p><div className="knowledge-links"><Link href="/issues">استكشف القضايا ←</Link><Link href="/dossiers">تصفح الملفات ←</Link></div></aside></div>
 </main>;
}