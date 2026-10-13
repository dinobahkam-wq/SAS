import type {Metadata} from 'next';
import LiveBriefing from './live-briefing';
export const metadata:Metadata={title:'الإحاطة اليمنية — مسودة تحريرية حقيقية | ساس',description:'معاينة داخلية لعدد 13 أكتوبر 2026 اعتمادًا على بيانات موثقة بالمصادر من Supabase.'};
export default function BriefingPreview(){return <LiveBriefing/>}
