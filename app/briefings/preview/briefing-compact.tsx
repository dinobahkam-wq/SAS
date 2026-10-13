'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
type Example={title:string;region:string;category:string;fact:string;change:string;importance:string;sourceNote:string};
// SIMULATED editorial data: no item below reports an actual event.
const examples:Example[]=[
 {title:'لجنة محلية افتراضية تعلن خطة لتحسين إمدادات المياه',region:'حضرموت',category:'الخدمات والإدارة',fact:'في سيناريو الاختبار، أعلنت لجنة خدمية افتراضية خطة تشغيل جديدة لمحطات الضخ بعد سلسلة انقطاعات افتراضية خلال الأسبوع.',change:'يتحول النقاش من الوعود العامة إلى جدول زمني معلن ومؤشرات قياس أسبوعية، دون وجود دليل بعد على تحسن الخدمة فعليًا.',importance:'تتيح متابعة المواعيد والنتائج التفريق بين الإعلان المؤسسي والأثر الذي يلمسه السكان.',sourceNote:'مصدر محاكى: بيان لجنة الخدمات الافتراضية · لا يمثل وثيقة حقيقية'},
 {title:'مبادرة تفاوضية افتراضية تفتح مسارًا جديدًا لملف النقل',region:'تعز',category:'سياسة محلية',fact:'يفترض المثال عقد لقاءات تمهيدية بين جهات محلية خيالية لمناقشة آلية مرور للشاحنات والحافلات.',change:'الانتقال من تبادل المقترحات إلى تشكيل فريق فني لتحديد المتطلبات، دون التوصل إلى اتفاق نهائي.',importance:'العبرة بالخطوات العملية اللاحقة، مثل إعلان الإجراءات وتحديد الجهات المكلفة، لا بمجرد انعقاد الاجتماعات.',sourceNote:'مصدر محاكى: محضر اجتماع افتراضي · لا توجد مفاوضات موثقة في هذا المثال'},
 {title:'برنامج اقتصادي افتراضي يعلن آلية جديدة لتتبع الإنفاق',region:'عدن',category:'اقتصاد ومؤسسات',fact:'يفترض المثال أن جهة اقتصادية خيالية أطلقت لوحة مؤشرات شهرية للمشتريات والخدمات العامة.',change:'ظهور آلية معلنة للمقارنة بين المخصصات والإنفاق بدل الاقتصار على تصريحات إجمالية.',importance:'قد يعزز ذلك القدرة على مساءلة الأداء إذا نُشرت البيانات وتحققت جهة مستقلة من اكتمالها.',sourceNote:'مصدر محاكى: النشرة الاقتصادية التجريبية · البيانات مختلقة للاختبار'}
];
const ledger=[
 {region:'الحديدة',kind:'خدمات',title:'استكمال صيانة افتراضية لمرفق ساحلي',state:'سيناريو محاكى · متابعة التنفيذ مطلوبة'},
 {region:'المهرة',kind:'نقل',title:'مقترح افتراضي لتنظيم حركة الشاحنات',state:'سيناريو محاكى · قرار أولي'},
 {region:'شبوة',kind:'اقتصاد محلي',title:'تجربة افتراضية لسوق إنتاج زراعي أسبوعي',state:'سيناريو محاكى · إعلان تجريبي'},
 {region:'مأرب',kind:'تعليم',title:'خطة افتراضية لتوسعة مرافق مدرسية',state:'سيناريو محاكى · خطة دون تنفيذ'},
 {region:'لحج',kind:'مؤسسات',title:'إطلاق نافذة خدمات بلدية افتراضية',state:'سيناريو محاكى · بانتظار بيانات الأداء'},
 {region:'سقطرى',kind:'بيئة',title:'برنامج افتراضي لرصد التلوث البحري',state:'سيناريو محاكى · تقرير أولي'},
 {region:'صنعاء',kind:'خدمات عامة',title:'إعلان افتراضي لتحديث إجراءات تراخيص',state:'سيناريو محاكى · مراجعة الإجراءات'},
 {region:'إب',kind:'زراعة',title:'مشروع افتراضي لتطوير تسويق المحاصيل',state:'سيناريو محاكى · مشروع مقترح'}
];

const media=[
 {url:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=75',alt:'صورة طبيعية تعبيرية لا تمثل الحدث',caption:'صورة تعبيرية للمعاينة فقط — لا توثق واقعة في اليمن'},
 {url:'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1000&q=75',alt:'مشهد عمراني تعبيري غير مرتبط بالواقعة',caption:'صورة تعبيرية للمعاينة فقط — غير مرتبطة بمفاوضات فعلية'},
 {url:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=75',alt:'صورة تعبيرية لمخططات ومؤشرات اقتصادية',caption:'صورة تعبيرية للمعاينة فقط — لا تمثل بيانات يمنية'}
];
type Detail={title:string;region:string;category:string;fact:string;change:string;importance:string;source:string;kind:'major'|'ledger'};
const details:Detail[]=[
 ...examples.map(x=>({title:x.title,region:x.region,category:x.category,fact:x.fact,change:x.change,importance:x.importance,source:x.sourceNote,kind:'major' as const})),
 ...ledger.map(x=>({title:x.title,region:x.region,category:x.kind,fact:'في المثال الافتراضي، جرى إدراج هذا التطور ضمن سجل اليوم دون اعتباره تحولًا يستدعي افتتاحية موسعة.',change:x.state,importance:'يُظهر سجل التطورات تمثيلًا أوسع للمناطق، ويتيح العودة إلى المصدر وسياق القضية عند توافر بيانات حقيقية.',source:'تطور وهمي بالكامل · لا يوجد مصدر حقيقي',kind:'ledger' as const}))
];
export default function BriefingCompact(){
 const [selected,setSelected]=useState<Detail|null>(null);
 const [region,setRegion]=useState('الكل');
 const [category,setCategory]=useState('الكل');
 const [query,setQuery]=useState('');
 const [showMethod,setShowMethod]=useState(false);
 const [expanded,setExpanded]=useState<string|null>(null);
 const closeRef=useRef<HTMLButtonElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 const regions=['الكل',...Array.from(new Set(ledger.map(x=>x.region)))];
 const categories=['الكل',...Array.from(new Set(ledger.map(x=>x.kind)))];
 const filtered=useMemo(()=>ledger.filter(x=>(region==='الكل'||x.region===region)&&(category==='الكل'||x.kind===category)&&(!query.trim()||(x.title+' '+x.region+' '+x.kind).includes(query.trim()))),[region,category,query]);
 function open(detail:Detail){previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setSelected(detail)}
 useEffect(()=>{
  if(!selected)return;
  const old=document.body.style.overflow;document.body.style.overflow='hidden';
  const t=requestAnimationFrame(()=>closeRef.current?.focus());
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setSelected(null);
   if(event.key==='Tab'){
    const dialog=document.querySelector<HTMLElement>('[data-brief-dialog]');
    if(!dialog)return;
    const elements=Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    const first=elements[0],last=elements[elements.length-1];
    if(!first||!last)return;
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  };
  document.addEventListener('keydown',onKey);
  return()=>{cancelAnimationFrame(t);document.removeEventListener('keydown',onKey);document.body.style.overflow=old;previousFocus.current?.focus()};
 },[selected]);
 return <main className="brief-v2">
  <div className="bv2-demo" role="status">نسخة تجريبية · جميع الأحداث والتصريحات والمصادر في هذا العدد وهمية ولا تمثل أخبارًا حقيقية</div>
  <header className="bv2-top">
   <div className="bv2-heading"><span className="bv2-eyebrow">ساس / موجز التحولات اليومية</span><h1>الإحاطة اليمنية<span className="bv2-dot">.</span></h1><p>ما الذي تغيّر في اليمن، ولماذا يهم؟</p></div>
   <div className="bv2-meta"><strong>العدد التجريبي 001</strong><span>الإثنين، 12 أكتوبر 2026</span><span>نافذة رصد افتراضية: 24 ساعة</span></div>
  </header>
  <div className="bv2-toolbar"><div className="bv2-tabs"><a href="#snapshot">في دقيقة</a><a href="#major">التحولات</a><a href="#updates">التطورات</a><a href="#analysis">التحليل</a></div><button type="button" onClick={()=>setShowMethod(v=>!v)} aria-expanded={showMethod} aria-controls="bv2-method">منهجية الانتقاء <span aria-hidden="true">{showMethod?'−':'+'}</span></button></div>
  {showMethod&&<section id="bv2-method" className="bv2-method"><strong>كيف نختار التطورات؟</strong><p>الأثر، والجِدّة، والامتداد، والتوثيق، والاستمرارية. التغطية لا تعني استيعاب كل ما يحدث، وعدم ذكر منطقة لا يثبت غياب تطورات فيها. هذه البيانات تخيّلية بالكامل لأغراض اختبار التصميم.</p></section>}
  <section id="snapshot" className="bv4-lead" aria-label="صدر الإحاطة">
   <div className="bv4-lead-copy"><span className="bv2-eyebrow">المشهد في دقيقة / العدد التجريبي</span><h2>الخدمات المحلية والخطوات المؤسسية تتصدر المشهد الافتراضي</h2><p>برزت في هذه المحاكاة خطط خيالية للمياه والنقل والإفصاح المالي. الفارق الجوهري هو الانتقال من إعلان النوايا إلى إجراءات قابلة للقياس، دون أدلة بعد على التنفيذ.</p><div className="bv4-lead-bottom"><span>11 تطورًا توضيحيًا في هذا العدد</span><strong>الإعلان لا يساوي التنفيذ.</strong></div></div>
   <button type="button" className="bv4-hero" onClick={()=>open(details[0])} aria-label={'عرض التفاصيل: '+examples[0].title}><img src={media[0].url} alt={media[0].alt} /><span className="bv4-image-label">صورة تعبيرية · ليست من اليمن</span><span className="bv4-hero-overlay"><span>التحول الأبرز · حضرموت</span><strong>{examples[0].title}</strong><span>قراءة التفاصيل ←</span></span></button>
  </section>
  <section id="major" className="bv2-block bv4-major"><header className="bv2-section-head"><div><span className="bv2-eyebrow">01 / أكثر ما تغيّر</span><h2>التحولات الرئيسية</h2></div><span>عناوين موجزة وتفاصيل بنقرة واحدة</span></header>
   <div className="bv4-major-grid">{examples.slice(1).map((x,i)=><button key={x.title} type="button" className="bv4-story" onClick={()=>open(details[i+1])} aria-label={'تفاصيل: '+x.title}><div className="bv4-story-photo"><img src={media[i+1].url} alt={media[i+1].alt} loading="lazy"/><span>تعبيرية</span></div><div className="bv4-story-text"><span className="bv2-eyebrow">{x.region} / {x.category}</span><h3>{x.title}</h3><p>{x.change}</p><span className="bv4-more">التفاصيل والسياق ←</span></div></button>)}</div>
  </section>
  <section id="updates" className="bv2-block"><header className="bv2-section-head"><div><span className="bv2-eyebrow">03 / سجل اليوم</span><h2>التطورات عبر المناطق</h2></div><span>{filtered.length} من أصل {ledger.length} تطورات افتراضية</span></header>
   <div className="bv2-filters"><label>المحافظة <select value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(x=><option key={x}>{x}</option>)}</select></label><label>المجال <select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label className="bv2-search">بحث<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث في سجل اليوم"/></label>{(region!=='الكل'||category!=='الكل'||query)&&<button type="button" className="bv2-clear" onClick={()=>{setRegion('الكل');setCategory('الكل');setQuery('')}}>مسح التصفية</button>}</div>
   <div className="bv3-accordion">{filtered.length?filtered.map(x=>{const item=details.find(d=>d.kind==='ledger'&&d.region===x.region);const active=expanded===x.title;return <article className={"bv3-acc-item"+(active?" is-open":"")} key={x.title}><h3><button type="button" aria-expanded={active} aria-controls={'acc-'+ledger.indexOf(x)} onClick={()=>setExpanded(active?null:x.title)}><span className="bv2-feed-region">{x.region}<small>{x.kind}</small></span><span className="bv2-feed-title">{x.title}<small>{x.state}</small></span><span className="bv3-acc-chevron" aria-hidden="true">{active?'−':'+'}</span></button></h3>{active&&<div id={'acc-'+ledger.indexOf(x)} className="bv3-acc-body"><p>{item?.fact}</p><p><strong>ما الذي تغيّر؟</strong> {item?.change}</p><button type="button" onClick={()=>item&&open(item)}>فتح التفاصيل والمصادر ←</button></div>}</article>}):<p className="bv2-empty">لا توجد تطورات مطابقة لخيارات العرض الحالية.</p>}</div>
  </section>
  <section id="analysis" className="bv2-analysis"><div><span className="bv2-eyebrow">04 / قراءة ساس</span><h2>ما الرابط بين التطورات؟</h2><p>تُظهر المحاكاة كيف تُقارن المؤسسة بين الوعود والإجراءات القابلة للقياس. ولا تشير هذه الأمثلة إلى اتجاه سياسي فعلي في اليمن؛ بل توضح المنهج الذي ستتبعه الإحاطة مع المصادر الحقيقية.</p></div><div className="bv2-watch"><span className="bv2-eyebrow">ما الذي نراقبه؟</span><strong>ثلاثة أسئلة للإصدار التالي</strong><p>هل بدأ تشغيل المحطات؟ هل أُعلنت إجراءات النقل؟ هل نُشرت بيانات الإنفاق؟</p></div></section>
  <footer className="bv2-footer"><span><strong>ساس · الإعلام والدراسات</strong> — معاينة داخلية لا تُنشر</span><Link href="/explore">قاعدة المعرفة ←</Link></footer>
  {selected&&<div className="bv2-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section role="dialog" aria-modal="true" aria-labelledby="bv2-detail-title" data-brief-dialog className="bv2-dialog"><div className="bv2-dialog-head"><div><span className="bv2-eyebrow">تفاصيل التطور · مثال افتراضي</span><p>{selected.region} / {selected.category}</p></div><button ref={closeRef} type="button" aria-label="إغلاق التفاصيل" className="bv2-close" onClick={()=>setSelected(null)}>×</button></div><div className="bv2-dialog-body">{selected.kind==="major"&&<figure className="bv3-dialog-media"><img src={media[examples.findIndex(x=>x.title===selected.title)]?.url||media[0].url} alt="صورة تعبيرية لا توثق الحدث المذكور" /><figcaption>صورة تعبيرية · لا ترتبط بحدث موثق</figcaption></figure>}<h2 id="bv2-detail-title">{selected.title}</h2><div className="bv2-detail-row"><h3>ماذا حدث؟</h3><p>{selected.fact}</p></div><div className="bv2-detail-row"><h3>ما الذي تغيّر؟</h3><p>{selected.change}</p></div><div className="bv2-detail-row"><h3>لماذا يهم؟</h3><p>{selected.importance}</p></div><div className="bv2-detail-source"><strong>الإسناد</strong><p>{selected.source}</p><small>لا توجد وثائق أو روابط حقيقية لهذا السيناريو التجريبي.</small></div></div><div className="bv2-dialog-bottom"><button type="button" onClick={()=>setSelected(null)}>العودة إلى الإحاطة</button></div></section></div>}
 </main>
}
