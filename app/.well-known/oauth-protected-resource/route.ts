import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export function GET(request:Request){
 const origin=new URL(request.url).origin;
 const supabase=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!supabase)return NextResponse.json({error:'OAuth issuer not configured'},{status:503});
 return NextResponse.json({
  resource:origin+'/mcp',
  authorization_servers:[supabase.replace(/\/$/,'')+'/auth/v1'],
  scopes_supported:['openid','email','profile'],
 },{headers:{'Cache-Control':'no-store'}});
}
