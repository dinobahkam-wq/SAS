/** Gregorian dates with ASCII digits and stable YYYY/MM/DD order. */
export function formatSasDate(value:string|Date):string {
 const date=value instanceof Date?value:new Date(value);
 if(Number.isNaN(date.getTime()))return '—';
 const parts=new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Aden'}).formatToParts(date);
 const get=(type:string)=>parts.find(part=>part.type===type)?.value??'';
 return `${get('year')}/${get('month')}/${get('day')}`;
}
