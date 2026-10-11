import {NextResponse} from 'next/server';
const logo='https://nrmwshoytmzcmureetjb.supabase.co/storage/v1/object/public/SAS%20LOGO/SAS_LOGO.png';
export async function GET(){
 try{
  const response=await fetch(logo,{next:{revalidate:86400}});
  if(!response.ok)throw new Error('logo unavailable');
  const buffer=await response.arrayBuffer();
  return new NextResponse(buffer,{headers:{'Content-Type':response.headers.get('content-type')||'image/png','Cache-Control':'public, max-age=3600, stale-while-revalidate=86400'}});
 }catch{return NextResponse.json({error:'تعذر تحميل الشعار'}, {status:502})}
}
