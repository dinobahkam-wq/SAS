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

export type RelatedEntry={slug:string;title:string;summary?:string|null;kind:'dossiers'|'issues'|'events'};
export type PublicDevelopment={headline:string;description:string|null;occurred_at:string|null;sources:{name:string;url:string}[]};
async function publicRpc<T>(method:string,payload:object):Promise<T>{
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)return [] as unknown as T;
 try{
  const response=await fetch(base.replace(/\/$/,'')+'/rest/v1/rpc/'+method,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},body:JSON.stringify(payload),next:{revalidate:60}});
  if(!response.ok){console.error('SAS public relationship error:',method,response.status);return [] as unknown as T}
  const data:unknown=await response.json();
  return (Array.isArray(data)?data:[]) as T;
 }catch(error){console.error('SAS public relationship unavailable:',method,error);return [] as unknown as T}
}
export const getPublicRelated=(kind:PublicKind,slug:string)=>publicRpc<RelatedEntry[]>('sas_public_related',{p_kind:kind,p_slug:slug});
export const getPublicDevelopments=(slug:string)=>publicRpc<PublicDevelopment[]>('sas_public_event_developments',{p_slug:slug});
