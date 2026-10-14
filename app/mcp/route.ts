import {createClient} from '@supabase/supabase-js';
import {POST as renderCard} from '../api/studio-render/route';

export const runtime='nodejs';
export const maxDuration=30;
type Rpc={jsonrpc?:string;id?:number|string|null;method?:string;params?:Record<string,unknown>};
const mediaTool={name:'sas_render_card',description:'Create a verified-auth SAS graphic from a user-approved editorial headline; preview returns a PNG image, save creates an unpublished private library asset. Never claim fact-checking has been performed.',inputSchema:{type:'object',properties:{
 title:{type:'string',minLength:8,maxLength:240},summary:{type:'string',maxLength:700},
 format:{type:'string',enum:['square','landscape','portrait']},
 theme:{type:'string',enum:['forest','ivory']},operation:{type:'string',enum:['preview','save']},
 source_name:{type:'string'},source_url:{type:'string',format:'uri'},license_name:{type:'string'},creator_name:{type:'string'},caption:{type:'string'},date:{type:'string'}
 },required:['title','source_name','license_name'],additionalProperties:false}};
const linkTool={name:'sas_link_draft_media',description:'Attach a previously saved media asset to exactly one SAS draft item: briefing, event, or development. Does not publish the item or image.',inputSchema:{type:'object',properties:{asset_id:{type:'string',format:'uuid'},edition_id:{type:'string',format:'uuid'},event_id:{type:'string',format:'uuid'},development_id:{type:'string',format:'uuid'},display_role:{type:'string',enum:['hero','card','gallery','document']},position:{type:'integer',minimum:1}},required:['asset_id','display_role'],additionalProperties:false}};
function response(id:Rpc['id'],result:unknown){return Response.json({jsonrpc:'2.0',id,result},{headers:{'Cache-Control':'no-store'}})}
function rpcError(id:Rpc['id'],code:number,message:string){return Response.json({jsonrpc:'2.0',id,error:{code,message}},{headers:{'Cache-Control':'no-store'}})}
function asString(input:unknown){return typeof input==='string'?input:''}
function validId(input:unknown){return typeof input==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)}
const MAX_BODY_BYTES=24_000;
function hasExtraKeys(data:Record<string,unknown>,allowed:string[]){return Object.keys(data).some(key=>!allowed.includes(key))}
function failTool(id:Rpc['id'],message:string){return response(id,{isError:true,content:[{type:'text',text:message}]})}
export async function POST(req:Request){
 const declaredSize=Number(req.headers.get('content-length')||0);
 if(declaredSize>MAX_BODY_BYTES)return Response.json({error:'request too large'},{status:413});
 const auth=req.headers.get('authorization')||'';
 if(!/^Bearer\s+\S+$/i.test(auth))return Response.json({error:'unauthorized'},{status:401});
 const token=auth.replace(/^Bearer\s+/i,'');
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)return Response.json({error:'server not configured'},{status:503});
 const db=createClient(base,key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return Response.json({error:'unauthorized'},{status:401});
 const {data:overview,error:teamError}=await db.rpc('sas_admin_overview');
 const role=(overview as {role?:string}|null)?.role;
 if(teamError||!['admin','editor'].includes(role||''))return Response.json({error:'forbidden'},{status:403});
 let call:Rpc;
 try{const raw=await req.text();if(raw.length>MAX_BODY_BYTES)return Response.json({error:'request too large'},{status:413});call=JSON.parse(raw) as Rpc}catch{return rpcError(null,-32700,'Parse error')}
 if(call.jsonrpc!=='2.0'||typeof call.method!=='string')return rpcError(call.id,-32600,'Invalid Request');
 const id=call.id;
 if(call.method==='initialize')return response(id,{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'sas-editorial-operator',version:'0.1.0'}});
 if(call.method==='notifications/initialized')return new Response(null,{status:202});
 if(call.method==='ping')return response(id,{});
 if(call.method==='tools/list')return response(id,{tools:[mediaTool,linkTool]});
 if(call.method!=='tools/call')return rpcError(id,-32601,'Method not found');
 const name=asString(call.params?.name),args=call.params?.arguments as Record<string,unknown>|undefined;
 if(!args||typeof args!=='object'||Array.isArray(args))return rpcError(id,-32602,'Tool arguments required');
 if(name==='sas_render_card'){
  if(hasExtraKeys(args,['title','summary','format','theme','operation','source_name','source_url','license_name','creator_name','caption','date']))return failTool(id,'Unexpected card input field.');
  if(!['preview','save',undefined].includes(args.operation as string|undefined))return failTool(id,'Invalid operation.');
  const body={...args,operation:args.operation==='save'?'save':'preview'};
  const synthetic=new Request('http://localhost/api/studio-render',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
  const result=await renderCard(synthetic);
  if(!result.ok){let message='Rendering failed';try{const data=await result.json() as {error?:string};message=data.error||message}catch{}return response(id,{isError:true,content:[{type:'text',text:message}]})}
  if(body.operation==='save')return response(id,{content:[{type:'text',text:await result.text()}]});
  const bin=Buffer.from(await result.arrayBuffer());
  return response(id,{content:[{type:'image',data:bin.toString('base64'),mimeType:'image/png'},{type:'text',text:'Unpublished preview. The design has not been saved or approved.'}]});
 }
 if(name==='sas_link_draft_media'){
  if(hasExtraKeys(args,['asset_id','edition_id','event_id','development_id','display_role','position']))return failTool(id,'Unexpected link input field.');
  const specified=['edition_id','event_id','development_id'].filter(k=>args[k]!==undefined&&args[k]!==null);
  if(!validId(args.asset_id)||specified.length!==1||!validId(args[specified[0]]))return failTool(id,'Specify exactly one valid draft target and asset UUID.');
  if(!['hero','card','gallery','document'].includes(asString(args.display_role)))return failTool(id,'Invalid display role.');
  if(args.position!==undefined&&(!Number.isInteger(args.position)||Number(args.position)<1||Number(args.position)>100))return failTool(id,'Invalid position.');
  const callResult=await db.rpc('sas_media_link_draft',{
   p_asset_id:args.asset_id,p_edition_id:validId(args.edition_id)?args.edition_id:null,
   p_development_id:validId(args.development_id)?args.development_id:null,
   p_event_id:validId(args.event_id)?args.event_id:null,
   p_display_role:args.display_role||'card',p_position:args.position||1
  });
  if(callResult.error)return response(id,{isError:true,content:[{type:'text',text:callResult.error.message}]});
  return response(id,{content:[{type:'text',text:JSON.stringify({link_id:callResult.data,published:false})}]});
 }
 return rpcError(id,-32602,'Unknown tool');
}
export async function GET(){return Response.json({error:'MCP uses authenticated POST requests'},{status:405})}
