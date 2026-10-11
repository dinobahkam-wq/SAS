'use client';
import {useEffect,useRef,useState} from 'react';

type Format='square'|'portrait'|'landscape';
type Palette='forest'|'ink'|'ivory';
const formats:Record<Format,{width:number;height:number;label:string}>={
 square:{width:1080,height:1080,label:'مربع 1080 × 1080'},
 portrait:{width:1080,height:1350,label:'عمودي 1080 × 1350'},
 landscape:{width:1200,height:675,label:'أفقي 1200 × 675'}
};
const palette:Record<Palette,{bg:string;fg:string;accent:string;muted:string}>={
 forest:{bg:'#092d28',fg:'#fffefa',accent:'#d6ee91',muted:'#c5d9d3'},
 ink:{bg:'#182730',fg:'#ffffff',accent:'#e8b5a8',muted:'#cbd4d8'},
 ivory:{bg:'#faf9f3',fg:'#183833',accent:'#396a53',muted:'#526860'}
};
const categories=['خبر','عاجل','بيان رسمي','تنويه','إعلان'];
function wrapText(ctx:CanvasRenderingContext2D,value:string,maxWidth:number):string[]{
 const paragraphs=value.trim().split(/\n/);
 const lines:string[]=[];
 for(const para of paragraphs){
  if(!para.trim()){lines.push('');continue}
  let current='';
  for(const word of para.split(/\s+/)){
   const next=current?current+' '+word:word;
   if(ctx.measureText(next).width<=maxWidth){current=next;continue}
   if(current)lines.push(current);
   if(ctx.measureText(word).width<=maxWidth){current=word;continue}
   let part='';
   for(const char of Array.from(word)){if(ctx.measureText(part+char).width>maxWidth&&part){lines.push(part);part=char}else part+=char}
   current=part;
  }
  if(current)lines.push(current);
 }
 return lines;
}
async function loadLogo():Promise<HTMLImageElement|null>{
 return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src='/api/studio-logo'});
}
async function draw(canvas:HTMLCanvasElement,values:{headline:string;category:string;format:Format;style:Palette;date:string;logo:HTMLImageElement|null}):Promise<string|null>{
 const {width:w,height:h}=formats[values.format];canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)return 'تعذر تشغيل الرسم في المتصفح';
 const color=palette[values.style];ctx.fillStyle=color.bg;ctx.fillRect(0,0,w,h);
 ctx.fillStyle=color.accent;ctx.fillRect(w-24,0,24,h);
 ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='top';
 const margin=72;const right=w-margin;const left=margin;
 ctx.fillStyle=color.accent;ctx.font='700 39px "Sas Thmanyah Sans", sans-serif';ctx.fillText(values.category,right,70);
 ctx.strokeStyle=color.accent;ctx.globalAlpha=.4;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,139);ctx.lineTo(right,139);ctx.stroke();ctx.globalAlpha=1;
 let fontSize=values.format==='landscape'?74:86;
 const availableHeight=h-(values.format==='landscape'?295:360);
 let lines:string[]=[];const text=values.headline.trim()||'عنوان الخبر';
 while(fontSize>=38){
  ctx.font='500 '+fontSize+'px "Sas Thmanyah Serif", "Sas Thmanyah Sans", sans-serif';
  lines=wrapText(ctx,text,w-2*margin);
  if(lines.length*fontSize*1.48<=availableHeight)break;
  fontSize-=2;
 }
 if(lines.length*fontSize*1.48>availableHeight)return 'النص طويل جدًا لهذا القالب. اختصره أو اختر قياسًا أطول.';
 ctx.fillStyle=color.fg;ctx.font='500 '+fontSize+'px "Sas Thmanyah Serif", "Sas Thmanyah Sans", sans-serif';
 const lineHeight=fontSize*1.48;let y=values.format==='landscape'?181:Math.max(225,Math.round((h-lines.length*lineHeight)/2)-10);
 for(const line of lines){ctx.fillText(line,right,y);y+=lineHeight}
 const footerY=h-150;
 ctx.strokeStyle=color.accent;ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(left,footerY);ctx.lineTo(right,footerY);ctx.stroke();ctx.globalAlpha=1;
 if(values.logo){const image=values.logo;const maxW=255,maxH=102,ratio=Math.min(maxW/image.width,maxH/image.height);const iw=image.width*ratio,ih=image.height*ratio;ctx.drawImage(image,right-iw,footerY+21,iw,ih)}
 else{ctx.fillStyle=color.fg;ctx.font='700 35px "Sas Thmanyah Sans",sans-serif';ctx.fillText('منصة ساس للإعلام والدراسات',right,footerY+44)}
 ctx.direction='ltr';ctx.textAlign='left';ctx.fillStyle=color.muted;ctx.font='400 27px "Sas Thmanyah Sans",sans-serif';ctx.fillText(values.date,left,footerY+51);
 return null;
}
export default function NewsStudio(){
 const [headline,setHeadline]=useState('');
 const [category,setCategory]=useState('خبر');
 const [format,setFormat]=useState<Format>('portrait');
 const [style,setStyle]=useState<Palette>('forest');
 const [date,setDate]=useState(()=>new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn',{timeZone:'Asia/Aden',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','/'));
 const [error,setError]=useState('');
 const [working,setWorking]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null);
 const logo=useRef<HTMLImageElement|null>(null);
 useEffect(()=>{let mounted=true;loadLogo().then(img=>{if(mounted){logo.current=img;setLogoReady(v=>v+1)}});return()=>{mounted=false}},[]);
 const [logoReady,setLogoReady]=useState(0);
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{void(async()=>{
  if(!canvas.current)return;
  try{await document.fonts.ready;const result=await draw(canvas.current,{headline,category,format,style,date,logo:logo.current});if(active)setError(result??'')}
  catch{if(active)setError('تعذر إنشاء المعاينة')}
 })()},160);return()=>{active=false;clearTimeout(timer)}},[headline,category,format,style,date,logoReady]);
 async function download(){
  if(!canvas.current||!headline.trim())return;
  setWorking(true);try{
   await document.fonts.ready;
   const problem=await draw(canvas.current,{headline,category,format,style,date,logo:logo.current});
   if(problem){setError(problem);return}
   if(!logo.current){setError('لم يُحمّل الشعار الرسمي. أعد المحاولة بعد اتصال الإنترنت.');return}
   const image=canvas.current.toDataURL('image/png');const anchor=document.createElement('a');anchor.href=image;anchor.download='sas-news-'+format+'-'+Date.now()+'.png';anchor.click();
  }catch{setError('تعذر تصدير PNG. تحقق من تحميل الشعار والخطوط.')}finally{setWorking(false)}
 }
 return <main className="knowledge-page studio-page"><div className="knowledge-breadcrumb"><span>مساحة التحرير</span><span>←</span><strong>محرك صور الأخبار</strong></div>
 <header className="knowledge-hero"><span className="eyebrow">استوديو ساس</span><h1>تصميم الخبر</h1><p>صمّم صورة إخبارية باستخدام النص الأصلي، دون إعادة صياغة تلقائية أو نشر خارجي.</p></header>
 <div className="studio-layout"><section className="admin-panel studio-fields"><h2>إعداد الصورة</h2>
 <label>نوع المحتوى<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
 <label>عنوان الخبر<textarea rows={6} maxLength={700} value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="اكتب النص الذي سيظهر في الصورة كما تريد نشره"/></label>
 <small>{headline.length} / 700 حرف</small>
 <label>أبعاد الصورة<select value={format} onChange={e=>setFormat(e.target.value as Format)}>{(Object.keys(formats) as Format[]).map(f=><option key={f} value={f}>{formats[f].label}</option>)}</select></label>
 <label>القالب اللوني<select value={style} onChange={e=>setStyle(e.target.value as Palette)}><option value="forest">أخضر داكن</option><option value="ink">حبر داكن</option><option value="ivory">عاجي فاتح</option></select></label>
 <label>التاريخ الميلادي<input dir="ltr" lang="en" pattern="[0-9]{4}/[0-9]{2}/[0-9]{2}" value={date} onChange={e=>setDate(e.target.value)}/></label>
 {error&&<p role="alert" className="admin-feedback">{error}</p>}
 <button type="button" disabled={working||!headline.trim()||!!error} onClick={()=>void download()}>{working?'جارٍ التصدير…':'تصدير PNG'}</button>
 <p className="studio-note">المعاينة تُرسم محليًا داخل متصفحك. راجع دقة النص والتاريخ والمصادر قبل نشر الصورة.</p>
 </section><section className="studio-preview"><div className="studio-preview-header"><h2>المعاينة</h2><span>{formats[format].width} × {formats[format].height}</span></div><canvas ref={canvas} role="img" aria-label="معاينة صورة الخبر" style={{aspectRatio:formats[format].width+'/'+formats[format].height}}/></section></div>
 </main>
}
