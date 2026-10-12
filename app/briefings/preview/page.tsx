import type {Metadata} from 'next';
import BriefingCompact from './briefing-compact';
export const metadata:Metadata={title:'الإحاطة اليمنية | معاينة تفاعلية — ساس',description:'معاينة داخلية لإحاطة يومية مكثفة، بمحتوى افتراضي كامل ونوافذ لعرض تفاصيل التطورات.'};
export default function BriefingPreview(){return <BriefingCompact/>}
