// Operational readiness probe: checks that the published database RPC is reachable.
// Never exposes credentials, team membership, editorial data or unpublished drafts.
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'};
 if(!endpoint||!key)return Response.json({service:'sas',status:'degraded',database:'not_configured'},{status:503,headers});
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6000);
  try{
   const url=endpoint.replace(/\\/$/,'')+'/rest/v1/rpc/sas_public_directory';
   const upstream=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key},body:JSON.stringify({p_kind:'dossiers'}),cache:'no-store',signal:controller.signal});
   if(!upstream.ok)return Response.json({service:'sas',status:'degraded',database:'unavailable'},{status:503,headers});
   const body:unknown=await upstream.json();
   if(!Array.isArray(body))return Response.json({service:'sas',status:'degraded',database:'unexpected_response'},{status:503,headers});
   return Response.json({service:'sas',status:'ok',database:'reachable'},{status:200,headers});
  }finally{clearTimeout(timeout)}
 }catch{
  return Response.json({service:'sas',status:'degraded',database:'unavailable'},{status:503,headers});
 }
}
