const allowedTypes=new Set(['application/json','text/csv;charset=utf-8','text/html;charset=utf-8','text/plain;charset=utf-8','image/png']);
const limit=8*1024*1024;
const fail=(message:string,status=400)=>new Response(message,{status,headers:{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'no-store'}});

export async function POST(request:Request){
 if(Number(request.headers.get('content-length'))>limit*3)return fail('导出内容过大。',413);
 try {
  const form=await request.formData(),name=form.get('name'),mime=form.get('mime'),content=form.get('content'),encoding=form.get('encoding');
  if(typeof name!=='string'||!name||name.length>260||/[\r\n\x00/\\]/.test(name)||typeof mime!=='string'||!allowedTypes.has(mime)||typeof content!=='string'||!['utf-8','base64'].includes(String(encoding)))return fail('导出文件格式错误。');
  if(content.length>limit*1.4)return fail('导出内容过大。',413);
  let body:Uint8Array;
  if(encoding==='base64'){
   if(mime!=='image/png'||!/^[A-Za-z0-9+/]*={0,2}$/.test(content))return fail('图片编码错误。');
   body=Uint8Array.from(atob(content),c=>c.charCodeAt(0));
   if(![137,80,78,71,13,10,26,10].every((b,i)=>body[i]===b))return fail('不是有效的 PNG 文件。');
  }else {
   if(mime==='image/png')return fail('图片编码错误。');
   body=new TextEncoder().encode(content);
  }
  if(body.byteLength>limit)return fail('导出内容过大。',413);
  const extension=name.split('.').pop()?.replace(/[^a-z0-9]/gi,'').slice(0,10)||'txt';
  return new Response(body.slice().buffer,{headers:{'Content-Type':mime,'Content-Disposition':`attachment; filename="line-studio.${extension}"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return fail('无法读取导出内容，请重新生成文件。');}
}
