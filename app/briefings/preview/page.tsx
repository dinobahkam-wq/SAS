import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'الإحاطة اليمنية | معاينة ساس',description:'نموذج أولي للإحاطة اليومية: ما الذي تغيّر في اليمن ولماذا يهم؟'};
type Example={title:string;region:string;category:string;fact:string;change:string;importance:string;sourceNote:string};
const examples:Example[]=[
 {title:'مثال على تطور سياسي محلي',region:'حضرموت',category:'سياسة محلية',fact:'يُسجّل هنا مضمون الإعلان أو القرار بعد التحقق من مصدره.',change:'يُبيّن المحرر الفرق بين الموقف السابق والتطور الحالي.',importance:'تُشرح الدلالة المحتملة دون تحويل الاستنتاج إلى حقيقة مثبتة.',sourceNote:'مثال تخطيطي — لا توجد واقعة أو جهة مصدر محددة'},
 {title:'مثال على تطور مؤسسي',region:'تعز',category:'مؤسسات',fact:'يُوضع الإجراء الموثق وتوقيته والجهة التي اتخذته.',change:'هل وقع تنفيذ جديد أم صدر تصريح إضافي فقط؟',importance:'ما الأثر الفعلي المحتمل على الخدمات أو الحوكمة؟',sourceNote:'مثال تخطيطي — لا توجد واقعة أو جهة مصدر محددة'},
 {title:'مثال على موقف دبلوماسي',region:'علاقات خارجية',category:'دبلوماسية',fact:'يُذكر نص الموقف الرسمي وتاريخه ورابط الوثيقة الأصلية.',change:'مقارنة الموقف بالموقف السابق إن توفرت الأدلة.',importance:'شرح صلته بالملفات اليمنية مع بيان حدود المعرفة.',sourceNote:'مثال تخطيطي — لا توجد واقعة أو جهة مصدر محددة'}
];
const ledger=[
 {region:'عدن',kind:'اقتصاد ومؤسسات',title:'موضع لتطور اقتصادي موثق',state:'قالب توضيحي'},
 {region:'الحديدة',kind:'أمن وميدان',title:'موضع لتطور ميداني موثق',state:'قالب توضيحي'},
 {region:'المهرة',kind:'سياسة محلية',title:'موضع لتطور محلي موثق',state:'قالب توضيحي'},
 {region:'شبوة',kind:'خدمات',title:'موضع لتطور خدمي موثق',state:'قالب توضيحي'}
];
export default function BriefingPreview(){
 return <main className="brief-page">
  <div className="brief-demo-banner" role="status">معاينة تصميمية فقط · لا تتضمن أخبارًا حقيقية أو إصدارًا منشورًا</div>
  <header className="brief-masthead">
   <div><span className="brief-overline">منصة ساس · قراءة في التحولات</span><h1>الإحاطة اليمنية</h1><p>ما الذي تغيّر، ولماذا يهم؟</p></div>
   <div className="brief-issue-info"><strong>العدد التجريبي 000</strong><span>نموذج تنفيذي · دون تاريخ رصد فعلي</span><span>النطاق المستهدف: اليمن وعلاقاته الخارجية</span></div>
  </header>
  <nav className="brief-jump" aria-label="أقسام الإحاطة"><a href="#overview">المشهد في دقيقة</a><a href="#changes">التحولات</a><a href="#ledger">سجل التطورات</a><a href="#reading">قراءة المشهد</a><a href="#method">المنهجية</a></nav>
  <section id="overview" className="brief-lead">
   <div><span className="brief-kicker">01 / المشهد في دقيقة</span><h2>صورة جامعة لليمن في إصدار واحد، دون خلط الخبر بالتفسير</h2><p>هذا نموذج لمكان الخلاصة الافتتاحية. في الإصدار الفعلي تُحرّر خلاصة مركزة من الوقائع المتحقق منها خلال نافذة رصد محددة، وتوضح أهم التحولات وما لم يتغير، ثم توجه القارئ إلى أدلتها.</p><div className="brief-lead-note">المبدأ التحريري: غياب التطور عن الرصد لا يعني أنه لم يحدث.</div></div>
   <aside><span className="brief-aside-heading">بيانات الإصدار</span><dl><div><dt>نافذة الرصد</dt><dd>تحدد عند التحرير</dd></div><div><dt>آخر تحقق</dt><dd>يحدد عند المراجعة</dd></div><div><dt>حالة الإصدار</dt><dd>تجريبي غير منشور</dd></div></dl></aside>
  </section>
  <section id="changes" className="brief-section"><div className="brief-section-head"><div><span className="brief-kicker">02 / ما الذي تغيّر؟</span><h2>التحولات الرئيسية</h2></div><p>أمثلة للهيكل التحريري، وليست أخبارًا من الواقع</p></div>
   <div className="brief-feature-grid">{examples.map((item,i)=><article className="brief-feature" key={item.title}><div className="brief-feature-meta"><span>{String(i+1).padStart(2,'0')}</span><span>{item.region} / {item.category}</span></div><h3>{item.title}</h3><dl><div><dt>ما الذي حدث؟</dt><dd>{item.fact}</dd></div><div><dt>ما الجديد؟</dt><dd>{item.change}</dd></div><div><dt>لماذا يهم؟</dt><dd>{item.importance}</dd></div></dl><p className="brief-source">{item.sourceNote}</p></article>)}</div>
  </section>
  <section id="ledger" className="brief-section"><div className="brief-section-head"><div><span className="brief-kicker">03 / التغطية الأوسع</span><h2>سجل التطورات</h2></div><p>تمثيل جغرافي وموضوعي دون حصص نشر مفروضة</p></div>
   <p className="brief-intro">هنا يظهر سجل مختصر للتطورات المتحقق منها التي لم تُمنح معالجة تحليلية موسعة. يُعرض المصدر وحالة التحقق لكل سجل عند توفر البيانات الفعلية.</p>
   <div className="brief-ledger">{ledger.map((item,i)=><article key={item.region}><span className="brief-ledger-no">{String(i+1).padStart(2,'0')}</span><div><span className="brief-ledger-region">{item.region} · {item.kind}</span><h3>{item.title}</h3><p>{item.state}</p></div></article>)}</div>
  </section>
  <section id="reading" className="brief-reading"><div><span className="brief-kicker">04 / قراءة ساس</span><h2>كيف تتصل هذه التطورات؟</h2><p>تُكتب هنا قراءة تفسيرية قصيرة توضح العلاقات التي تدعمها الأدلة، وما يبقى مجرد احتمال أو تفسير بديل. لا تُعرض القراءة التحليلية على أنها حقيقة مكتملة.</p></div><aside><h3>ما الذي نراقبه لاحقًا؟</h3><p>مؤشرات محددة قابلة للمراجعة في الإصدار التالي، وليست تنبؤات جازمة.</p></aside></section>
  <section id="method" className="brief-method"><div><span className="brief-kicker">05 / الشفافية والأرشيف</span><h2>كيف نختار ما ننشره؟</h2><p>تستند المفاضلة إلى الأثر والجِدّة والامتداد والتوثيق والاستمرارية. ولا يُفهم غياب منطقة عن هذا العدد على أنه غياب أحداث فيها. يجب عرض حدود مصادر الرصد والتصحيحات عند الإطلاق.</p></div><div className="brief-method-links"><Link href="/explore">استكشف قاعدة معرفة ساس ←</Link><Link href="/">العودة إلى المنصة ←</Link></div></section>
  <footer className="brief-footer"><strong>ساس | الإعلام والدراسات</strong><span>الإحاطة اليومية: منتج قيد التطوير، لا يمثل إصدارًا خبريًا منشورًا</span></footer>
 </main>
}
