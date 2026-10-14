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
const writeTools=[
 {name:'sas_approve_event',description:'Approve one exact reviewed event version with authenticated administrator identity, only following explicit human approval.',inputSchema:{type:'object',properties:{event_id:{type:'string'},expected_updated_at:{type:'string'}},required:['event_id','expected_updated_at'],additionalProperties:false}},
 {name:'sas_publish_event',description:'Publish one explicitly approved verified event. Never implies factual verification.',inputSchema:{type:'object',properties:{event_id:{type:'string'}},required:['event_id'],additionalProperties:false}},
 {name:'sas_approve_development',description:'Approve a specific development version after explicit human review.',inputSchema:{type:'object',properties:{development_id:{type:'string'},expected_updated_at:{type:'string'}},required:['development_id','expected_updated_at'],additionalProperties:false}},
 {name:'sas_publish_development',description:'Publish a specific previously approved development after readiness checks.',inputSchema:{type:'object',properties:{development_id:{type:'string'}},required:['development_id'],additionalProperties:false}}
];
const approvalTools=[
 {name:'sas_review_events',description:'Read owner event review queue without publication.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'sas_review_developments',description:'Read exact draft versions for a given event.',inputSchema:{type:'object',properties:{event_id:{type:'string'}},required:['event_id'],additionalProperties:false}},
 {name:'sas_check_development',description:'Read exact publication blockers for one development.',inputSchema:{type:'object',properties:{development_id:{type:'string'}},required:['development_id'],additionalProperties:false}}
];
const readTools=[
 {name:'sas_read_overview',description:'Read live SAS dossiers, issues, events and the current editorial role from Supabase; never invent records.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'sas_read_briefings',description:'Read editorial briefing editions, including draft status, from Supabase; authorized editorial staff only.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'sas_read_media',description:'Read private SAS media registry metadata, rights verification and source information, not public image URLs.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'sas_read_draft',description:'Read one live SAS dossier, issue or event draft record by UUID.',inputSchema:{type:'object',properties:{kind:{type:'string',enum:['dossiers','issues','events']},id:{type:'string',format:'uuid'}},required:['kind','id'],additionalProperties:false}},
 {name:'sas_read_event_developments',description:'Read the recorded developments associated with an event UUID, including their editorial state.',inputSchema:{type:'object',properties:{event_id:{type:'string',format:'uuid'}},required:['event_id'],additionalProperties:false}}
 ,{name:'sas_read_publication_queue',description:'Read live editorial publication queue, without changing publication state.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
 ,{name:'sas_read_publication_check',description:'Inspect exact publication blockers for one development. Requires administrator role.',inputSchema:{type:'object',properties:{development_id:{type:'string',format:'uuid'}},required:['development_id'],additionalProperties:false}}
];
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
 if(!/^Bearer\s+\S+$/i.test(auth)){const u=new URL(req.url);return Response.json({error:'unauthorized'},{status:401,headers:{'WWW-Authenticate':`Bearer resource_metadata="${u.origin}/.well-known/oauth-protected-resource", scope="openid email"`}})}
 const token=auth.replace(/^Bearer\s+/i,'');
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)return Response.json({error:'server not configured'},{status:503});
 const db=createClient(base,key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user){const u=new URL(req.url);return Response.json({error:'unauthorized'},{status:401,headers:{'WWW-Authenticate':`Bearer resource_metadata="${u.origin}/.well-known/oauth-protected-resource", scope="openid email"`}})}
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
 if(call.method==='tools/list')return response(id,{tools:[...readTools,...approvalTools,...writeTools,mediaTool,linkTool]});
 if(call.method!=='tools/call')return rpcError(id,-32601,'Method not found');
 const name=asString(call.params?.name),args=call.params?.arguments as Record<string,unknown>|undefined;
 if(!args||typeof args!=='object'||Array.isArray(args))return rpcError(id,-32602,'Tool arguments required');
 if(name.startsWith('sas_read_')){
  const commands:Record<string,{rpc:string;allowed:string[];arguments:(x:Record<string,unknown>)=>Record<string,unknown>}> = {
   sas_read_overview:{rpc:'sas_admin_overview',allowed:[],arguments:()=>({})},
   sas_read_briefings:{rpc:'sas_briefing_admin_list',allowed:[],arguments:()=>({})},
   sas_read_media:{rpc:'sas_media_editor_list',allowed:[],arguments:()=>({})},
   sas_read_draft:{rpc:'sas_admin_draft_details',allowed:['kind','id'],arguments:x=>({p_kind:x.kind,p_id:x.id})},
   sas_read_event_developments:{rpc:'sas_admin_event_developments',allowed:['event_id'],arguments:x=>({p_event_id:x.event_id})},
   sas_read_publication_queue:{rpc:'sas_admin_publication_queue',allowed:[],arguments:()=>({})},
   sas_read_publication_check:{rpc:'sas_publication_check',allowed:['development_id'],arguments:x=>({p_id:x.development_id})}
  };
  const command=commands[name];
  if(!command)return rpcError(id,-32602,'Unknown read tool');
  if(hasExtraKeys(args,command.allowed))return failTool(id,'Unexpected argument');
  if(name==='sas_read_draft'&&(!['dossiers','issues','events'].includes(asString(args.kind))||!validId(args.id)))return failTool(id,'Invalid kind or record ID');
  if(name==='sas_read_publication_check'&&!validId(args.development_id))return failTool(id,'Invalid development ID');
  if(name==='sas_read_event_developments'&&!validId(args.event_id))return failTool(id,'Invalid event ID');
  const read=await db.rpc(command.rpc,command.arguments(args));
  if(read.error)return failTool(id,read.error.message);
  return response(id,{content:[{type:'text',text:JSON.stringify({source:'supabase',tool:name,records:read.data})}]});
 }
 if(writeTools.some(tool=>tool.name===name)){
  if(role!=='admin')return failTool(id,'Admin access required');
  const isEvent=name.endsWith('_event'),key=isEvent?'event_id':'development_id';
  if(!validId(args[key]))return failTool(id,'Invalid target ID');
  const approving=name.startsWith('sas_approve_');
  if(approving&&(typeof args.expected_updated_at!=='string'||Number.isNaN(Date.parse(args.expected_updated_at))))return failTool(id,'Expected version timestamp required');
  const allowed=approving?[key,'expected_updated_at']:[key];
  if(hasExtraKeys(args,allowed))return failTool(id,'Unexpected argument');
  const rpc=name==='sas_approve_event'?'sas_owner_approve_event':name==='sas_publish_event'?'sas_owner_publish_event':name==='sas_approve_development'?'sas_owner_review_development':'sas_owner_publish_development';
  const params=name==='sas_approve_event'?{p_id:args.event_id,p_expected_updated_at:args.expected_updated_at}
   :name==='sas_approve_development'?{p_id:args.development_id,p_expected_updated_at:args.expected_updated_at,p_decision:'approve'}
   :{p_id:args[key]};
  const write=await db.rpc(rpc,params);
  if(write.error)return failTool(id,write.error.message);
  return response(id,{content:[{type:'text',text:JSON.stringify({operation:name,result:write.data})}]});
 }
 if(name==='sas_review_events'||name==='sas_review_developments'||name==='sas_check_development'){
  if(role!=='admin')return failTool(id,'Admin access required');
  if(name==='sas_review_developments'&&!validId(args.event_id))return failTool(id,'Valid event_id required');
  if(name==='sas_check_development'&&!validId(args.development_id))return failTool(id,'Valid development_id required');
  const fn=name==='sas_review_events'?'sas_owner_event_review_packet':name==='sas_review_developments'?'sas_owner_review_packet':'sas_owner_publication_check';
  const params=name==='sas_review_developments'?{p_event_id:args.event_id}:name==='sas_check_development'?{p_id:args.development_id}:{};
  const result=await db.rpc(fn,params);
  if(result.error)return failTool(id,result.error.message);
  return response(id,{content:[{type:'text',text:JSON.stringify(result.data)}]});
 }
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
