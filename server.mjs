import http from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createBookingService} from './booking.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||3000),host='127.0.0.1';
const password=process.env.ADMIN_PASSWORD||randomBytes(12).toString('base64url');
await mkdir(resolve(root,'data'),{recursive:true});
const db=new DatabaseSync(resolve(root,'data/leads.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,interest TEXT NOT NULL,message TEXT NOT NULL,source TEXT NOT NULL,created_at TEXT NOT NULL,consent INTEGER NOT NULL)`);
const booking=createBookingService(db,JSON.parse(await readFile(resolve(root,'booking-config.json'),'utf8')));
const rates=new Map();
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
function authorized(req){try{const [user,...parts]=Buffer.from((req.headers.authorization||'').replace(/^Basic /,''),'base64').toString().split(':');const a=Buffer.from(parts.join(':')),b=Buffer.from(password);return user==='admin'&&a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
function protect(req,res){if(authorized(req))return true;res.writeHead(401,{'WWW-Authenticate':'Basic realm="Lago Sur - Prospectos", charset="UTF-8"','Cache-Control':'no-store'});res.end('Acceso privado. Usa las credenciales que aparecen al iniciar el servidor.');return false}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
const allowed=new Set(['index.html','styles.css','script.js','config.js','admin.html','admin.js','experience.js']);
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
 try{
 const base=`http://localhost:${port}`,url=new URL(req.url,base),path=url.pathname;
 if(path==='/api/booking-settings'&&req.method==='GET')return json(res,200,booking.settings());
 if(path==='/api/availability'&&req.method==='GET'){const result=booking.availability(url.searchParams.get('date')||'');return result?json(res,200,result):json(res,400,{error:'Fecha inválida.'})}
 if(path==='/api/appointments'&&req.method==='GET'){if(!protect(req,res))return;return json(res,200,{appointments:booking.list()})}
 if(path==='/api/appointments/cancel'&&req.method==='POST'){
  if(!protect(req,res))return;
  if(req.headers.origin&&!new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]).has(req.headers.origin))return json(res,403,{error:'Origen no permitido.'});
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2000)return json(res,413,{error:'Solicitud demasiado grande.'})}
  let b;try{b=JSON.parse(raw)}catch{return json(res,400,{error:'Solicitud inválida.'})}
  if(!b||typeof b!=='object'||Array.isArray(b))return json(res,400,{error:'Solicitud inválida.'});
  return booking.cancel(String(b.id||''))?json(res,200,{ok:true}):json(res,404,{error:'La cita ya estaba cancelada o no existe.'});
 }
 if(path==='/api/appointments/export'&&req.method==='GET'){
  if(!protect(req,res))return;
  const rows=booking.list(),esc=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  const csv='\uFEFF'+[['Referencia','Fecha','Hora Querétaro','Asesor','Nombre','Correo','Teléfono','Estado'],...rows.map(x=>[x.reference,x.date,x.time,x.advisor_name,x.name,x.email,x.phone,x.status])].map(r=>r.map(esc).join(',')).join('\r\n');
  res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="citas-lago-sur.csv"','Cache-Control':'no-store'});return res.end(csv);
 }
 if((path==='/api/leads'||path==='/api/appointments')&&req.method==='POST'){
  if(req.headers.origin&&!new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]).has(req.headers.origin))return json(res,403,{error:'Origen no permitido.'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'Formato no permitido.'});
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12000)return json(res,413,{error:'Solicitud demasiado grande.'})}
  let b;try{b=JSON.parse(raw)}catch{return json(res,400,{error:'Solicitud inválida.'})}
  if(!b||typeof b!=='object'||Array.isArray(b))return json(res,400,{error:'Solicitud inválida.'});
  if(b.website)return json(res,400,{error:'No pudimos validar la solicitud.'});
  const text=(k)=>String(b[k]??'').trim(),name=text('name'),email=text('email'),phone=text('phone'),interest=text('interest'),message=text('message'),source=text('source');
  if(name.length<2||name.length>100||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200||phone.replace(/\D/g,'').length<10||phone.length>25||!['Agendar una visita','Precios y disponibilidad','Información del modelo Baikal'].includes(interest)||message.length>1500||source.length>1500||b.consent!==true)return json(res,400,{error:'Revisa los datos y acepta el uso de tus datos de contacto.'});
  const now=Date.now(),key=req.socket.remoteAddress||'local',times=(rates.get(key)||[]).filter(t=>now-t<600000);if(times.length>=10)return json(res,429,{error:'Has enviado varias solicitudes. Espera unos minutos antes de volver a intentarlo.'});times.push(now);rates.set(key,times);
  if(path==='/api/appointments'){const result=booking.reserve({name,email,phone,message,source,date:b.date,time:b.time});return result.error?json(res,result.status,{error:result.error}):json(res,result.status,{ok:true,appointment:result.appointment})}
  const id=randomUUID();db.prepare('INSERT INTO leads VALUES(?,?,?,?,?,?,?,?,?)').run(id,name,email,phone,interest,message,source,new Date().toISOString(),1);return json(res,201,{ok:true,id});
 }
 if(['/admin','/admin.html','/api/leads','/api/leads/export'].includes(path)){
  if(!protect(req,res))return;
  if(req.method!=='GET')return json(res,405,{error:'Método no permitido.'});
  if(path==='/api/leads'||path==='/api/leads/export'){
   const rows=db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
   if(path.endsWith('/export')){const esc=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';const csv='\uFEFF'+[['Fecha','Nombre','Correo','Teléfono','Interés','Mensaje','Origen'],...rows.map(x=>[x.created_at,x.name,x.email,x.phone,x.interest,x.message,x.source])].map(r=>r.map(esc).join(',')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="prospectos-lago-sur.csv"','Cache-Control':'no-store'});return res.end(csv)}
   return json(res,200,{leads:rows});
  }
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Método no permitido.'});
 const relative=decodeURIComponent(path==='/admin'?'admin.html':path==='/'?'index.html':path.slice(1));
 const file=resolve(root,relative);
 if(!file.startsWith(root+sep)||(!allowed.has(relative)&&!file.startsWith(resolve(root,'assets')+sep)))return json(res,404,{error:'No encontrado.'});
 if(file===resolve(root,'admin.html')&&!protect(req,res))return;
 const info=await stat(file);if(!info.isFile())return json(res,404,{error:'No encontrado.'});
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':relative.startsWith('assets/')?'public, max-age=3600':'no-store'});res.end(req.method==='HEAD'?undefined:await readFile(file));
 }catch(err){if(err.code==='ENOENT')return json(res,404,{error:'No encontrado.'});console.error('Error atendiendo solicitud:',err.message);json(res,500,{error:'No pudimos guardar tu solicitud. Inténtalo de nuevo.'})}
});
server.listen(port,host,()=>{console.log(`\nLago Sur · Propuesta local\nPágina: http://localhost:${port}\nProspectos: http://localhost:${port}/admin\nUsuario: admin\nContraseña: ${password}\n\nLos datos se guardan en data/leads.sqlite. No publiques esta carpeta.\n`)});
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0)}));
