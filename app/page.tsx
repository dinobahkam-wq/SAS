import Link from 'next/link';
import {getPublicDirectory,type PublicEntry} from '../lib/public-content';
import {formatSasDate} from '../lib/date-format';
type Item={kind:'dossiers'|'issues'|'events';entry:PublicEntry};
const titles={dossiers:'ملف',issues:'قضية',events:'حدث'};
function href(item:Item){return '/'+item.kind+'/'+encodeURIComponent(item.entry.slug)}
export default async function Home(){
 const [dossiers,issues,events]=await Promise.all([getPublicDirectory('dossiers'),getPublicDirectory('issues'),getPublicDirectory('events')]);
 const lead:Item|null=events[0]?{kind:'events',entry:events[0]}:dossiers[0]?{kind:'dossiers',entry:dossiers[0]}:issues[0]?{kind:'issues',entry:issues[0]}:null;
 const recent:Item[]=[...events.slice(0,4).map(entry=>({kind:'events' as const,entry})),...issues.slice(0,3).map(entry=>({kind:'issues' as const,entry})),...dossiers.slice(0,3).map(entry=>({kind:'dossiers' as const,entry}))].filter(x=>x.entry.slug!==lead?.entry.slug||x.kind!==lead.kind).slice(0,6);
 return <main className="page-layout">
 <aside className="sidebar"><div className="side-box"><div className="side-box-title">استكشف المعرفة المنشورة</div><div className="category-list">
 <Link href="/explore">مساحة المعرفة الموحدة <span>↗</span></Link>
 <Link href="/dossiers">الملفات <span>{dossiers.length}</span></Link>
 <Link href="/issues">القضايا <span>{issues.length}</span></Link>
 <Link href="/events">الأحداث <span>{events.length}</span></Link>
 </div></div><div className="side-note"><span className="eyebrow">منهج ساس</span><strong>المعلومة في سياقها</strong><p>ابدأ بالملف، وانتقل إلى القضية، ثم الحدث وتطوراته ومصادره داخل مساحة واحدة.</p><Link href="/explore">ابدأ الاستكشاف ←</Link></div></aside>
 <section className="main-column"><div className="section-top"><div><span className="eyebrow">منصة ساس للإعلام والدراسات</span><h1>المشهد السياسي</h1></div><span className="section-pill">المعرفة المنشورة</span></div>
 {lead?<article className="lead-story"><div className="lead-image"><div className="graphic-grid"/><div className="map-shape"><span>ساس</span></div><div className="image-caption">المعرفة تبدأ من الحدث</div></div><div className="lead-content"><div className="story-meta"><span className="tag">{titles[lead.kind]}</span>{lead.entry.starts_at&&<time className="sas-date" dir="ltr" dateTime={lead.entry.starts_at}>{formatSasDate(lead.entry.starts_at)}</time>}</div><h2><Link href={href(lead)}>{lead.entry.title_ar}</Link></h2>{lead.entry.summary_ar&&<p>{lead.entry.summary_ar}</p>}<div className="story-footer"><span>من قاعدة معرفة ساس</span><Link href="/explore">استكشف العلاقات ←</Link></div></div></article>:<div className="knowledge-empty"><h2>لا توجد مواد منشورة حاليًا</h2><p>ستظهر المواد هنا فور نشرها من لوحة الإدارة.</p></div>}
 <div className="lower-heading"><h3>من قاعدة المعرفة</h3><Link href="/explore">استكشاف جميع العلاقات ←</Link></div>
 <div className="mini-grid">{recent.length?recent.map(item=><Link href={href(item)} className="mini-card" key={item.kind+':'+item.entry.slug}><span>{titles[item.kind]}</span><h4>{item.entry.title_ar}</h4>{item.entry.summary_ar&&<p>{item.entry.summary_ar}</p>}</Link>):<Link href="/explore" className="mini-card"><span>الملفات والقضايا والأحداث</span><h4>استكشف قاعدة معرفة ساس</h4><p>تصفح ما نُشر وما يرتبط به من سياقات.</p></Link>}</div>
 </section><aside className="related-column"><div className="related-title"><h2>أبرز الملفات</h2><Link href="/dossiers">عرض الكل</Link></div><div className="related-stack">{dossiers.slice(0,3).map((entry,i)=><Link href={'/dossiers/'+encodeURIComponent(entry.slug)} className="related-card" key={entry.slug}><div className={'related-visual '+(['one','two','three'][i])}><span className="related-number" dir="ltr">{String(i+1).padStart(2,'0')}</span><span className="visual-label">ساس / ملف</span></div><div className="related-meta"><span className="tag light">ملف منشور</span><span>↗</span></div><h3>{entry.title_ar}</h3>{entry.summary_ar&&<p>{entry.summary_ar}</p>}</Link>)}{!dossiers.length&&<p>لا توجد ملفات منشورة بعد.</p>}</div><div className="related-footer"><Link href="/explore">كل المعرفة ضمن مساحة واحدة ←</Link></div></aside></main>
}
