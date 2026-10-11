'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
type Format='square'|'portrait'|'landscape';
type Skin='forest'|'ink'|'ivory'|'navy'|'olive'|'stone'|'rose';
type Mode='news'|'urgent'|'statement';
type Align='right'|'center';
type Weight=300|400|500|700;
type Page={lines:string[]};
type KnowledgePath={dossier:string;issue:string;event:string};
type Entry={slug:string;title_ar:string;summary_ar:string|null;starts_at:string|null};
type Related={slug:string;title:string;kind:'dossiers'|'issues'|'events'};
const sizes:Record<Format,{w:number;h:number;label:string}>={square:{w:1080,h:1080,label:'مربع 1080 × 1080'},portrait:{w:1080,h:1350,label:'عمودي 1080 × 1350'},landscape:{w:1200,h:675,label:'أفقي 1200 × 675'}};
const skins:Record<Skin,{bg:string,fg:string,accent:string,dim:string}>={forest:{bg:'#092d28',fg:'#fffefa',accent:'#d6ee91',dim:'#d3e3dc'},ink:{bg:'#182730',fg:'#ffffff',accent:'#e8b5a8',dim:'#cbd4d8'},ivory:{bg:'#faf9f3',fg:'#183833',accent:'#396a53',dim:'#526860'},navy:{bg:'#142a42',fg:'#fffdf6',accent:'#b7d3ee',dim:'#cdd9e3'},olive:{bg:'#333d27',fg:'#fffefa',accent:'#d8dd9b',dim:'#e2e4d0'},stone:{bg:'#eeeae1',fg:'#29322c',accent:'#758778',dim:'#505d52'},rose:{bg:'#f6e9e4',fg:'#412e33',accent:'#a85b6d',dim:'#775c63'}};
const modes:Record<Mode,string>={news:'خبر',urgent:'عاجل',statement:'بيان رسمي'};
type Config={mode:Mode;format:Format;skin:Skin;title:string;body:string;issuer:string;date:string;logo:HTMLImageElement|null;issuerLogo:HTMLImageElement|null;path:KnowledgePath;bodyWeight:300|400;titleSize:number;showPath:boolean;sourceUrl:string;sourceName:string;showSource:boolean;textSize:number;textWeight:Weight;align:Align;underline:boolean;sideMargin:number;lineSpacing:number;vertical:'top'|'center'|'bottom'};
const serif='"Sas Thmanyah Serif","Sas Thmanyah Sans",sans-serif';
const sans=serif;
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
function plan(cfg:Config,ctx:CanvasRenderingContext2D):{pages:Page[];font:number;lineHeight:number;error:string;top:number;heading:string[];taxonomy:string[]}{
 const {w,h}=sizes[cfg.format];const statement=cfg.mode==='statement';const margin=cfg.sideMargin;const width=w-margin*2;const empty={pages:[] as Page[],font:0,lineHeight:0,error:'',top:0,heading:[] as string[],taxonomy:[] as string[]};
 if(statement&&cfg.format==='landscape')return {...empty,error:'استخدم المقاس المربع أو العمودي للبيان الرسمي'};
 if(!cfg.title.trim()||(statement&&!cfg.body.trim()))return {...empty,error:'أدخل العنوان والنص المطلوب'};
 if(/https?:\/\/|www\./i.test(cfg.title))return {...empty,error:'العنوان يحتوي على رابط إلكتروني. انقل الرابط إلى حقل المصدر، واترك العنوان نصًا خبريًا فقط.'};
 const categories=(cfg.showPath?[cfg.path.dossier,cfg.path.issue,cfg.path.event]:[]).map(x=>x.trim()).filter(Boolean);
 ctx.font='500 27px '+serif;
 const taxonomy=categories.length?toLines(ctx,categories.join(' ← '),width):[];
 if(taxonomy.length>3)return {...empty,error:'مسار التصنيف طويل؛ اختصر التسميات إلى ثلاثة أسطر كحد أقصى'};
 const taxBottom=taxonomy.length?163+taxonomy.length*40+28:156;
 ctx.font='700 '+cfg.titleSize+'px '+serif;
 const heading=statement?toLines(ctx,cfg.title,width):[];
 if(heading.length>2)return {...empty,error:'عنوان البيان أطول من سطرين؛ اختصر العنوان فقط'};
 const issuerArea=statement?(cfg.issuerLogo?185:55):0;
 const headerStart=statement?(cfg.issuerLogo?taxBottom+170:taxBottom+14):taxBottom;
 const titleBottom=headerStart+heading.length*(cfg.titleSize*1.32);
 const top=statement?titleBottom+issuerArea+(cfg.issuerLogo?0:25):Math.max(205,taxBottom+35);
 const bottom=h-176;
 let font=cfg.textSize;
 let lineHeight=font*cfg.lineSpacing;
 if(bottom-top<lineHeight*2)return {...empty,error:'المساحة لا تكفي للنص والتصنيف؛ اختر مقاسًا أطول أو اختصر مسار التصنيف'};
 if(statement){
   ctx.font=cfg.bodyWeight+' '+font+'px '+serif;
   const lines=toLines(ctx,cfg.body.trim(),width);
   const capacity=Math.floor((bottom-top)/lineHeight);
   if(capacity<2)return {...empty,error:'المساحة المتاحة للبيان غير كافية'};
   const pages:Page[]=[];
   for(let i=0;i<lines.length;i+=capacity)pages.push({lines:lines.slice(i,i+capacity)});
   return {pages,font,lineHeight,error:'',top,heading,taxonomy};
 }
 let lines:string[]=[];
 while(font>=38){
   ctx.font=cfg.textWeight+' '+font+'px '+serif;lines=toLines(ctx,cfg.title.trim(),width);lineHeight=font*cfg.lineSpacing;
   if(lines.length*lineHeight<=bottom-top)break;
   font-=2;
 }
 if(lines.length*lineHeight>bottom-top)return {...empty,error:'العنوان طويل جدًا؛ اختصره أو استخدم قالب البيان'};
 return {pages:[{lines}],font,lineHeight,error:'',top,heading,taxonomy};
}
function sourceLabel(raw:string):string{
 if(!raw.trim())return '';
 try{
  const parsed=new URL(raw.trim());
  if(!['https:','http:'].includes(parsed.protocol))return '';
  return parsed.hostname.replace(/^www\./,'')+parsed.pathname.replace(/\/$/,'');
 }catch{return ''}
}
function ellipsis(ctx:CanvasRenderingContext2D,value:string,maxWidth:number):string{
 if(ctx.measureText(value).width<=maxWidth)return value;
 const characters=Array.from(value);let low=0,high=characters.length;
 while(low<high){const middle=Math.ceil((low+high)/2);if(ctx.measureText(characters.slice(0,middle).join('')+'…').width<=maxWidth)low=middle;else high=middle-1}
 return characters.slice(0,low).join('')+'…';
}
function drawText(ctx:CanvasRenderingContext2D,line:string,x:number,y:number,underlined:boolean){
 ctx.fillText(line,x,y);
 if(underlined&&line){const width=ctx.measureText(line).width;const from=ctx.textAlign==='center'?x-width/2:x-width;ctx.beginPath();ctx.moveTo(from,y+Number.parseInt(ctx.font.match(/(\d+)px/)?.[1]??'40',10)*1.09);ctx.lineTo(from+width,y+Number.parseInt(ctx.font.match(/(\d+)px/)?.[1]??'40',10)*1.09);ctx.lineWidth=2;ctx.strokeStyle=ctx.fillStyle as string;ctx.stroke()}
}
function draw(canvas:HTMLCanvasElement,cfg:Config,index:number):{total:number;error:string}{
 const {w,h}=sizes[cfg.format];canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)return {total:0,error:'تعذر فتح محرك الرسم'};
 const {pages,font,lineHeight,error,top,heading,taxonomy}=plan(cfg,ctx);
 const margin=cfg.sideMargin;
 if(error)return {total:0,error};
 const p=pages[Math.min(index,pages.length-1)];const c=skins[cfg.skin];
 ctx.fillStyle=c.bg;ctx.fillRect(0,0,w,h);
 // A restrained editorial accent, not a wide decorative stripe.
 ctx.fillStyle=c.accent;ctx.fillRect(w-12,0,12,h);
 ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='top';
 ctx.fillStyle=c.accent;ctx.font='700 34px '+sans;
 ctx.fillText(modes[cfg.mode],w-margin,63);
 ctx.strokeStyle=c.accent;ctx.globalAlpha=.52;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(margin,137);ctx.lineTo(w-margin,137);ctx.stroke();ctx.globalAlpha=1;
 let yy=163;
 if(taxonomy.length){
  ctx.fillStyle=c.dim;ctx.font='500 27px '+serif;
  for(const line of taxonomy){ctx.fillText(line,w-margin,yy);yy+=40}
 }
 if(cfg.mode==='statement'){
  const taxEnd=taxonomy.length?yy+28:156;
  if(cfg.issuerLogo){
   const bw=176,bh=151,bx=(w-bw)/2,by=taxEnd+5;
   ctx.fillStyle='#faf9f3';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,15);ctx.fill();
   const factor=Math.min((bw-25)/cfg.issuerLogo.width,(bh-25)/cfg.issuerLogo.height);
   const iw=cfg.issuerLogo.width*factor,ih=cfg.issuerLogo.height*factor;
   ctx.drawImage(cfg.issuerLogo,bx+(bw-iw)/2,by+(bh-ih)/2,iw,ih);
  }
  const headY=cfg.issuerLogo?taxEnd+180:taxEnd+18;
  ctx.fillStyle=c.fg;ctx.font='700 '+cfg.titleSize+'px '+serif;
  heading.forEach((line,j)=>ctx.fillText(line,w-margin,headY+j*cfg.titleSize*1.32));
  const issuerY=headY+heading.length*cfg.titleSize*1.32+14;
  ctx.fillStyle=c.dim;ctx.font='500 27px '+serif;
  const issuerLines=toLines(ctx,cfg.issuer||'الجهة المصدرة غير محددة',w-margin*2);
  if(issuerLines.length>2)return {total:pages.length,error:'اسم الجهة طويل؛ اختصر الاسم'};
  issuerLines.forEach((line,j)=>ctx.fillText(line,w-margin,issuerY+j*38));
  ctx.fillStyle=c.fg;ctx.font=cfg.bodyWeight+' '+font+'px '+serif;ctx.textAlign=cfg.align;
  const x=cfg.align==='center'?w/2:w-margin;
  p.lines.forEach((line,j)=>{if(line)drawText(ctx,line,x,top+j*lineHeight,cfg.underline)});ctx.textAlign='right';
 }else{
  ctx.fillStyle=c.fg;ctx.font=cfg.textWeight+' '+font+'px '+serif;ctx.textAlign=cfg.align;
  const maxY=h-176-p.lines.length*lineHeight;
  const y=cfg.vertical==='top'?top:cfg.vertical==='bottom'?maxY:Math.max(top,Math.floor((top+maxY)/2));
  const x=cfg.align==='center'?w/2:w-margin;
  p.lines.forEach((line,j)=>drawText(ctx,line,x,y+j*lineHeight,cfg.underline));ctx.textAlign='right';
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
 ctx.fillStyle=c.dim;ctx.font='400 25px '+sans;ctx.direction='ltr';ctx.textAlign='left';
 ctx.fillText(cfg.date,72,foot+92);
 if(cfg.mode==='statement')ctx.fillText(String(index+1)+' / '+String(pages.length),72,foot+120);
 const name=cfg.sourceName.trim()||sourceLabel(cfg.sourceUrl);
 if(cfg.showSource&&name){
  ctx.textAlign='right';ctx.direction='rtl';ctx.font='500 25px '+serif;
  const available=badgeX-72-32;
  ctx.fillText(ellipsis(ctx,'المصدر: '+name,available),badgeX-30,foot+27);
 }
 return {total:pages.length,error:''};
}
async function getLogo():Promise<HTMLImageElement|null>{
 return await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src='/api/studio-logo'});
}
export default function Studio(){
 const [mode,setMode]=useState<Mode>('news');
 const [format,setFormat]=useState<Format>('portrait');
 const [skin,setSkin]=useState<Skin>('forest');
 const [bodyWeight,setBodyWeight]=useState<300|400>(300);
 const [titleSize,setTitleSize]=useState(60);
 const [showPath,setShowPath]=useState(true);
 const [directory,setDirectory]=useState<Record<'dossiers'|'issues'|'events',Entry[]>>({dossiers:[],issues:[],events:[]});
 const [relations,setRelations]=useState<Related[]>([]);
 const [directoryError,setDirectoryError]=useState('');
 const [title,setTitle]=useState('');
 const [sourceUrl,setSourceUrl]=useState('');
 const [sourceName,setSourceName]=useState('');
 const [showSource,setShowSource]=useState(true);
 const [textSize,setTextSize]=useState(78);
 const [textWeight,setTextWeight]=useState<Weight>(700);
 const [align,setAlign]=useState<Align>('right');
 const [underline,setUnderline]=useState(false);
 const [sideMargin,setSideMargin]=useState(76);
 const [lineSpacing,setLineSpacing]=useState(1.45);
 const [vertical,setVertical]=useState<'top'|'center'|'bottom'>('center');
 const [body,setBody]=useState('');
 const [issuer,setIssuer]=useState('');
 const [issuerLogo,setIssuerLogo]=useState<HTMLImageElement|null>(null);
 const [issuerLogoError,setIssuerLogoError]=useState('');
 const [path,setPath]=useState<KnowledgePath>({dossier:'',issue:'',event:''});
 const [date,setDate]=useState(()=>{const p=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:'Asia/Aden',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(type:string)=>p.find(x=>x.type===type)?.value??'';return get('year')+'/'+get('month')+'/'+get('day')});
 const [page,setPage]=useState(0);const [count,setCount]=useState(0);
 const [error,setError]=useState('');const [logo,setLogo]=useState<HTMLImageElement|null>(null);
 const [exporting,setExporting]=useState(false);const canvas=useRef<HTMLCanvasElement>(null);
 const cfg=useMemo(()=>({mode,format,skin,title,body,issuer,date,logo,issuerLogo,path,bodyWeight,titleSize,showPath,sourceUrl,sourceName,showSource,textSize,textWeight,align,underline,sideMargin,lineSpacing,vertical}),[mode,format,skin,title,body,issuer,date,logo,issuerLogo,path,bodyWeight,titleSize,showPath,sourceUrl,sourceName,showSource,textSize,textWeight,align,underline,sideMargin,lineSpacing,vertical]);
 useEffect(()=>{let live=true;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key){setDirectoryError('لم يكتمل اتصال Supabase');return}
 const rpc=async<T,>(name:string,args:object):Promise<T>=>{const response=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args)});if(!response.ok)throw new Error('تعذر تحميل التصنيفات');return await response.json() as T};
 void Promise.all((['dossiers','issues','events'] as const).map(async kind=>[kind,await rpc<Entry[]>('sas_public_directory',{p_kind:kind})] as const)).then(items=>{if(live)setDirectory(Object.fromEntries(items) as Record<'dossiers'|'issues'|'events',Entry[]>)}).catch(()=>{if(live)setDirectoryError('تعذر تحميل قوائم ساس')});
 return()=>{live=false}},[]);
 useEffect(()=>{let live=true;const kind=path.issue?'issues':path.dossier?'dossiers':null;const name=path.issue?directory.issues.find(x=>x.title_ar===path.issue):directory.dossiers.find(x=>x.title_ar===path.dossier);const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!kind||!name||!url||!key){setRelations([]);return}
 void fetch(url+'/rest/v1/rpc/sas_public_related',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_kind:kind,p_slug:name.slug})}).then(async r=>{if(!r.ok)throw new Error();return await r.json() as Related[]}).then(x=>{if(live)setRelations(x)}).catch(()=>{if(live)setDirectoryError('تعذر تحميل العلاقات')});return()=>{live=false}
 },[path.dossier,path.issue,directory]);
 useEffect(()=>{let live=true;void getLogo().then(img=>{if(live)setLogo(img)});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;const id=setTimeout(()=>{void (async()=>{
  if(!canvas.current)return;
  try{await Promise.all([document.fonts.load('300 43px '+serif),document.fonts.load('500 51px '+serif),document.fonts.load('400 43px '+serif),document.fonts.load('700 86px '+serif)]);
   if(!live)return;const result=draw(canvas.current,cfg,page);
   if(live){setError(result.error);setCount(result.total);if(page>=result.total&&result.total>0)setPage(result.total-1)}
  }catch{if(live)setError('فشل تحميل الخطوط أو الرسم')}
 })()},120);return()=>{live=false;clearTimeout(id)}},[cfg,page]);
 async function setIssuerImage(file:File|undefined){
  if(!file){setIssuerLogo(null);setIssuerLogoError('');return}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){setIssuerLogoError('يجب رفع صورة PNG أو JPEG أو WebP بحجم لا يتجاوز 5MB');return}
  const url=URL.createObjectURL(file);
  try{
   const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('invalid image'));img.src=url});
   setIssuerLogo(image);setIssuerLogoError('');setPage(0);
  }catch{setIssuerLogoError('تعذر قراءة الصورة المختارة')}
  finally{URL.revokeObjectURL(url)}
 }
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
 <label>نوع التصميم<select value={mode} onChange={e=>{const next=e.target.value as Mode;setMode(next);setTextSize(next==='statement'?43:78);setSideMargin(next==='statement'?120:76);setLineSpacing(next==='statement'?1.65:1.45);setPage(0)}}>{(Object.keys(modes) as Mode[]).map(k=><option key={k} value={k}>{modes[k]}</option>)}</select></label>
 <label>{mode==='statement'?'عنوان البيان (حتى 120 حرفًا)':'نص الخبر'}<textarea rows={3} maxLength={mode==='statement'?120:900} value={title} onChange={e=>{setTitle(e.target.value);setPage(0)}}/></label>
 <label>اسم المصدر (اختياري)<input value={sourceName} maxLength={120} placeholder="وكيل حضرموت الإخباري" onChange={e=>setSourceName(e.target.value)}/></label>
 <label>رابط المصدر (اختياري)<input dir="ltr" type="url" placeholder="https://..." value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}/></label>
 {(sourceUrl||sourceName)&&<p className="studio-note">سيظهر اسم المصدر أعلى تاريخ البطاقة في منطقة مستقلة. يُستخرج الاسم من الرابط إذا تركت حقل الاسم فارغًا.</p>}
 {mode==='statement'&&<><label>الجهة المصدرة<input value={issuer} maxLength={160} onChange={e=>setIssuer(e.target.value)}/></label>
 <label>شعار الجهة (اختياري · PNG/JPEG/WebP · 5MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void setIssuerImage(e.target.files?.[0])}/></label>
 {issuerLogo&&<button type="button" onClick={()=>{setIssuerLogo(null);setIssuerLogoError('')}}>حذف شعار الجهة</button>}
 {issuerLogoError&&<p role="alert" className="admin-feedback">{issuerLogoError}</p>}
 <label>متن البيان الكامل<textarea rows={12} value={body} onChange={e=>{setBody(e.target.value);setPage(0)}} placeholder="الصق البيان بكامل فقراته. سيُقسم إلى صفحات تلقائيًا." /></label></>}
 <fieldset className="studio-taxonomy"><legend>مسار التصنيف من قاعدة ساس (اختياري)</legend>
 {directoryError&&<p role="alert">{directoryError}</p>}
 <label>الملف<select value={path.dossier} onChange={e=>{setPath({dossier:e.target.value,issue:'',event:''});setPage(0)}}><option value="">دون ملف</option>{directory.dossiers.map(x=><option key={x.slug} value={x.title_ar}>{x.title_ar}</option>)}</select></label>
 <label>القضية<select value={path.issue} onChange={e=>{setPath(p=>({...p,issue:e.target.value,event:''}));setPage(0)}}><option value="">دون قضية</option>{(path.dossier?relations.filter(x=>x.kind==='issues').map(x=>({slug:x.slug,title_ar:x.title})):directory.issues).map(x=><option key={x.slug} value={x.title_ar}>{x.title_ar}</option>)}</select></label>
 <label>الحدث<select value={path.event} onChange={e=>{setPath(p=>({...p,event:e.target.value}));setPage(0)}}><option value="">دون حدث</option>{(path.issue?relations.filter(x=>x.kind==='events').map(x=>({slug:x.slug,title_ar:x.title})):directory.events).map(x=><option key={x.slug} value={x.title_ar}>{x.title_ar}</option>)}</select></label></fieldset>
 <label>المقاس<select value={format} onChange={e=>{setFormat(e.target.value as Format);setPage(0)}}>{(Object.keys(sizes) as Format[]).map(k=><option key={k} value={k}>{sizes[k].label}</option>)}</select></label>
 <label>لوحة الألوان<select value={skin} onChange={e=>setSkin(e.target.value as Skin)}><option value="forest">أخضر عميق</option><option value="ink">حبر داكن</option><option value="ivory">عاجي</option><option value="navy">كحلي مؤسسي</option><option value="olive">زيتوني</option><option value="stone">رمادي دافئ</option><option value="rose">وردي ترابي</option></select></label>
 <fieldset className="studio-options"><legend>تخصيصات التصميم</legend><label><input type="checkbox" checked={showPath} onChange={e=>setShowPath(e.target.checked)}/> إظهار مسار التصنيف</label>{mode==='statement'&&<><label>وزن متن البيان<select value={bodyWeight} onChange={e=>setBodyWeight(Number(e.target.value) as 300|400)}><option value={300}>Light — خفيف</option><option value={400}>Regular — عادي</option></select></label><label>حجم عنوان البيان: {titleSize}px<input type="range" min={52} max={74} step={2} value={titleSize} onChange={e=>setTitleSize(Number(e.target.value))}/></label></>}</fieldset>
 <fieldset className="studio-options"><legend>تنسيق النص والإطار غير المرئي</legend>
 <label>حجم النص الرئيسي: {textSize} بكسل<input type="range" min={32} max={104} step={2} value={textSize} onChange={e=>setTextSize(Number(e.target.value))}/></label>
 <label>سماكة نص الخبر<select value={textWeight} onChange={e=>setTextWeight(Number(e.target.value) as Weight)}><option value={300}>خفيف</option><option value={400}>عادي</option><option value={500}>متوسط</option><option value={700}>عريض</option></select></label>
 <label>المحاذاة<select value={align} onChange={e=>setAlign(e.target.value as Align)}><option value="right">يمين</option><option value="center">توسيط</option></select></label>
 <label>موضع النص<select value={vertical} onChange={e=>setVertical(e.target.value as 'top'|'center'|'bottom')}><option value="top">أعلى الإطار</option><option value="center">وسط الإطار</option><option value="bottom">أسفل الإطار</option></select></label>
 <label>الهامش الجانبي: {sideMargin} بكسل<input type="range" min={64} max={185} step={1} value={sideMargin} onChange={e=>setSideMargin(Number(e.target.value))}/></label>
 <label>ارتفاع السطر: {lineSpacing.toFixed(2)}<input type="range" min={1.2} max={1.95} step={0.05} value={lineSpacing} onChange={e=>setLineSpacing(Number(e.target.value))}/></label>
 <label><input type="checkbox" checked={underline} onChange={e=>setUnderline(e.target.checked)}/> تسطير النص الرئيسي</label>
 <label><input type="checkbox" checked={showSource} onChange={e=>setShowSource(e.target.checked)}/> إظهار اسم المصدر</label>
 <small>تكييف النص داخل الإطار بالالتفاف والتصغير عند الحاجة. الكشيدة والضبط الكامل يحتاجان خوارزمية تشكيل عربية مستقلة، ولذلك لم يُفعّلا بعد.</small>
 </fieldset>
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
