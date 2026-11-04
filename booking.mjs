import {randomUUID} from 'node:crypto';
export async function createBookingService(db,config){
 if(config.timezone!=='America/Mexico_City')throw new Error('La agenda utiliza America/Mexico_City. Revisa booking-config.json.');
 if(!Array.isArray(config.advisors)||!config.advisors.length||new Set(config.advisors.map(a=>a.id)).size!==config.advisors.length)throw new Error('Configura asesores con IDs únicos.');
 if(!Array.isArray(config.times)||!config.times.length||config.times.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))||!Array.isArray(config.openWeekdays)||!Array.isArray(config.closedDates)||!Number.isInteger(config.maxDaysAhead)||config.maxDaysAhead<1||config.maxDaysAhead>365||!Number.isFinite(config.minimumNoticeMinutes)||config.minimumNoticeMinutes<0||!Number.isInteger(config.durationMinutes)||config.durationMinutes<1)throw new Error('Configuración de agenda inválida.');
 config.times=[...new Set(config.times)].sort();
 for(let i=1;i<config.times.length;i++){const m=t=>Number(t.slice(0,2))*60+Number(t.slice(3));if(m(config.times[i])-m(config.times[i-1])<config.durationMinutes)throw new Error('Los horarios se solapan. Reduce la duración o separa las horas.');}
 await db.exec(`CREATE TABLE IF NOT EXISTS appointments(id TEXT PRIMARY KEY,reference TEXT UNIQUE NOT NULL,lead_id TEXT NOT NULL REFERENCES leads(id),advisor_id TEXT NOT NULL,advisor_name TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,duration INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'confirmed',created_at TEXT NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS appointment_advisor_slot ON appointments(advisor_id,date,time) WHERE status='confirmed';`);
 const advisors=config.advisors.filter(a=>a.active&&a.id&&a.name);
 const isoToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const addDays=(day,n)=>{const d=new Date(day+'T12:00:00-06:00');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
 function validDate(date){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00-06:00'))&&new Date(date+'T12:00:00-06:00').toISOString().slice(0,10)===date}
 function openDate(date){return validDate(date)&&date>=isoToday()&&date<=addDays(isoToday(),config.maxDaysAhead)&&config.openWeekdays.includes(new Date(date+'T12:00:00-06:00').getUTCDay())&&!config.closedDates.includes(date)}
 function futureSlot(date,time){return openDate(date)&&config.times.includes(time)&&Date.parse(date+'T'+time+':00-06:00')>Date.now()+config.minimumNoticeMinutes*60000}
 async function freeAdvisors(date,time){if(!futureSlot(date,time))return [];const busy=(await db.prepare("SELECT advisor_id FROM appointments WHERE date=? AND status='confirmed' AND time=?").all(date,time));return advisors.filter(a=>!busy.some(b=>b.advisor_id===a.id))}
 async function availability(date){if(!validDate(date))return null;return {date,timezone:config.timezone,demo:config.demo,durationMinutes:config.durationMinutes,slots:await Promise.all(config.times.map(async time=>({time,available:(await freeAdvisors(date,time)).length>0})))}}
 async function reserve(b){
 const date=String(b.date||''),time=String(b.time||'');
 if(!futureSlot(date,time))return {status:400,error:'Elige un horario disponible dentro del periodo de reservación.'};
 return db.transaction(async()=>{
 const duplicate=(await db.prepare("SELECT a.id FROM appointments a JOIN leads l ON l.id=a.lead_id WHERE a.status='confirmed' AND a.date=? AND a.time=? AND lower(l.email)=?").get(date,time,b.email.toLowerCase()));
 if(duplicate){return {status:409,error:'Ya registraste una cita en ese horario. Consulta al equipo comercial si necesitas modificarla.'}}
 const available=await freeAdvisors(date,time);
 if(!available.length){return {status:409,error:'Ese horario acaba de ocuparse. Elige otro horario disponible.'}}
 const loads=(await db.prepare("SELECT advisor_id,COUNT(*) AS total FROM appointments WHERE status='confirmed' AND date>=? GROUP BY advisor_id").all(isoToday()));
 const load=id=>Number(loads.find(x=>x.advisor_id===id)?.total||0);
 available.sort((a,b)=>load(a.id)-load(b.id)||a.id.localeCompare(b.id));const advisor=available[0];
 const leadId=randomUUID(),id=randomUUID(),reference='LS-'+randomUUID().slice(0,8).toUpperCase(),created=new Date().toISOString();
 (await db.prepare('INSERT INTO leads VALUES(?,?,?,?,?,?,?,?,?)').run(leadId,b.name,b.email,b.phone,'Agendar una visita',b.message,b.source,created,1));
 (await db.prepare('INSERT INTO appointments VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,reference,leadId,advisor.id,advisor.name,date,time,config.durationMinutes,'confirmed',created));
 return {status:201,appointment:{reference,date,time,advisor:advisor.name,durationMinutes:config.durationMinutes,timezone:config.timezone,demo:config.demo}};
 });
 }
 const list=async()=>(await db.prepare('SELECT a.*,l.name,l.email,l.phone,l.message FROM appointments a JOIN leads l ON l.id=a.lead_id ORDER BY a.date DESC,a.time DESC').all());
 async function cancel(id){return (await db.prepare("UPDATE appointments SET status='cancelled' WHERE id=? AND status='confirmed'").run(id)).changes>0}
 return {availability,reserve,list,cancel,settings:()=>({today:isoToday(),maxDate:addDays(isoToday(),config.maxDaysAhead),openWeekdays:config.openWeekdays,closedDates:config.closedDates,timezone:config.timezone,durationMinutes:config.durationMinutes,demo:config.demo})};
}
