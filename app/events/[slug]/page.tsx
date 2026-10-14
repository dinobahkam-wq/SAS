import {formatSasDate} from '../../../lib/date-format';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPublicDirectory,getPublicRelated,getPublicDevelopments} from '../../../lib/public-content';
export default async function EventDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const events=await getPublicDirectory('events');
 const event=events.find(item=>item.slug===slug);
 if(!event)notFound();
 const [issues,developments]=await Promise.all([getPublicRelated('events',slug),getPublicDevelopments(slug)]);
 return <main className="knowledge-page">
 <div className="knowledge-breadcrumb"><Link href="/">الرئيسية</Link><span>←</span><Link href="/events">الأحداث</Link><span>←</span><strong>{event.title_ar}</strong></div>
 <header className="knowledge-hero"><span className="eyebrow">سجل الحدث</span><h1>{event.title_ar}</h1>{event.summary_ar&&<p>{event.summary_ar}</p>}{event.starts_at&&<p><time className="sas-date" dir="ltr" dateTime={event.starts_at}>{formatSasDate(event.starts_at)}</time></p>}</header>
 <figure className="sas-editorial-cover" role="img" aria-label="غلاف تحريري أصلي من ساس للحدث، وليس صورة فوتوغرافية"><div className="sas-cover-art" aria-hidden="true"><span className="sas-cover-orbit"/><span className="sas-cover-grid"/><span className="sas-cover-symbol">SAS</span></div><figcaption><span className="eyebrow">ساس | ملف الحدث</span><strong>{event.title_ar}</strong><small>تصميم تحريري أصلي — ليس صورة توثيقية</small></figcaption></figure>
 <div className="knowledge-columns"><section className="knowledge-primary"><div className="knowledge-section-head"><h2>تطورات الحدث</h2><span>{developments.length} تطور منشور</span></div>{developments.length?<div className="sas-news-feed">{developments.map((d,i)=><article className="sas-news-item" key={i}><div className="sas-news-meta"><span className="eyebrow">تطور موثق</span>{d.occurred_at&&<time dir="ltr" className="sas-date" dateTime={d.occurred_at}>{formatSasDate(d.occurred_at)}</time>}</div><h3>{d.headline}</h3>{d.description&&<p className="sas-news-body">{d.description}</p>}{d.sources?.length>0&&<div className="sas-news-sources"><span>المصادر</span>{d.sources.filter(src=>src.url?.startsWith("https://")).map((src,j)=><a key={j} href={src.url} target="_blank" rel="noopener noreferrer">{src.name} ↗</a>)}</div>}</article>)}</div>:<div className="knowledge-empty"><h3>لا توجد تطورات منشورة لهذا الحدث بعد</h3><p>تظهر هنا التطورات بعد نشرها من لوحة الإدارة.</p></div>}</section>
 <aside className="knowledge-aside"><h2>القضايا المرتبطة</h2>{issues.length?<div className="knowledge-links">{issues.map(i=><Link key={i.slug} href={'/issues/'+encodeURIComponent(i.slug)}>{i.title} ←</Link>)}</div>:<p>لا توجد قضايا مرتبطة منشورة.</p>}<div className="knowledge-links"><Link href="/dossiers">استكشف الملفات ←</Link></div></aside></div>
 </main>;
}