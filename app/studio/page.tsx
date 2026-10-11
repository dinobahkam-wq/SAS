'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
type Format='square'|'portrait'|'landscape';
type Skin='forest'|'ink'|'ivory';
type Mode='news'|'urgent'|'statement';
type Page={lines:string[]};
const sizes:Record<Format,{w:number;h:number;label:string}>={square:{w:1080,h:1080,label:'مربع 1080 × 1080'},portrait:{w:1080,h:1350,label:'عمودي 1080 × 1350'},landscape:{w:1200,h:675,label:'أفقي 1200 × 675'}};
const skins:Record<Skin,{bg:string,fg:string,accent:string,dim:string}>={forest:{bg:'#092d28',fg:'#fffefa',accent:'#d6ee91',dim:'#d3e3dc'},ink:{bg:'#182730',fg:'#ffffff',accent:'#e8b5a8',dim:'#cbd4d8'},ivory:{bg:'#faf9f3',fg:'#183833',accent:'#396a53',dim:'#526860'}};
const modes:Record<Mode,string>={news:'خبر',urgent:'عاجل',statement:'بيان رسمي'};
type Config={mode:Mode;format:Format;skin:Skin;title:string;body:string;issuer:string;date:string;logo:HTMLImageElement|null};
const serif='"Sas Thmanyah Serif","Sas Thmanyah Sans",sans-serif';
const sans='"Sas Thmanyah Sans",sans-serif';
function toLines(ctx:CanvasRenderingContext2D,text:string,maxWidth:number):string[]{
 const output:string[]=[];
 for(const paragraph of text.replace(/\r/g,'').split('\n')){
  if(!paragraph.trim()){output.push('');continue}
  let line='';
  for(const word of paragraph.trim().split(/\s+/)){
   const candidate=line?line+' '+word:word;
   if(ctx.measureText(candidate).width<=maxWidth){line=candidate;continue}
   if(line)output.push(line);
   line='';
   for(const ch of Array.from(word)){
    if(ctx.measureText(line+ch).width>maxWidth&&line){output.push(line);line=ch}else line+=ch;
   }
  }
  if(line)output.push(line);
 }
 return output;
}
function plan(cfg:Config,ctx:CanvasRenderingContext2D):{pages:Page[];font:number;lineHeight:number;error:string}{
 const {w,h}=sizes[cfg.format];
 const statement=cfg.mode==='statement';
 const maxWidth=w-152;
 const body=statement?cfg.body.trim():cfg.title.trim();
 if(!body)return {pages:[],font:0,lineHeight:0,error:'أدخل نصًا أولًا'};
 if(statement&&!cfg.title.trim())return {pages:[],font:0,lineHeight:0,error:'أدخل عنوان البيان'};
 let font=statement?(cfg.format==='landscape'?33:43):(cfg.format==='landscape'?73:86);
 let lineHeight=font*(statement?1.7:1.49);
 const top=statement?385:202;
 const bottom=h-174;
 if(bottom-top<lineHeight*3)return {pages:[],font:0,lineHeight:0,error:'القياس الأفقي غير مناسب للبيان؛ اختر المربع أو العمودي'};
 if(statement){
  ctx.font='400 '+font+'px '+sans;
  const lines=toLines(ctx,body,maxWidth);
  const maxLines=Math.max(2,Math.floor((bottom-top)/lineHeight));
  const pages:Page[]=[];
  for(let i=0;i<lines.length;){
   const stop=Math.min(lines.length,i+maxLines);
   const slice=lines.slice(i,stop);
   pages.push({lines:slice});i=stop;
  }
  return {pages,font,lineHeight,error:''};
 }
 let lines:string[]=[];
 while(font>=38){
  ctx.font='500 '+font+'px '+serif;
  lines=toLines(ctx,body,maxWidth);
  lineHeight=font*1.49;
  if(lines.length*lineHeight<=bottom-top)break;
  font-=2;
 }
 if(lines.length*lineHeight>bottom-top)return {pages:[],font,lineHeight,error:'العنوان أطول من مساحة البطاقة. اختصره أو حوّله إلى بيان متعدد الصفحات.'};
 return {pages:[{lines}],font,lineHeight,error:''};
}
function draw(canvas:HTMLCanvasElement,cfg:Config,index:number):{total:number;error:string}{
 const {w,h}=sizes[cfg.format];canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)return {total:0,error:'تعذر فتح محرك الرسم'};
 const {pages,font,lineHeight,error}=plan(cfg,ctx);
 if(error)return {total:0,error};
 const p=pages[Math.min(index,pages.length-1)];const c=skins[cfg.skin];
 ctx.fillStyle=c.bg;ctx.fillRect(0,0,w,h);
 // A restrained editorial accent, not a wide decorative stripe.
 ctx.fillStyle=c.accent;ctx.fillRect(w-12,0,12,h);
 ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='top';
 ctx.fillStyle=c.accent;ctx.font='700 34px '+sans;
 ctx.fillText(modes[cfg.mode],w-76,63);
 ctx.strokeStyle=c.accent;ctx.globalAlpha=.52;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(72,137);ctx.lineTo(w-76,137);ctx.stroke();ctx.globalAlpha=1;
 if(cfg.mode==='statement'){
  ctx.fillStyle=c.fg;ctx.font='500 51px '+serif;
  const titleLines=toLines(ctx,cfg.title,w-152);
  if(titleLines.length>2)return {total:pages.length,error:'عنوان البيان أطول من سطرين؛ استخدم عنوانًا موجزًا وانقل النص الكامل إلى المتن'};
  titleLines.forEach((line,j)=>ctx.fillText(line,w-76,170+j*70));
  ctx.fillStyle=c.dim;ctx.font='400 25px '+sans;ctx.fillText(cfg.issuer||'الجهة المصدرة غير محددة',w-76,325);
  ctx.fillStyle=c.fg;ctx.font='400 '+font+'px '+sans;
  p.lines.forEach((line,j)=>{if(line)ctx.fillText(line,w-76,385+j*lineHeight)});
 }else{
  ctx.fillStyle=c.fg;ctx.font='500 '+font+'px '+serif;
  const y=Math.max(210,Math.floor((h-p.lines.length*lineHeight)/2)-5);
  p.lines.forEach((line,j)=>ctx.fillText(line,w-76,y+j*lineHeight));
 }
 const foot=h-162;
 ctx.strokeStyle=c.accent;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(72,foot);ctx.lineTo(w-76,foot);ctx.stroke();ctx.globalAlpha=1;
 // The source logo is dark ink: always place it on a fully opaque pale surface.
 const badgeW=260,badgeH=122,badgeX=w-76-badgeW,badgeY=foot+14;
 ctx.fillStyle='#faf9f3';ctx.beginPath();ctx.roundRect(badgeX,badgeY,badgeW,badgeH,15);ctx.fill();
 if(cfg.logo){
  const ratio=Math.min((badgeW-28)/cfg.logo.width,(badgeH-18)/cfg.logo.height);
  const iw=cfg.logo.width*ratio,ih=cfg.logo.height*ratio;
  ctx.drawImage(cfg.logo,badgeX+(badgeW-iw)/2,badgeY+(badgeH-ih)/2,iw,ih);
 }else{
  ctx.fillStyle='#183833';ctx.font='700 30px '+sans;ctx.textAlign='center';ctx.fillText('ساس',badgeX+badgeW/2,badgeY+42);ctx.textAlign='right';
 }
 ctx.direction='ltr';ctx.textAlign='left';ctx.fillStyle=c.dim;ctx.font='400 25px '+sans;ctx.fillText(cfg.date,72,foot+53);
 if(cfg.mode==='statement'){ctx.fillText(String(index+1)+' / '+String(pages.length),72,foot+89)}
 return {total:pages.length,error:''};
}
async function getLogo():Promise<HTMLImageElement|null>{
 return await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src='/api/studio-logo'});
}
export default function Studio(){
 const [mode,setMode]=useState<Mode>('news');
 const [format,setFormat]=useState<Format>('portrait');
 const [skin,setSkin]=useState<Skin>('forest');
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [issuer,setIssuer]=useState('');
 const [date,setDate]=useState(()=>{const p=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:'Asia/Aden',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(type:string)=>p.find(x=>x.type===type)?.value??'';return get('year')+'/'+get('month')+'/'+get('day')});
 const [page,setPage]=useState(0);const [count,setCount]=useState(0);
 const [error,setError]=useState('');const [logo,setLogo]=useState<HTMLImageElement|null>(null);
 const [exporting,setExporting]=useState(false);const canvas=useRef<HTMLCanvasElement>(null);
 const cfg=useMemo(()=>({mode,format,skin,title,body,issuer,date,logo}),[mode,format,skin,title,body,issuer,date,logo]);
 useEffect(()=>{let live=true;void getLogo().then(img=>{if(live)setLogo(img)});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;const id=setTimeout(()=>{void (async()=>{
  if(!canvas.current)return;
  try{await Promise.all([document.fonts.load('500 86px '+serif),document.fonts.load('400 43px '+sans),document.fonts.load('700 34px '+sans)]);
   if(!live)return;const result=draw(canvas.current,cfg,page);
   if(live){setError(result.error);setCount(result.total);if(page>=result.total&&result.total>0)setPage(result.total-1)}
  }catch{if(live)setError('فشل تحميل الخطوط أو الرسم')}
 })()},120);return()=>{live=false;clearTimeout(id)}},[cfg,page]);
 async function exportPages(){
  if(exporting||!canvas.current)return;
  setExporting(true);
  try{
   await document.fonts.ready;
   if(!logo){setError('لم يكتمل تحميل الشعار الرسمي؛ لا يمكن تصدير الصورة');return}
   const temp=document.createElement('canvas');const first=draw(temp,cfg,0);
   if(first.error){setError(first.error);return}
   for(let i=0;i<first.total;i++){
    const result=draw(temp,cfg,i);if(result.error){setError(result.error);return}
    const blob=await new Promise<Blob|null>(resolve=>temp.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('فشل إنشاء الصورة');
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='SAS-'+mode+'-'+String(i+1).padStart(2,'0')+'-of-'+first.total+'.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    if(first.total>1)await new Promise(resolve=>setTimeout(resolve,180));
   }
  }catch{setError('تعذر التصدير؛ تحقق من إعدادات تنزيل الملفات المتعددة')}finally{setExporting(false)}
 }
 return <main className="knowledge-page studio-page">
 <header className="knowledge-hero"><span className="eyebrow">استوديو ساس · V2</span><h1>صور الأخبار والبيانات</h1><p>معاينة وتصدير محلي دون نشر آلي أو تعديل تلقائي للبيان.</p></header>
 <div className="studio-layout"><section className="admin-panel studio-fields">
 <h2>إعداد المادة</h2>
 <label>نوع التصميم<select value={mode} onChange={e=>{setMode(e.target.value as Mode);setPage(0)}}>{(Object.keys(modes) as Mode[]).map(k=><option key={k} value={k}>{modes[k]}</option>)}</select></label>
 <label>{mode==='statement'?'عنوان البيان':'نص الخبر'}<textarea rows={3} maxLength={900} value={title} onChange={e=>{setTitle(e.target.value);setPage(0)}}/></label>
 {mode==='statement'&&<><label>الجهة المصدرة<input value={issuer} maxLength={160} onChange={e=>setIssuer(e.target.value)}/></label>
 <label>متن البيان الكامل<textarea rows={12} value={body} onChange={e=>{setBody(e.target.value);setPage(0)}} placeholder="الصق البيان بكامل فقراته. سيُقسم إلى صفحات تلقائيًا." /></label></>}
 <label>المقاس<select value={format} onChange={e=>{setFormat(e.target.value as Format);setPage(0)}}>{(Object.keys(sizes) as Format[]).map(k=><option key={k} value={k}>{sizes[k].label}</option>)}</select></label>
 <label>لوحة الألوان<select value={skin} onChange={e=>setSkin(e.target.value as Skin)}><option value="forest">أخضر عميق</option><option value="ink">حبر داكن</option><option value="ivory">عاجي</option></select></label>
 <label>التاريخ<input dir="ltr" value={date} onChange={e=>setDate(e.target.value)} pattern="[0-9]{4}/[0-9]{2}/[0-9]{2}"/></label>
 {error&&<p role="alert" className="admin-feedback">{error}</p>}
 <button type="button" onClick={()=>void exportPages()} disabled={exporting||!!error||!count||!logo}>{exporting?'جارٍ التصدير…':count>1?'تصدير جميع الصفحات PNG':'تصدير PNG'}</button>
 <p className="studio-note">الشعار دائمًا على أرضية فاتحة. في البيان الرسمي يُقسّم المتن تلقائيًا مع بقاء النص كاملًا في المحرر. راجع ترتيب الصفحات قبل النشر.</p>
 </section>
 <section className="studio-preview"><div className="studio-preview-header"><h2>معاينة التصميم</h2><span>{count>0?'صفحة '+(page+1)+' من '+count:'بانتظار النص'}</span></div>
 <canvas ref={canvas} role="img" aria-label="معاينة صفحة صورة الخبر" style={{aspectRatio:sizes[format].w+'/'+sizes[format].h}}/>
 {count>1&&<div className="studio-pager"><button type="button" disabled={page===0} onClick={()=>setPage(v=>v-1)}>السابقة</button><span>{page+1} / {count}</span><button type="button" disabled={page===count-1} onClick={()=>setPage(v=>v+1)}>التالية</button></div>}
 </section></div></main>;
}
