import './styles.css';
export const metadata={title:'منصة ساس — تجربة محلية',description:'نسخة محلية لا تتضمن محتوى إخباري حقيقي'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang='ar' dir='rtl'><body><header><strong>منصة ساس <small>SAS</small></strong><nav><a href='/'>الرئيسية</a><a href='/events/sample-event'>الأحداث</a></nav></header>{children}<footer>نسخة تجريبية — لا تمثل المنصة المنشورة</footer></body></html>}
