import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'الإحاطة اليمنية | معاينة ساس',description:'نموذج أولي للإحاطة اليومية: ما الذي تغيّر في اليمن ولماذا يهم؟'};
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
export default function BriefingPreview(){
 return <main className="brief-page">
  <div className="brief-demo-banner" role="status">عدد تجريبي بالكامل · كل الوقائع والجهات والمصادر الواردة فيه خيالية وغير صالحة للاقتباس أو النشر</div>
  <header className="brief-masthead">
   <div><span className="brief-overline">منصة ساس · قراءة في التحولات</span><h1>الإحاطة اليمنية</h1><p>ما الذي تغيّر، ولماذا يهم؟</p></div>
   <div className="brief-issue-info"><strong>العدد التجريبي 001</strong><span>12 أكتوبر 2026 · تاريخ العرض فقط</span><span>نافذة افتراضية: 11–12 أكتوبر · 08:00 صباحًا</span></div>
  </header>
  <nav className="brief-jump" aria-label="أقسام الإحاطة"><a href="#overview">المشهد في دقيقة</a><a href="#changes">التحولات</a><a href="#ledger">سجل التطورات</a><a href="#reading">قراءة المشهد</a><a href="#method">المنهجية</a></nav>
  <section id="overview" className="brief-lead">
   <div><span className="brief-kicker">01 / المشهد في دقيقة</span><h2>الخدمات المحلية والمبادرات المؤسسية تتصدر مشهدًا افتراضيًا متعدد المناطق</h2><p>في هذا العدد المحاكى، تتقاطع ثلاثة مسارات في المحافظات: خطة افتراضية لتحسين إمدادات المياه في حضرموت، ومبادرة تفاوضية تخيلية لتنظيم الحركة في تعز، وآلية مفترضة للإفصاح عن الإنفاق في عدن. المشترك بينها انتقال الخطاب من إعلان الأهداف إلى اقتراح إجراءات قابلة للقياس، لكن السيناريوهات الثلاثة لا تقدم بعد نتائج مثبتة على الأرض. وفي السجل الأوسع نعرض ثمانية تطورات تخيلية أخرى لبيان كيف تُقدَّم التغطية الجغرافية دون تضخيم كل تطور إلى عنوان رئيسي.</p><div className="brief-lead-note">خلاصة العدد الافتراضي: الإعلان عن إجراء لا يساوي تنفيذه، وغياب منطقة عن الرصد لا يثبت غياب التطورات فيها.</div></div>
   <aside><span className="brief-aside-heading">بيانات الإصدار</span><dl><div><dt>نافذة الرصد</dt><dd>24 ساعة افتراضية</dd></div><div><dt>آخر تحقق</dt><dd>12 أكتوبر · 08:00 (محاكاة)</dd></div><div><dt>حالة الإصدار</dt><dd>خيالي بالكامل · معاينة</dd></div></dl></aside>
  </section>
  <section id="changes" className="brief-section"><div className="brief-section-head"><div><span className="brief-kicker">02 / ما الذي تغيّر؟</span><h2>التحولات الرئيسية</h2></div><p>ثلاثة تطورات افتراضية لمعالجة تحليلية موسعة</p></div>
   <div className="brief-feature-grid">{examples.map((item,i)=><article className="brief-feature" key={item.title}><div className="brief-feature-meta"><span>{String(i+1).padStart(2,'0')}</span><span>{item.region} / {item.category}</span></div><h3>{item.title}</h3><dl><div><dt>ما الذي حدث؟</dt><dd>{item.fact}</dd></div><div><dt>ما الجديد؟</dt><dd>{item.change}</dd></div><div><dt>لماذا يهم؟</dt><dd>{item.importance}</dd></div></dl><p className="brief-source">{item.sourceNote}</p></article>)}</div>
  </section>
  <section id="ledger" className="brief-section"><div className="brief-section-head"><div><span className="brief-kicker">03 / التغطية الأوسع</span><h2>سجل التطورات</h2></div><p>تمثيل جغرافي وموضوعي دون حصص نشر مفروضة</p></div>
   <p className="brief-intro">يتضمن هذا النموذج ثمانية تطورات افتراضية موزعة بين محافظات ومجالات متعددة. في المنتج النهائي ستظهر هنا فقط الوقائع التي اجتازت المراجعة التحريرية، مع مصدر كل واقعة وحالة التحقق منها.</p>
   <div className="brief-ledger">{ledger.map((item,i)=><article key={item.region}><span className="brief-ledger-no">{String(i+1).padStart(2,'0')}</span><div><span className="brief-ledger-region">{item.region} · {item.kind}</span><h3>{item.title}</h3><p>{item.state}</p></div></article>)}</div>
  </section>
  <section id="reading" className="brief-reading"><div><span className="brief-kicker">04 / قراءة ساس</span><h2>كيف تتصل هذه التطورات؟</h2><p>في السيناريو التخييلي لهذه الإحاطة، يبدو أن الجهات الافتراضية الثلاث تتجه إلى إعلان إجراءات أكثر قابلية للمتابعة. لا يعني هذا وجود تحول حقيقي أو اتجاه سياسي قائم في اليمن؛ إنه مثال على طريقة المقارنة بين التصريح والخطوة التنفيذية. لو كانت الوقائع حقيقية، لاحتجنا إلى بيانات قياس لاحقة ومصادر مستقلة قبل وصفها بتحول مؤسسي.</p></div><aside><h3>ما الذي نراقبه لاحقًا؟</h3><p>في النسخة الافتراضية التالية سنسأل: هل بدأ تشغيل محطات الضخ؟ هل نُشرت إجراءات المرور؟ هل ظهرت أول بيانات للإنفاق؟ هذه مؤشرات اختبارية، وليست توقعات لأحداث حقيقية.</p></aside></section>
  <section id="method" className="brief-method"><div><span className="brief-kicker">05 / الشفافية والأرشيف</span><h2>كيف نختار ما ننشره؟</h2><p>اختيرت هذه الوقائع الخيالية لإظهار تنوع المناطق والموضوعات واختلاف الأهمية التحريرية. أما عند إطلاق الإحاطة الفعلية، فسيُحكم اختيار المواد بمعايير الأثر والجِدّة والامتداد والتوثيق والاستمرارية، مع إعلان حدود الرصد وروابط المصادر وسياسة التصحيح. جميع «المصادر» المذكورة في هذه المعاينة محاكاة لا تقابل وثائق حقيقية.</p></div><div className="brief-method-links"><Link href="/explore">استكشف قاعدة معرفة ساس ←</Link><Link href="/">العودة إلى المنصة ←</Link></div></section>
  <footer className="brief-footer"><strong>ساس | الإعلام والدراسات</strong><span>إصدار وهمي لغرض اختبار التصميم فقط · لا يُستخدم بوصفه مصدرًا إخباريًا</span></footer>
 </main>
}
