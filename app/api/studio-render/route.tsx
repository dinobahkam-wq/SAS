import {ImageResponse} from 'next/og';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const maxDuration=30;
type RequestCard={title:string;summary?:string;eyebrow?:string;date?:string;format?:'square'|'landscape'|'portrait';theme?:'forest'|'ivory';source_name:string;license_name:string;source_url?:string;creator_name?:string;caption?:string;operation?:'preview'|'save'};
const sizes={square:{width:1080,height:1080},landscape:{width:1200,height:675},portrait:{width:1080,height:1350}};
function validUrl(x:unknown):string|null{if(typeof x!=='string'||!x.trim())return null;try{const url=new URL(x);return url.protocol==='https:'?url.toString():null}catch{return null}}
function parse(body:unknown):RequestCard{
 if(!body||typeof body!=='object')throw new Error('بيانات البطاقة غير صالحة');
 const x=body as Record<string,unknown>;
 const title=String(x.title??'').trim(),summary=String(x.summary??'').trim();
 const source_name=String(x.source_name??'').trim(),license_name=String(x.license_name??'').trim();
 if(title.length<8||title.length>240||summary.length>700||source_name.length<3||source_name.length>200||license_name.length<3||license_name.length>200)throw new Error('العنوان أو المصدر أو الترخيص غير صالح');
 if(x.source_url&& !validUrl(x.source_url))throw new Error('رابط المصدر يجب أن يكون HTTPS');
 const format=x.format==='landscape'||x.format==='portrait'?x.format:'square';
 const theme=x.theme==='ivory'?'ivory':'forest';
 const operation=x.operation==='preview'?'preview':'save';
 const eyebrow=String(x.eyebrow??'ساس | الإعلام والدراسات').slice(0,85);
 const date=String(x.date??'').slice(0,35);
 const creator_name=String(x.creator_name??'ساس').slice(0,150);
 const caption=String(x.caption??'').slice(0,450);
 return {title,summary,source_name,license_name,format,theme,operation,eyebrow,date,creator_name,caption,source_url:validUrl(x.source_url)||undefined};
}
async function image(card:RequestCard){
 const {width,height}=sizes[card.format||'square'];
 const dark=card.theme!=='ivory',bg=dark?'#103b32':'#f5f6ee',fg=dark?'#fbfcf5':'#123e32',accent=dark?'#c8e69b':'#416c50';
 // Standalone server-rendered template. No external photograph, user-provided HTML or remote font requests.
 const response=new ImageResponse(
 <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:bg,color:fg,padding:width*0.07,justifyContent:'space-between',fontFamily:'sans-serif'}} dir="rtl">
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'3px solid '+accent,paddingBottom:24,fontSize:27,fontWeight:600}}>
   <span>{card.eyebrow}</span><span style={{color:accent}}>SAS</span>
  </div>
  <div style={{display:'flex',flexDirection:'column',justifyContent:'center',flexGrow:1,gap:40}}>
   <div style={{width:90,height:7,background:accent,borderRadius:6}}/>
   <div style={{fontWeight:700,fontSize:card.title.length>120?49:card.title.length>70?61:76,lineHeight:1.3,whiteSpace:'pre-wrap',overflowWrap:'break-word'}}>{card.title}</div>
   {card.summary&&<div style={{fontSize:32,lineHeight:1.5,opacity:.85,whiteSpace:'pre-wrap'}}>{card.summary}</div>}
  </div>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'2px solid '+accent,paddingTop:24,fontSize:24}}>
   <span>{card.source_name}</span><span>{card.date||'بطاقة تحريرية · مسودة'}</span>
  </div>
 </div>,{width,height});
 return Buffer.from(await response.arrayBuffer());
}
export async function POST(request:Request){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return Response.json({error:'تعذر الاتصال بقاعدة البيانات'}, {status:503});
  const auth=request.headers.get('authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(auth))return Response.json({error:'مطلوب تسجيل دخول هيئة التحرير'}, {status:401});
  const token=auth.replace(/^Bearer\s+/i,'');
  const db=createClient(url,key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await db.auth.getUser(token);
  if(userError||!user)return Response.json({error:'جلسة غير صالحة'}, {status:401});
  // Authorization is enforced by existing editor-only RPC; never rely on JWT alone.
  const {error:roleError}=await db.rpc('sas_media_editor_list');
  if(roleError)return Response.json({error:'حساب غير مخول للوصول إلى المكتبة'}, {status:403});
  const card=parse(await request.json());
  const bytes=await image(card);
  if(card.operation==='preview')return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/png','Cache-Control':'no-store','Content-Disposition':'inline; filename="sas-card.png"'}});
  if(bytes.length>10485760)return Response.json({error:'حجم التصميم يتجاوز الحد المسموح'}, {status:413});
  const path=user.id+'/'+crypto.randomUUID()+'.png';
  const stored=await db.storage.from('sas-media').upload(path,new Uint8Array(bytes),{contentType:'image/png',upsert:false});
  if(stored.error)return Response.json({error:'تعذر حفظ PNG في التخزين الخاص: '+stored.error.message},{status:502});
  const registered=await db.rpc('sas_media_register',{
   p_storage_path:path,p_original_filename:'sas-generated-card.png',p_mime_type:'image/png',p_byte_size:bytes.length,
   p_alt_ar:'بطاقة تحريرية من ساس: '+card.title.slice(0,440),p_caption_ar:card.caption||card.title,
   p_source_name:card.source_name,p_source_url:card.source_url||null,p_license_name:card.license_name,
   p_license_url:null,p_creator_name:card.creator_name||'ساس',p_media_kind:'graphic'
  });
  if(registered.error){await db.storage.from('sas-media').remove([path]);return Response.json({error:'تعذر توثيق الصورة في المكتبة: '+registered.error.message},{status:502})}
  return Response.json({asset_id:registered.data,storage_path:path,status:'pending',published:false});
 }catch(error){return Response.json({error:error instanceof Error?error.message:'فشل إنشاء التصميم'},{status:400})}
}
