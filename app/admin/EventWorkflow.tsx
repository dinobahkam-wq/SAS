'use client';
import {useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
type Props={db:SupabaseClient;eventId:string;role:string};
export default function EventWorkflow({db,eventId,role}:Props){
 const [stage,setStage]=useState('draft');
 const [start,setStart]=useState('');
 const [note,setNote]=useState('');
 const [checks,setChecks]=useState<string[]|null>(null);
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 useEffect(()=>{let live=true;db.rpc('sas_admin_event_editor',{p_id:eventId}).then(({data,error})=>{
 if(!live)return;
 if(error){setNotice(error.message);return}
 setStage(data?.editorial_stage??'draft');
 setStart(data?.starts_at?new Date(data.starts_at).toISOString().slice(0,16):'');
 setNote(data?.review_note??'');
 });return()=>{live=false}},[db,eventId]);
 async function saveDate(){if(!start)return;setBusy(true);const {error}=await db.rpc('sas_admin_set_event_date',{p_id:eventId,p_starts_at:new Date(start).toISOString()});setBusy(false);setNotice(error?error.message:'حُفظ تاريخ الحدث.')}
 async function act(action:string){setBusy(true);setNotice('');const {data,error}=await db.rpc('sas_event_workflow',{p_id:eventId,p_action:action,p_note:note.trim()});setBusy(false);if(error){setNotice(error.message);return}
 if(action==='check'){setChecks(data?.problems??[]);setReady(data?.ready===true);return}
 if(action==='submit')setStage('review');
 if(action==='approve')setStage('approved');
 if(action==='return')setStage('draft');
 if(action==='publish')setNotice('تم نشر الحدث. أعد فتح لوحة الإدارة لتحديث السجلات.');
 else setNotice('حُفظ القرار التحريري.');}
 return <section className="event-workflow admin-panel"><h2>مراجعة الحدث ونشره</h2><p>الحالة: {stage==='draft'?'مسودة':stage==='review'?'بانتظار المراجعة':'معتمد تحريرياً'}</p>
 {stage==='draft'&&<><label>تاريخ بدء الحدث<input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></label><button disabled={busy||!start} type="button" onClick={()=>void saveDate()}>حفظ التاريخ</button>{['admin','editor'].includes(role)&&<button disabled={busy} type="button" onClick={()=>void act('submit')}>تقديم الحدث للمراجعة</button>}</>}
 {stage==='review'&&['reviewer','admin'].includes(role)&&<><label>ملاحظات المراجع<textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={busy} type="button" onClick={()=>void act('approve')}>اعتماد الحدث تحريرياً</button><button disabled={busy||note.trim().length<5} type="button" onClick={()=>void act('return')}>إعادة الحدث للتعديل</button></>}
 {stage==='approved'&&role==='admin'&&<><button disabled={busy} type="button" onClick={()=>void act('check')}>فحص جاهزية نشر الحدث</button>{checks&&<div>{checks.map((p,i)=><p key={i}>{p}</p>)}{ready&&<button disabled={busy} type="button" onClick={()=>void act('publish')}>اعتماد قرار نشر الحدث</button>}</div>}</>}
 {notice&&<p role="status" className="admin-feedback">{notice}</p>}</section>
}