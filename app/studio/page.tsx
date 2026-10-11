'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
type Format='square'|'portrait'|'landscape'|'wide'|'story'|'custom';
type Skin='forest'|'ink'|'ivory'|'navy'|'olive'|'stone'|'rose';
type Mode='news'|'urgent'|'statement'|'quote';
type Align='right'|'center';
type Weight=300|400|500|700;
type PhotoPosition='left'|'right'|'top'|'background';
type PhotoFit='cover'|'contain';
type PhotoShape='square'|'rounded'|'circle'|'oval'|'hexagon'|'angled'|'mixed'|'fade';
type SourcePlacement='before-summary'|'after-summary';
type PhotoCreditPlacement='inside'|'below';
type HeadlineRow={text:string;left:number;right:number;y:number};
type PhotoRect={x:number;y:number;w:number;h:number};
type NewsGeometry={rows:HeadlineRow[];photo:PhotoRect|null;summaryLines:string[];summaryY:number;summaryRight:number;summaryFont:number;summaryLineHeight:number;source:string;sourceY:number|null;sourceRight:number;creditBelowY:number|null};
type Page={lines:string[];news?:NewsGeometry};
type KnowledgePath={dossier:string;issue:string;event:string};
type Entry={slug:string;title_ar:string;summary_ar:string|null;starts_at:string|null};
type Related={slug:string;title:string;kind:'dossiers'|'issues'|'events'};
const sizes:Record<Format,{w:number;h:number;label:string}>={square:{w:1080,h:1080,label:'مربع 1080 × 1080'},portrait:{w:1080,h:1350,label:'عمودي 1080 × 1350'},landscape:{w:1200,h:675,label:'أفقي 1200 × 675'},wide:{w:1600,h:900,label:'عريض 1600 × 900'},story:{w:1080,h:1920,label:'ستوري 1080 × 1920'},custom:{w:1080,h:1350,label:'مقاس مخصص'}};
const skins:Record<Skin,{bg:string,fg:string,accent:string,dim:string}>={forest:{bg:'#092d28',fg:'#fffefa',accent:'#d6ee91',dim:'#d3e3dc'},ink:{bg:'#182730',fg:'#ffffff',accent:'#e8b5a8',dim:'#cbd4d8'},ivory:{bg:'#faf9f3',fg:'#183833',accent:'#396a53',dim:'#526860'},navy:{bg:'#142a42',fg:'#fffdf6',accent:'#b7d3ee',dim:'#cdd9e3'},olive:{bg:'#333d27',fg:'#fffefa',accent:'#d8dd9b',dim:'#e2e4d0'},stone:{bg:'#eeeae1',fg:'#29322c',accent:'#758778',dim:'#505d52'},rose:{bg:'#f6e9e4',fg:'#412e33',accent:'#a85b6d',dim:'#775c63'}};
const modes:Record<Mode,string>={news:'خبر',urgent:'عاجل',statement:'بيان رسمي',quote:'تصريح / اقتباس'};
type Config={mode:Mode;format:Format;customWidth:number;customHeight:number;topPadding:number;bottomPadding:number;detailSpacing:number;summaryLineSpacing:number;skin:Skin;title:string;body:string;issuer:string;date:string;logo:HTMLImageElement|null;issuerLogo:HTMLImageElement|null;path:KnowledgePath;bodyWeight:300|400;titleSize:number;showPath:boolean;sourceUrl:string;sourceName:string;showSource:boolean;textSize:number;textWeight:Weight;align:Align;underline:boolean;sideMargin:number;lineSpacing:number;vertical:'top'|'center'|'bottom';summary:string;location:string;showLocation:boolean;quoteName:string;quoteRole:string;personImage:HTMLImageElement|null;mapImage:HTMLImageElement|null;newsImage:HTMLImageElement|null;photoPosition:PhotoPosition;photoFit:PhotoFit;photoScale:number;photoOpacity:number;photoRounded:boolean;titleScale:number;hidePathOnBackground:boolean;showWeekday:boolean;sourcePlacement:SourcePlacement;sourcePrefix:string;headlineDX:number;headlineDY:number;headlineInset:number;summaryDX:number;summaryDY:number;summaryInset:number;summarySize:number;sourceDX:number;sourceDY:number;imageDX:number;imageDY:number;imageInset:number;imageShape:PhotoShape;imageRadius:number;imageBorder:number;imageCredit:string;showImageCredit:boolean;imageCreditPlacement:PhotoCreditPlacement;wrapHeadline:boolean};
function dimensions(cfg:Config){return cfg.format==='custom'?{w:cfg.customWidth,h:cfg.customHeight}:sizes[cfg.format]}
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
 const {w,h}=dimensions(cfg);const statement=cfg.mode==='statement';const margin=cfg.sideMargin;const width=w-margin*2;const empty={pages:[] as Page[],font:0,lineHeight:0,error:'',top:0,heading:[] as string[],taxonomy:[] as string[]};
 if(w<600||h<600||w>2400||h>3000)return {...empty,error:'الأبعاد المطلوبة خارج النطاق المسموح (600–2400 عرضًا، 600–3000 ارتفاعًا)'};
 if(!cfg.title.trim()||(statement&&!cfg.body.trim()))return {...empty,error:'أدخل العنوان والنص المطلوب'};
 if(/https?:\/\/|www\./i.test(cfg.title))return {...empty,error:'العنوان يحتوي على رابط إلكتروني. انقل الرابط إلى حقل المصدر، واترك العنوان نصًا خبريًا فقط.'};
 const showClassification=cfg.showPath&&!(cfg.newsImage&&cfg.photoPosition==='background'&&cfg.hidePathOnBackground&&(cfg.mode==='news'||cfg.mode==='urgent'));
 const categories=(showClassification?[cfg.path.dossier,cfg.path.issue,cfg.path.event]:[]).map(x=>x.trim()).filter(Boolean);
 ctx.font='500 27px '+serif;
 const taxonomy=categories.length?toLines(ctx,categories.join(' ← '),width):[];
 if(taxonomy.length>3)return {...empty,error:'مسار التصنيف طويل؛ اختصر التسميات إلى ثلاثة أسطر كحد أقصى'};
 const taxBottom=taxonomy.length?cfg.topPadding+100+taxonomy.length*40+28:cfg.topPadding+93;
 ctx.font='700 '+cfg.titleSize+'px '+serif;
 const heading=statement?toLines(ctx,cfg.title,width):[];
 if(heading.length>2)return {...empty,error:'عنوان البيان أطول من سطرين؛ اختصر العنوان فقط'};
 const issuerArea=statement?(cfg.issuerLogo?185:55):0;
 const headerStart=statement?(cfg.issuerLogo?taxBottom+170:taxBottom+14):taxBottom;
 const titleBottom=headerStart+heading.length*(cfg.titleSize*1.32);
 const top=statement?titleBottom+issuerArea+(cfg.issuerLogo?0:25):Math.max(cfg.topPadding+140,taxBottom+35);
 const footerTop=h-cfg.bottomPadding-150;
 const bottom=statement?footerTop-(sourceText(cfg)?85:20):cfg.mode==='quote'?footerTop-(sourceText(cfg)?85:45):footerTop-45;
 let font=cfg.textSize;
 let lineHeight=font*cfg.lineSpacing;
 if(bottom-top<36)return {...empty,error:'المساحة المتاحة ضيقة؛ خفف الهوامش أو اختر ارتفاعًا أكبر'};
 if(statement){
   ctx.font=cfg.bodyWeight+' '+font+'px '+serif;
   const lines=toLines(ctx,cfg.body.trim(),width);
   const capacity=Math.floor((bottom-top)/lineHeight);
   if(capacity<2)return {...empty,error:'المساحة المتاحة للبيان غير كافية'};
   const pages:Page[]=[];
   for(let i=0;i<lines.length;i+=capacity)pages.push({lines:lines.slice(i,i+capacity)});
   return {pages,font,lineHeight,error:'',top,heading,taxonomy};
 }
 if(cfg.mode==='quote'){
  const qwidth=cfg.personImage?Math.floor(width*.58):width;
  font=Math.min(font,57);ctx.font=cfg.textWeight+' '+font+'px '+serif;
  let lines=toLines(ctx,cfg.title.trim(),qwidth);lineHeight=font*cfg.lineSpacing;
  while(font>30&&lines.length*lineHeight>bottom-top-90){font-=2;ctx.font=cfg.textWeight+' '+font+'px '+serif;lines=toLines(ctx,cfg.title.trim(),qwidth);lineHeight=font*cfg.lineSpacing}
  if(lines.length*lineHeight>bottom-top-90)return {...empty,error:'الاقتباس طويل جدًا؛ اختصره ليناسب البطاقة'};
  return {pages:[{lines}],font,lineHeight,error:'',top,heading,taxonomy};
 }
 // One geometry is shared between rendering and export; never silently discard text.
 let layout:NewsGeometry|null=null;
 font=Math.min(font,Math.round(((cfg.newsImage&&(cfg.photoPosition==='left'||cfg.photoPosition==='right'))?Math.max(32,w*.046):cfg.newsImage&&cfg.photoPosition==='background'?Math.max(36,w*.057):Math.max(42,w*.065))*cfg.titleScale/100));
 while(font>=26){
  ctx.font=cfg.textWeight+' '+font+'px '+serif;lineHeight=font*cfg.lineSpacing;
  layout=newsGeometry(cfg,ctx,top,bottom,font);
  if(layout)break;font-=2;
 }
 if(!layout)return {...empty,error:'عناصر البطاقة لا تتسع للمقاس الحالي. زد الارتفاع أو خفّف حجم الصورة والنص والهوامش.'};
 return {pages:[{lines:layout.rows.map(row=>row.text),news:layout}],font,lineHeight,error:'',top,heading,taxonomy};
}
function photoBox(cfg:Config,w:number,h:number,margin:number){
 if(!cfg.newsImage)return null;
 const width=w-2*margin;
 const scale=cfg.photoScale/100;
 if(cfg.photoPosition==='background')return {x:margin+cfg.imageInset,y:cfg.topPadding+105,w:width-2*cfg.imageInset,h:Math.max(100,h-cfg.topPadding-cfg.bottomPadding-310)};
 if(cfg.photoPosition==='top')return {x:margin+cfg.imageInset,y:0,w:width-2*cfg.imageInset,h:Math.max(115,Math.min(280,Math.round(h*.22*scale)))};
 const photoW=Math.round(Math.min(width*.46,width*.38*scale));
 return {x:cfg.photoPosition==='left'?margin:w-margin-photoW,y:0,w:photoW,h:Math.max(110,Math.min(470,Math.round(h*.36*scale)))};
}
function photoPath(ctx:CanvasRenderingContext2D,box:PhotoRect,shape:PhotoShape,radius:number){
 const {x,y,w,h}=box;ctx.beginPath();
 if(shape==='circle'){const r=Math.min(w,h)/2;ctx.arc(x+w/2,y+h/2,r,0,Math.PI*2)}
 else if(shape==='oval'){ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2)}
 else if(shape==='hexagon'){
  ctx.moveTo(x+w*.25,y);ctx.lineTo(x+w*.75,y);ctx.lineTo(x+w,y+h*.5);
  ctx.lineTo(x+w*.75,y+h);ctx.lineTo(x+w*.25,y+h);ctx.lineTo(x,y+h*.5);ctx.closePath();
 }else if(shape==='angled'){
  ctx.moveTo(x+w*.12,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w*.9,y+h);
  ctx.lineTo(x,y+h);ctx.lineTo(x,y+h*.16);ctx.closePath();
 }else if(shape==='mixed')ctx.roundRect(x,y,w,h,[Math.min(radius,Math.min(w,h)/2),0,Math.min(radius,Math.min(w,h)/2),0]);
 else ctx.roundRect(x,y,w,h,shape==='square'?0:radius);
}
function paintPhoto(ctx:CanvasRenderingContext2D,img:HTMLImageElement,box:PhotoRect,fit:PhotoFit,rounded:boolean,opacity:number,shape:PhotoShape='rounded',radius=18,border=0,color='#fff'){
 const {x,y,w,h}=box;if(w<=0||h<=0)return;
 const actualShape=shape==='rounded'&&!rounded?'square':shape;
 ctx.save();ctx.globalAlpha=opacity;
 if(actualShape!=='fade'){photoPath(ctx,box,actualShape,radius);ctx.clip()}
 ctx.fillStyle='#faf9f3';if(actualShape!=='fade')ctx.fillRect(x,y,w,h);
 const factor=fit==='cover'?Math.max(w/img.width,h/img.height):Math.min(w/img.width,h/img.height);
 const iw=img.width*factor,ih=img.height*factor;
 if(actualShape==='fade'){
  const layer=document.createElement('canvas');layer.width=Math.ceil(w);layer.height=Math.ceil(h);
  const p=layer.getContext('2d');
  if(p){p.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih);p.globalCompositeOperation='destination-in';
   const gradient=p.createRadialGradient(w/2,h/2,Math.min(w,h)*.15,w/2,h/2,Math.max(w,h)*.68);
   gradient.addColorStop(0,'rgba(0,0,0,1)');gradient.addColorStop(.70,'rgba(0,0,0,1)');gradient.addColorStop(1,'rgba(0,0,0,0)');
   p.fillStyle=gradient;p.fillRect(0,0,w,h);ctx.drawImage(layer,x,y)}
 }else ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
 ctx.restore();
 if(border>0&&actualShape!=='fade'){ctx.save();photoPath(ctx,box,actualShape,radius);ctx.strokeStyle=color;ctx.lineWidth=border;ctx.stroke();ctx.restore()}
}
function photoCredit(ctx:CanvasRenderingContext2D,cfg:Config,photo:PhotoRect,belowY:number|null,dim:string){
 if(!cfg.showImageCredit||!cfg.imageCredit.trim())return;
 ctx.save();ctx.direction='rtl';ctx.font='400 19px '+serif;ctx.textBaseline='top';
 const value=ellipsis(ctx,'الصورة: '+cfg.imageCredit.trim(),Math.max(60,photo.w-24));
 if(belowY!==null){ctx.fillStyle=dim;ctx.textAlign='right';ctx.fillText(value,photo.x+photo.w,belowY)}
 else{
  const width=Math.min(photo.w-12,ctx.measureText(value).width+20);
  ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(photo.x+photo.w-width-6,photo.y+photo.h-31,width,26);
  ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(value,photo.x+photo.w-15,photo.y+photo.h-29)
 }
 ctx.restore()
}

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function sourceText(cfg:Config){
 const value=cfg.sourceName.trim()||sourceLabel(cfg.sourceUrl);
 return cfg.showSource&&value?cfg.sourcePrefix+' '+value:'';
}
function calendarDate(value:string,showWeekday:boolean){
 const match=new RegExp('^([0-9]{4})/([0-9]{2})/([0-9]{2})$').exec(value.trim());
 if(!match)return value;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const d=new Date(Date.UTC(year,month-1,day));
 if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return value;
 return showWeekday?['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getUTCDay()]+'  '+value:value;
}
function newsGeometry(cfg:Config,ctx:CanvasRenderingContext2D,top:number,bottom:number,font:number):NewsGeometry|null{
 const {w,h}=dimensions(cfg),margin=cfg.sideMargin,fullWidth=w-2*margin;
 const hasPhoto=Boolean(cfg.newsImage),background=hasPhoto&&cfg.photoPosition==='background';
 const side=hasPhoto&&(cfg.photoPosition==='left'||cfg.photoPosition==='right');
 const topPhoto=hasPhoto&&cfg.photoPosition==='top';
 const frame=hasPhoto?photoBox(cfg,w,h,margin):null;
 const creditBelow=Boolean(hasPhoto&&cfg.showImageCredit&&cfg.imageCredit.trim()&&cfg.imageCreditPlacement==='below'&&!background);
 const creditH=creditBelow?31:0;
 const pad=(background||topPhoto)?0:cfg.imageInset;
 const photoW=frame&&!background?Math.min(frame.w,fullWidth-pad*2):0;
 const photoH=frame&&!background?frame.h:0;
 const gap=36;
 const photoX=frame?clamp(frame.x+cfg.imageDX,margin+pad,w-margin-pad-frame.w):0;
 const photoY=cfg.imageDY;
 const titleFont=font,lh=titleFont*cfg.lineSpacing;
 const dy=cfg.headlineDY+(topPhoto?photoH+cfg.detailSpacing:0);
 const words=cfg.title.trim().match(/\S+/g)??[];
 const rows:HeadlineRow[]=[];
 const spare=Math.abs(cfg.headlineDX)+cfg.headlineInset;
 const baseLeft=margin+spare,baseRight=w-margin-spare;
 const photoRight=cfg.photoPosition==='right';
 for(let index=0;words.length&&index<90;index++){
  const lineY=dy+index*lh;
  const intersects=side&&Boolean(frame)&&(
   !cfg.wrapHeadline || (lineY<photoY+photoH+creditH+16&&lineY+lh>photoY-16)
  );
  let left=baseLeft,right=baseRight;
  if(intersects){if(photoRight)right=Math.min(right,photoX-gap);else left=Math.max(left,photoX+photoW+gap)}
  const maxWidth=right-left;
  if(maxWidth<95)return null;
  let line='';
  while(words.length){
   const word=words[0],candidate=line?line+' '+word:word;
   if(ctx.measureText(candidate).width<=maxWidth){line=candidate;words.shift();continue}
   if(line)break;
   const chars=Array.from(word);let used=0,chunk='';
   for(const ch of chars){if(ctx.measureText(chunk+ch).width>maxWidth&&chunk)break;chunk+=ch;used++}
   if(!chunk)return null;
   line=chunk;if(used===chars.length)words.shift();else words[0]=chars.slice(used).join('');
   break;
  }
  if(!line)return null;
  rows.push({text:line,left:left+cfg.headlineDX,right:right+cfg.headlineDX,y:lineY});
 }
 if(words.length)return null;
 const titleBottom=rows.length?rows[rows.length-1].y+lh:dy;
 const photoBottom=side?photoY+photoH+creditH:topPhoto?photoY+photoH+creditH:0;
 const mediaBottom=Math.max(titleBottom,photoBottom);
 const source=sourceText(cfg);
 const sourceH=source?32:0;
 const summaryFont=cfg.summarySize,summaryLineHeight=summaryFont*cfg.summaryLineSpacing;
 const sumSpace=Math.abs(cfg.summaryDX)+cfg.summaryInset;
 const summaryRight=w-margin-sumSpace+cfg.summaryDX;
 const summaryWidth=fullWidth-2*sumSpace;
 ctx.font='400 '+summaryFont+'px '+serif;
 const summaryLines=cfg.summary.trim()?toLines(ctx,cfg.summary.trim(),summaryWidth):[];
 const summaryH=summaryLines.length*summaryLineHeight;
 let next=mediaBottom+(summaryLines.length||source?cfg.detailSpacing:0);
 let sourceY:number|null=null,summaryY=0;
 if(source&&cfg.sourcePlacement==='before-summary'){
  sourceY=next+Math.max(-12,cfg.sourceDY);next+=sourceH+12;
 }
 if(summaryLines.length){summaryY=next+Math.max(-12,cfg.summaryDY);next=Math.max(next,summaryY)+summaryH}
 if(source&&cfg.sourcePlacement==='after-summary'){
  sourceY=next+(summaryLines.length?18:0)+Math.max(-12,cfg.sourceDY);next=Math.max(next,sourceY)+sourceH;
 }
 const low=Math.min(0,dy,photoY,summaryY||(sourceY??0),sourceY??0);
 const high=Math.max(titleBottom,photoBottom,next,0);
 const total=high-low+12;
 if(total>bottom-top)return null;
 const free=bottom-top-total;
 const origin=cfg.vertical==='top'?top-low:cfg.vertical==='bottom'?top+free-low:top+free/2-low;
 for(const row of rows)row.y+=origin;
 const imageRect=frame?background
 ?{x:clamp(frame.x+cfg.imageDX,margin+pad,w-margin-pad-frame.w),y:top+10+cfg.imageDY,w:frame.w,h:Math.max(80,bottom-top-24)}
 :{x:photoX,y:origin+photoY,w:frame.w,h:photoH}:null;
 return {rows,photo:imageRect,summaryLines,summaryY:origin+summaryY,summaryRight,summaryFont,summaryLineHeight,
 source,sourceY:sourceY===null?null:origin+sourceY,sourceRight:clamp(w-margin-40+cfg.sourceDX,margin+150,w-margin),
 creditBelowY:creditBelow&&imageRect?imageRect.y+imageRect.h+5:null};
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
 const {w,h}=dimensions(cfg);canvas.width=w;canvas.height=h;
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
 ctx.fillText(modes[cfg.mode],w-margin,cfg.topPadding);
 ctx.strokeStyle=c.accent;ctx.globalAlpha=.52;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(margin,cfg.topPadding+74);ctx.lineTo(w-margin,cfg.topPadding+74);ctx.stroke();ctx.globalAlpha=1;
 let yy=cfg.topPadding+100;
 if(taxonomy.length){
  ctx.fillStyle=c.dim;ctx.font='500 27px '+serif;
  for(const line of taxonomy){ctx.fillText(line,w-margin,yy);yy+=40}
 }
 if(cfg.mode==='statement'){
  const taxEnd=taxonomy.length?yy+28:cfg.topPadding+93;
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
 }else if(cfg.mode==='quote'){
  if(cfg.personImage){
   const px=margin,py=top+32,pw=Math.floor((w-margin*2)*.36),ph=Math.min(430,h-355-top);
   if(ph>90){ctx.save();ctx.beginPath();ctx.roundRect(px,py,pw,ph,22);ctx.clip();const image=cfg.personImage;const ratio=Math.max(pw/image.width,ph/image.height);const iw=image.width*ratio,ih=image.height*ratio;ctx.drawImage(image,px+(pw-iw)/2,py+(ph-ih)/2,iw,ih);ctx.restore()}
  }
  const right=w-margin;const quoteWidth=cfg.personImage?(w-margin*2)*.58:w-margin*2;
  ctx.fillStyle=c.accent;ctx.font='700 35px '+serif;ctx.fillText('❝',right,top-20);
  ctx.fillStyle=c.fg;ctx.font=cfg.textWeight+' '+font+'px '+serif;
  p.lines.forEach((line,j)=>drawText(ctx,line,right,top+35+j*lineHeight,cfg.underline));
  const qBottom=top+40+p.lines.length*lineHeight;
  ctx.fillStyle=c.accent;ctx.fillRect(right-110,qBottom+5,110,5);
  ctx.fillStyle=c.fg;ctx.font='700 32px '+serif;ctx.fillText(ellipsis(ctx,cfg.quoteName||'المتحدث',quoteWidth),right,qBottom+25);
  if(cfg.quoteRole){ctx.fillStyle=c.dim;ctx.font='400 24px '+serif;const roles=toLines(ctx,cfg.quoteRole,quoteWidth).slice(0,2);roles.forEach((line,j)=>ctx.fillText(line,right,qBottom+68+j*34))}
 }else{
  const news=p.news;if(!news)return {total:0,error:'فشل تخطيط الخبر'};
  if(news.photo&&cfg.newsImage&&cfg.photoPosition==='background'){
   paintPhoto(ctx,cfg.newsImage,news.photo,cfg.photoFit,cfg.photoRounded,cfg.photoOpacity/100,cfg.imageShape,cfg.imageRadius,cfg.imageBorder,c.accent);
   ctx.fillStyle=c.bg;ctx.globalAlpha=(cfg.skin==='ivory'||cfg.skin==='stone'||cfg.skin==='rose') ? .62 : .52;
   ctx.fillRect(news.photo.x,news.photo.y,news.photo.w,news.photo.h);ctx.globalAlpha=1;
  }
  if(news.photo&&cfg.newsImage&&cfg.photoPosition!=='background')
   paintPhoto(ctx,cfg.newsImage,news.photo,cfg.photoFit,cfg.photoRounded,1,cfg.imageShape,cfg.imageRadius,cfg.imageBorder,c.accent);
  ctx.font=cfg.textWeight+' '+font+'px '+serif;ctx.direction='rtl';ctx.fillStyle=c.fg;ctx.textAlign=cfg.align;
  for(const line of news.rows){
   const x=cfg.align==='center'?(line.left+line.right)/2:line.right;
   drawText(ctx,line.text,x,line.y,cfg.underline);
  }
  if(news.summaryLines.length){
   ctx.direction='rtl';ctx.textAlign='right';ctx.font='400 '+news.summaryFont+'px '+serif;ctx.fillStyle=c.dim;
   for(let j=0;j<news.summaryLines.length;j++)ctx.fillText(news.summaryLines[j],news.summaryRight,news.summaryY+j*news.summaryLineHeight);
  }
  if(news.source&&news.sourceY!==null){
   ctx.direction='rtl';ctx.textAlign='right';ctx.font='500 25px '+serif;ctx.fillStyle=c.accent;
   ctx.fillText(ellipsis(ctx,news.source,w-2*margin-35),news.sourceRight,news.sourceY);
  }
  if(news.photo&&cfg.newsImage)photoCredit(ctx,cfg,news.photo,news.creditBelowY,c.dim);
 }

 const foot=h-cfg.bottomPadding-150;
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
 if(cfg.showLocation&&cfg.location.trim()){ctx.fillStyle=c.accent;ctx.font='500 24px '+serif;ctx.direction='rtl';ctx.textAlign='right';ctx.fillText(ellipsis(ctx,'الموقع: '+cfg.location,w-margin*2),w-margin,foot-47)}
 ctx.fillStyle=c.dim;ctx.font='400 24px '+sans;ctx.direction='ltr';ctx.textAlign='left';
 ctx.fillText(calendarDate(cfg.date,cfg.showWeekday),margin,foot+88);
 if(cfg.mode==='statement')ctx.fillText(String(index+1)+' / '+String(pages.length),margin,foot+115);
 if((cfg.mode==='statement'||cfg.mode==='quote')&&sourceText(cfg)){
  ctx.fillStyle=c.accent;ctx.font='500 24px '+serif;ctx.direction='rtl';ctx.textAlign='right';
  ctx.fillText(ellipsis(ctx,sourceText(cfg),w-margin*2),w-margin,foot-68);
 }
 return {total:pages.length,error:''};
}
async function getLogo():Promise<HTMLImageElement|null>{
 return await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src='/api/studio-logo'});
}
export default function Studio(){
 const [mode,setMode]=useState<Mode>('news');
 const [format,setFormat]=useState<Format>('portrait');
 const [customWidth,setCustomWidth]=useState(1080);
 const [customHeight,setCustomHeight]=useState(1350);
 const [topPadding,setTopPadding]=useState(63);
 const [bottomPadding,setBottomPadding]=useState(12);
 const [detailSpacing,setDetailSpacing]=useState(32);
 const [summaryLineSpacing,setSummaryLineSpacing]=useState(1.5);
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
 const [summary,setSummary]=useState('');
 const [location,setLocation]=useState('');
 const [showLocation,setShowLocation]=useState(true);
 const [quoteName,setQuoteName]=useState('');
 const [quoteRole,setQuoteRole]=useState('');
 const [personImage,setPersonImage]=useState<HTMLImageElement|null>(null);
 const [mapImage,setMapImage]=useState<HTMLImageElement|null>(null);
 const [newsImage,setNewsImage]=useState<HTMLImageElement|null>(null);
 const [photoPosition,setPhotoPosition]=useState<PhotoPosition>('left');
 const [photoFit,setPhotoFit]=useState<PhotoFit>('cover');
 const [photoScale,setPhotoScale]=useState(85);
 const [photoOpacity,setPhotoOpacity]=useState(40);
 const [photoRounded,setPhotoRounded]=useState(true);
 const [titleScale,setTitleScale]=useState(100);
 const [hidePathOnBackground,setHidePathOnBackground]=useState(true);
 const [showWeekday,setShowWeekday]=useState(true);
 const [sourcePlacement,setSourcePlacement]=useState<SourcePlacement>('after-summary');
 const [sourcePrefix,setSourcePrefix]=useState('المصدر:');
 const [headlineDX,setHeadlineDX]=useState(0),[headlineDY,setHeadlineDY]=useState(0),[headlineInset,setHeadlineInset]=useState(15);
 const [summaryDX,setSummaryDX]=useState(0),[summaryDY,setSummaryDY]=useState(0),[summaryInset,setSummaryInset]=useState(15),[summarySize,setSummarySize]=useState(29);
 const [sourceDX,setSourceDX]=useState(0),[sourceDY,setSourceDY]=useState(0);
 const [imageDX,setImageDX]=useState(0),[imageDY,setImageDY]=useState(0),[imageInset,setImageInset]=useState(12);
 const [imageShape,setImageShape]=useState<PhotoShape>('rounded'),[imageRadius,setImageRadius]=useState(18),[imageBorder,setImageBorder]=useState(0);
 const [imageCredit,setImageCredit]=useState(''),[showImageCredit,setShowImageCredit]=useState(true),[imageCreditPlacement,setImageCreditPlacement]=useState<PhotoCreditPlacement>('inside');
 const [wrapHeadline,setWrapHeadline]=useState(true);
 const [mediaError,setMediaError]=useState('');
 const [issuer,setIssuer]=useState('');
 const [issuerLogo,setIssuerLogo]=useState<HTMLImageElement|null>(null);
 const [issuerLogoError,setIssuerLogoError]=useState('');
 const [path,setPath]=useState<KnowledgePath>({dossier:'',issue:'',event:''});
 const [date,setDate]=useState(()=>{const p=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:'Asia/Aden',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(type:string)=>p.find(x=>x.type===type)?.value??'';return get('year')+'/'+get('month')+'/'+get('day')});
 const [page,setPage]=useState(0);const [count,setCount]=useState(0);
 const [error,setError]=useState('');const [logo,setLogo]=useState<HTMLImageElement|null>(null);
 const [exporting,setExporting]=useState(false);const canvas=useRef<HTMLCanvasElement>(null);
 const cfg=useMemo(()=>({mode,format,customWidth,customHeight,topPadding,bottomPadding,detailSpacing,summaryLineSpacing,skin,title,body,issuer,date,logo,issuerLogo,path,bodyWeight,titleSize,showPath,sourceUrl,sourceName,showSource,textSize,textWeight,align,underline,sideMargin,lineSpacing,vertical,summary,location,showLocation,quoteName,quoteRole,personImage,mapImage,newsImage,photoPosition,photoFit,photoScale,photoOpacity,photoRounded,titleScale,hidePathOnBackground,showWeekday,sourcePlacement,sourcePrefix,headlineDX,headlineDY,headlineInset,summaryDX,summaryDY,summaryInset,summarySize,sourceDX,sourceDY,imageDX,imageDY,imageInset,imageShape,imageRadius,imageBorder,imageCredit,showImageCredit,imageCreditPlacement,wrapHeadline}),[mode,format,customWidth,customHeight,topPadding,bottomPadding,detailSpacing,summaryLineSpacing,skin,title,body,issuer,date,logo,issuerLogo,path,bodyWeight,titleSize,showPath,sourceUrl,sourceName,showSource,textSize,textWeight,align,underline,sideMargin,lineSpacing,vertical,summary,location,showLocation,quoteName,quoteRole,personImage,mapImage,newsImage,photoPosition,photoFit,photoScale,photoOpacity,photoRounded,titleScale,hidePathOnBackground,showWeekday,sourcePlacement,sourcePrefix,headlineDX,headlineDY,headlineInset,summaryDX,summaryDY,summaryInset,summarySize,sourceDX,sourceDY,imageDX,imageDY,imageInset,imageShape,imageRadius,imageBorder,imageCredit,showImageCredit,imageCreditPlacement,wrapHeadline]);
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
 async function loadMedia(file:File|undefined,kind:'person'|'map'|'news'){
  const setter=kind==='person'?setPersonImage:kind==='map'?setMapImage:setNewsImage;
  if(!file){setter(null);setMediaError('');return}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){setMediaError('الصورة يجب أن تكون PNG أو JPEG أو WebP بحجم حتى 5MB');return}
  const url=URL.createObjectURL(file);
  try{const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('invalid'));img.src=url});setter(image);setMediaError('');setPage(0)}catch{setMediaError('تعذر قراءة ملف الصورة')}finally{URL.revokeObjectURL(url)}
 }
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
 <header className="knowledge-hero"><span className="eyebrow">استوديو ساس · V2</span><h1>استوديو المنتجات البصرية</h1><p>معاينة وتصدير محلي دون نشر آلي أو تعديل تلقائي للبيان.</p></header>
 <div className="studio-layout"><section className="admin-panel studio-fields">
 <h2>إعداد المادة</h2>
 <label>نوع التصميم<select value={mode} onChange={e=>{const next=e.target.value as Mode;setMode(next);setTextSize(next==='statement'?43:78);setSideMargin(next==='statement'?120:76);setLineSpacing(next==='statement'?1.65:1.45);setPage(0)}}>{(Object.keys(modes) as Mode[]).map(k=><option key={k} value={k}>{modes[k]}</option>)}</select></label>
 <label>{mode==='statement'?'عنوان البيان (حتى 120 حرفًا)':mode==='quote'?'نص التصريح أو الاقتباس':'عنوان الخبر'}<textarea rows={3} maxLength={mode==='statement'?120:900} value={title} onChange={e=>{setTitle(e.target.value);setPage(0)}}/></label>
 {(mode==='news'||mode==='urgent')&&<><label>تفاصيل مختصرة للخبر<textarea rows={4} maxLength={260} value={summary} onChange={e=>{setSummary(e.target.value);setPage(0)}} placeholder="موجز تكميلي يظهر أسفل العنوان في مساحة مستقلة"/></label></>}
 {(mode==='news'||mode==='urgent')&&<fieldset className="studio-options"><legend>الصورة الرئيسية للخبر أو العاجل</legend>
 <label>إضافة صورة رئيسية<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void loadMedia(e.target.files?.[0],'news')}/></label>
 {newsImage&&<><button type="button" onClick={()=>setNewsImage(null)}>حذف الصورة الرئيسية</button>
 <label>موضع الصورة<select value={photoPosition} onChange={e=>setPhotoPosition(e.target.value as PhotoPosition)}><option value="left">يسار النص</option><option value="right">يمين النص</option><option value="top">أعلى العنوان</option><option value="background">خلفية خافتة</option></select></label>
 <label>طريقة العرض<select value={photoFit} onChange={e=>setPhotoFit(e.target.value as PhotoFit)}><option value="cover">قص لملء المساحة</option><option value="contain">احتواء الصورة كاملة</option></select></label>
 <label>حجم الصورة: {photoScale}%<input type="range" min={45} max={130} step={5} value={photoScale} onChange={e=>setPhotoScale(Number(e.target.value))}/></label>
 {photoPosition==='background'&&<label><input type="checkbox" checked={hidePathOnBackground} onChange={e=>setHidePathOnBackground(e.target.checked)}/> إخفاء مسار التصنيف فوق الصورة الخلفية</label>}
 {photoPosition==='background'&&<label>شفافية الخلفية: {photoOpacity}%<input type="range" min={15} max={80} step={5} value={photoOpacity} onChange={e=>setPhotoOpacity(Number(e.target.value))}/></label>}
 <label><input type="checkbox" checked={photoRounded} onChange={e=>setPhotoRounded(e.target.checked)}/> تفعيل الاستدارة عند اختيار إطار مستدير</label> <label>شكل إطار الصورة<select value={imageShape} onChange={e=>setImageShape(e.target.value as PhotoShape)}>
 <option value="square">مستطيل حاد</option><option value="rounded">زوايا مستديرة</option><option value="mixed">زوايا مختلطة</option><option value="circle">دائرة</option><option value="oval">بيضاوي</option><option value="hexagon">سداسي</option><option value="angled">غير منتظم</option><option value="fade">حواف متلاشية</option></select></label>
 {(imageShape==='rounded'||imageShape==='mixed')&&<label>استدارة الحواف {imageRadius}px<input type="range" min={0} max={80} step={5} value={imageRadius} onChange={e=>setImageRadius(Number(e.target.value))}/></label>}
 <label>سمك إطار الصورة {imageBorder}px<input type="range" min={0} max={10} step={1} value={imageBorder} onChange={e=>setImageBorder(Number(e.target.value))}/></label>
 <label>مصدر الصورة / حقوقها<input value={imageCredit} maxLength={150} placeholder="تصوير: منصة ساس / © الجهة المصورة" onChange={e=>setImageCredit(e.target.value)}/></label>
 <label><input type="checkbox" checked={showImageCredit} onChange={e=>setShowImageCredit(e.target.checked)}/> إظهار حقوق الصورة</label>
 {showImageCredit&&imageCredit.trim()&&<label>مكان حقوق الصورة<select value={imageCreditPlacement} onChange={e=>setImageCreditPlacement(e.target.value as PhotoCreditPlacement)}><option value="inside">داخل الصورة</option><option value="below">أسفل الصورة</option></select></label>}
 </>}
 </fieldset>}
 {mode==='quote'&&<><label>اسم المتحدث<input value={quoteName} maxLength={100} onChange={e=>setQuoteName(e.target.value)}/></label><label>صفة المتحدث<input value={quoteRole} maxLength={150} onChange={e=>setQuoteRole(e.target.value)}/></label><label>صورة المتحدث (اختيارية، حتى 5MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void loadMedia(e.target.files?.[0],'person')}/></label>{personImage&&<button type="button" onClick={()=>setPersonImage(null)}>حذف صورة المتحدث</button>}</>}
 {(mode==='news'||mode==='urgent'||mode==='quote')&&<fieldset className="studio-options"><legend>السياق الجغرافي (تمهيد لمحرك الخرائط)</legend><label>المنطقة أو المحافظة<input value={location} maxLength={120} placeholder="حضرموت" onChange={e=>setLocation(e.target.value)}/></label><label><input type="checkbox" checked={showLocation} onChange={e=>setShowLocation(e.target.checked)}/> إظهار اسم الموقع في البطاقة</label></fieldset>}
 {mediaError&&<p role="alert" className="admin-feedback">{mediaError}</p>}
 <label>اسم المصدر (اختياري)<input value={sourceName} maxLength={120} placeholder="وكيل حضرموت الإخباري" onChange={e=>setSourceName(e.target.value)}/></label>
 <label>رابط المصدر (اختياري)<input dir="ltr" type="url" placeholder="https://..." value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}/></label>
 {(sourceUrl||sourceName)&&<p className="studio-note">المصدر جزء من المادة التحريرية، ويظهر داخل منطقة المحتوى لا في تذييل الشعار والتاريخ.</p>}
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
 <label>المقاس<select value={format} onChange={e=>{setFormat(e.target.value as Format);setPage(0)}}>{(Object.keys(sizes) as Format[]).map(k=><option key={k} value={k} >{sizes[k].label}</option>)}</select></label>
 {format==='custom'&&<div className="studio-custom-size"><label>العرض بالبكسل<input type="number" min={600} max={2400} step={10} value={customWidth} onChange={e=>{setCustomWidth(Number(e.target.value));setPage(0)}}/></label><label>الارتفاع بالبكسل<input type="number" min={600} max={3000} step={10} value={customHeight} onChange={e=>{setCustomHeight(Number(e.target.value));setPage(0)}}/></label></div>}
 <label>لوحة الألوان<select value={skin} onChange={e=>setSkin(e.target.value as Skin)}><option value="forest">أخضر عميق</option><option value="ink">حبر داكن</option><option value="ivory">عاجي</option><option value="navy">كحلي مؤسسي</option><option value="olive">زيتوني</option><option value="stone">رمادي دافئ</option><option value="rose">وردي ترابي</option></select></label>
 <fieldset className="studio-options"><legend>تخصيصات التصميم</legend><label><input type="checkbox" checked={showPath} onChange={e=>setShowPath(e.target.checked)}/> إظهار مسار التصنيف</label>{mode==='statement'&&<><label>وزن متن البيان<select value={bodyWeight} onChange={e=>setBodyWeight(Number(e.target.value) as 300|400)}><option value={300}>Light — خفيف</option><option value={400}>Regular — عادي</option></select></label><label>حجم عنوان البيان: {titleSize}px<input type="range" min={52} max={74} step={2} value={titleSize} onChange={e=>setTitleSize(Number(e.target.value))}/></label></>}</fieldset>
 <fieldset className="studio-options"><legend>تنسيق النص والإطار غير المرئي</legend>
 <label>حجم النص الرئيسي: {textSize} بكسل<input type="range" min={32} max={104} step={2} value={textSize} onChange={e=>setTextSize(Number(e.target.value))}/></label>
 <label>سماكة نص الخبر<select value={textWeight} onChange={e=>setTextWeight(Number(e.target.value) as Weight)}><option value={300}>خفيف</option><option value={400}>عادي</option><option value={500}>متوسط</option><option value={700}>عريض</option></select></label>
 <label>المحاذاة<select value={align} onChange={e=>setAlign(e.target.value as Align)}><option value="right">يمين</option><option value="center">توسيط</option></select></label>
 <label>موضع النص<select value={vertical} onChange={e=>setVertical(e.target.value as 'top'|'center'|'bottom')}><option value="top">أعلى الإطار</option><option value="center">وسط الإطار</option><option value="bottom">أسفل الإطار</option></select></label>
 <label>الهامش الجانبي: {sideMargin} بكسل<input type="range" min={64} max={185} step={1} value={sideMargin} onChange={e=>setSideMargin(Number(e.target.value))}/></label>
 <label>تباعد أسطر العنوان / المتن: {lineSpacing.toFixed(2)}<input type="range" min={1.0} max={2.2} step={0.05} value={lineSpacing} onChange={e=>setLineSpacing(Number(e.target.value))}/></label>
 {(mode==='news'||mode==='urgent')&&<><label>مقياس عنوان الخبر: {titleScale}%<input type="range" min={80} max={120} step={5} value={titleScale} onChange={e=>setTitleScale(Number(e.target.value))}/></label><label>تباعد أسطر الموجز: {summaryLineSpacing.toFixed(2)}<input type="range" min={1} max={2.2} step={0.05} value={summaryLineSpacing} onChange={e=>setSummaryLineSpacing(Number(e.target.value))}/></label><label>المسافة بين العنوان والتفصيل: {detailSpacing} بكسل<input type="range" min={14} max={110} step={2} value={detailSpacing} onChange={e=>setDetailSpacing(Number(e.target.value))}/></label></>}
 <label>الهامش العلوي: {topPadding} بكسل<input type="range" min={40} max={140} step={2} value={topPadding} onChange={e=>setTopPadding(Number(e.target.value))}/></label>
 <label>الهامش السفلي: {bottomPadding} بكسل<input type="range" min={0} max={95} step={5} value={bottomPadding} onChange={e=>setBottomPadding(Number(e.target.value))}/></label>
 <label><input type="checkbox" checked={underline} onChange={e=>setUnderline(e.target.checked)}/> تسطير النص الرئيسي</label>
 <label><input type="checkbox" checked={showSource} onChange={e=>setShowSource(e.target.checked)}/> إظهار اسم المصدر</label>
 <small>تكييف النص داخل الإطار بالالتفاف والتصغير عند الحاجة. الكشيدة والضبط الكامل يحتاجان خوارزمية تشكيل عربية مستقلة، ولذلك لم يُفعّلا بعد.</small>
 </fieldset>
 {(mode==='news'||mode==='urgent')&&<fieldset className="studio-options"><legend>تموضع عناصر الخبر داخل المساحة</legend>
 <details open><summary>العنوان والتفافه حول الصورة</summary>
 <label><input type="checkbox" checked={wrapHeadline} onChange={e=>setWrapHeadline(e.target.checked)}/> اسمح للعنوان بالاستمرار أسفل الصورة الجانبية</label>
 <label>هامش العنوان الداخلي: {headlineInset}px<input type="range" min={0} max={100} step={5} value={headlineInset} onChange={e=>setHeadlineInset(Number(e.target.value))}/></label>
 <label>إزاحة العنوان أفقيًا: {headlineDX}px<input type="range" min={-60} max={60} step={5} value={headlineDX} onChange={e=>setHeadlineDX(Number(e.target.value))}/></label>
 <label>إزاحة العنوان رأسيًا: {headlineDY}px<input type="range" min={-60} max={60} step={5} value={headlineDY} onChange={e=>setHeadlineDY(Number(e.target.value))}/></label></details>
 <details><summary>الموجز المختصر</summary>
 <label>حجم خط الموجز: {summarySize}px<input type="range" min={20} max={45} step={1} value={summarySize} onChange={e=>setSummarySize(Number(e.target.value))}/></label>
 <label>هامش الموجز الداخلي: {summaryInset}px<input type="range" min={0} max={95} step={5} value={summaryInset} onChange={e=>setSummaryInset(Number(e.target.value))}/></label>
 <label>إزاحة الموجز أفقيًا: {summaryDX}px<input type="range" min={-60} max={60} step={5} value={summaryDX} onChange={e=>setSummaryDX(Number(e.target.value))}/></label>
 <label>إزاحة الموجز رأسيًا: {summaryDY}px<input type="range" min={-35} max={80} step={5} value={summaryDY} onChange={e=>setSummaryDY(Number(e.target.value))}/></label></details>
 <details><summary>الصورة الرئيسية</summary>
 <label>هامش الصورة الداخلي: {imageInset}px<input type="range" min={0} max={75} step={5} value={imageInset} onChange={e=>setImageInset(Number(e.target.value))}/></label>
 <label>إزاحة الصورة أفقيًا: {imageDX}px<input type="range" min={-60} max={60} step={5} value={imageDX} onChange={e=>setImageDX(Number(e.target.value))}/></label>
 <label>إزاحة الصورة رأسيًا: {imageDY}px<input type="range" min={-60} max={60} step={5} value={imageDY} onChange={e=>setImageDY(Number(e.target.value))}/></label></details>
 <details><summary>مصدر المادة</summary>
 <label>صيغة الإسناد<select value={sourcePrefix} onChange={e=>setSourcePrefix(e.target.value)}><option value="المصدر:">المصدر:</option><option value="نقلًا عن:">نقلًا عن:</option><option value="وفقًا لـ:">وفقًا لـ:</option></select></label>
 <label>موضع المصدر<select value={sourcePlacement} onChange={e=>setSourcePlacement(e.target.value as SourcePlacement)}><option value="before-summary">قبل الموجز</option><option value="after-summary">بعد الموجز</option></select></label>
 <label>إزاحة المصدر أفقيًا: {sourceDX}px<input type="range" min={-60} max={60} step={5} value={sourceDX} onChange={e=>setSourceDX(Number(e.target.value))}/></label>
 <label>إزاحة المصدر رأسيًا: {sourceDY}px<input type="range" min={-35} max={75} step={5} value={sourceDY} onChange={e=>setSourceDY(Number(e.target.value))}/></label></details>
 <small>تتحرك العناصر ضمن الهوامش الآمنة؛ إذا لم تتسع المساحة يظهر تنبيه بدلاً من إسقاط أسطر النص.</small>
 </fieldset>}
 <label><input type="checkbox" checked={showWeekday} onChange={e=>setShowWeekday(e.target.checked)}/> إظهار اسم اليوم مع التاريخ</label>
 <label>التاريخ<input dir="ltr" value={date} onChange={e=>setDate(e.target.value)} pattern="[0-9]{4}/[0-9]{2}/[0-9]{2}"/></label>
 {error&&<p role="alert" className="admin-feedback">{error}</p>}
 <button type="button" onClick={()=>void exportPages()} disabled={exporting||!!error||!count||!logo}>{exporting?'جارٍ التصدير…':count>1?'تصدير جميع الصفحات PNG':'تصدير PNG'}</button>
 <p className="studio-note">الشعار دائمًا على أرضية فاتحة. في البيان الرسمي يُقسّم المتن تلقائيًا مع بقاء النص كاملًا في المحرر. راجع ترتيب الصفحات قبل النشر.</p>
 </section>
 <section className="studio-preview"><div className="studio-preview-header"><h2>معاينة التصميم</h2><span>{count>0?'صفحة '+(page+1)+' من '+count:'بانتظار النص'}</span></div>
 <canvas ref={canvas} role="img" aria-label="معاينة صفحة صورة الخبر" style={{aspectRatio:dimensions(cfg).w+'/'+dimensions(cfg).h}}/>
 {count>1&&<div className="studio-pager"><button type="button" disabled={page===0} onClick={()=>setPage(v=>v-1)}>السابقة</button><span>{page+1} / {count}</span><button type="button" disabled={page===count-1} onClick={()=>setPage(v=>v+1)}>التالية</button></div>}
 </section></div></main>;
}
