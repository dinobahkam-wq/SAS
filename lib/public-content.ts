export type PublicEntry={slug:string;title_ar:string;summary_ar:string|null;starts_at:string|null};
export type PublicKind='dossiers'|'issues'|'events';
export async function getPublicDirectory(kind:PublicKind):Promise<PublicEntry[]>{
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!anon)return [];
 try{
  const response=await fetch(base.replace(/\/$/,'')+'/rest/v1/rpc/sas_public_directory',{
   method:'POST',
   headers:{'Content-Type':'application/json','apikey':anon,'Authorization':'Bearer '+anon},
   body:JSON.stringify({p_kind:kind}),
   next:{revalidate:60}
  });
  if(!response.ok){console.error('SAS directory error:',kind,response.status);return []}
  const json:unknown=await response.json();
  if(!Array.isArray(json))return [];
  return json.filter((item):item is PublicEntry=>typeof item==='object'&&item!==null&&typeof item.slug==='string'&&typeof item.title_ar==='string');
 }catch(error){console.error('SAS directory unavailable:',kind,error);return []}
}
