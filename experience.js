/* Experiencia premium: campaña, agenda y recorrido. Sin dependencias. */
(()=>{
 const q=s=>document.querySelector(s),qa=s=>document.querySelectorAll(s),cfg=window.LAGO_CONFIG||{};
 const booking=q('#booking-dialog'),christmas=q('#christmas-dialog'),tour=q('#tour-dialog');
 qa('dialog').forEach(d=>d.addEventListener('close',()=>document.body.classList.toggle('modal-open',!!q('dialog[open]'))));
 const open=d=>{if(!d.open)d.showModal();document.body.classList.add('modal-open')};
 const campaign=cfg.christmas||{};
 function seen(){try{return sessionStorage.getItem('lagosur-christmas-'+campaign.until)==='seen'}catch{return false}}
 function markSeen(){try{sessionStorage.setItem('lagosur-christmas-'+campaign.until,'seen')}catch{}}
 christmas.addEventListener('close',markSeen);
 q('.christmas-dismiss').addEventListener('click',()=>christmas.close());
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(campaign.enabled&&today>=campaign.from&&today<=campaign.until&&(campaign.showEveryVisit||!seen())){
  setTimeout(()=>{if(!q('dialog[open]')&&!location.hash)open(christmas)},1100);
 }
 let settings=null,month=new Date(today+'T12:00:00-06:00'),selectedDay='',selectedTime='',availabilityRequest=0,calendarBlob='';
 const form=q('#booking-form'),status=q('#booking-status'),submit=q('#booking-submit');
 const iso=d=>[d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,'0'),String(d.getUTCDate()).padStart(2,'0')].join('-');
 const niceDate=day=>new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(day+'T12:00:00-06:00'));
 function monthKey(d){return d.getUTCFullYear()*12+d.getUTCMonth()}
 function calendar(){
  const first=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),1,18)),year=first.getUTCFullYear(),m=first.getUTCMonth();
  q('#calendar-month').textContent=new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',month:'long',year:'numeric'}).format(first);
  const nodes=[];for(let i=0;i<(first.getUTCDay()+6)%7;i++){const blank=document.createElement('span');blank.className='calendar-blank';nodes.push(blank)}
  for(let i=1;i<=new Date(Date.UTC(year,m+1,0)).getUTCDate();i++){
   const date=new Date(Date.UTC(year,m,i,18)),day=iso(date),b=document.createElement('button');b.type='button';b.textContent=String(i);b.dataset.date=day;b.setAttribute('aria-label',niceDate(day));b.setAttribute('aria-pressed',String(day===selectedDay));
   b.disabled=!settings||day<settings.today||day>settings.maxDate||!settings.openWeekdays.includes(date.getUTCDay())||settings.closedDates.includes(day);
   if(day===settings?.today)b.classList.add('today');b.addEventListener('click',()=>selectDay(day));nodes.push(b);
  }
  q('#calendar-days').replaceChildren(...nodes);
  q('#prev-month').disabled=!settings||monthKey(month)<=monthKey(new Date(settings.today+'T18:00:00Z'));
  q('#next-month').disabled=!settings||monthKey(month)>=monthKey(new Date(settings.maxDate+'T18:00:00Z'));
 }
 async function selectDay(day){
  selectedDay=day;selectedTime='';submit.disabled=true;calendar();q('#selected-date').textContent=niceDate(day);q('#time-slots').replaceChildren();q('#slots-status').textContent='Consultando horarios…';status.textContent='';const request=++availabilityRequest;
  try{const res=await fetch('/api/availability?date='+encodeURIComponent(day));const data=await res.json();if(!res.ok)throw new Error(data.error||'No pudimos consultar horarios.');if(request!==availabilityRequest)return;
   const available=data.slots.filter(x=>x.available);q('#slots-status').textContent=available.length?'Visita privada de '+data.durationMinutes+' minutos.':'No hay horarios disponibles este día. Elige otra fecha.';
   q('#time-slots').replaceChildren(...data.slots.map(slot=>{const b=document.createElement('button');b.type='button';b.textContent=slot.time;b.disabled=!slot.available;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',slot.time+(slot.available?' disponible':' no disponible'));b.addEventListener('click',()=>{selectedTime=slot.time;qa('#time-slots button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));submit.disabled=false});return b}));
  }catch(e){if(request===availabilityRequest)q('#slots-status').textContent=e.message||'Inicia el servidor con npm start para consultar la agenda.'}
 }
 async function openBooking(e){
  e?.preventDefault();if(christmas.open)christmas.close();q('#booking-body').hidden=false;q('#booking-success').hidden=true;status.textContent='';open(booking);
  if(!settings){q('#slots-status').textContent='Conectando con la agenda…';try{if(location.protocol==='file:')throw new Error('Abre http://localhost:3000 después de ejecutar npm start para usar la agenda.');const r=await fetch('/api/booking-settings');const d=await r.json();if(!r.ok)throw new Error('No pudimos cargar la agenda.');settings=d;month=new Date(settings.today+'T18:00:00Z');q('.booking-demo-note').hidden=!settings.demo;q('#slots-status').textContent='Selecciona una fecha para consultar disponibilidad.';}catch(err){q('#slots-status').textContent=err.message||'Inicia el servidor con npm start para usar la agenda.'}}
  calendar();
 }
 qa('.booking-trigger').forEach(b=>b.addEventListener('click',openBooking));q('#christmas-book').addEventListener('click',openBooking);
 q('#prev-month').addEventListener('click',()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1,18));calendar()});q('#next-month').addEventListener('click',()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1,18));calendar()});
 q('#booking-privacy').addEventListener('click',e=>{e.preventDefault();open(q('#privacy-dialog'))});
 function ics(a){
  const escape=s=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
  const start=new Date(a.date+'T'+a.time+':00-06:00'),end=new Date(start.getTime()+a.durationMinutes*60000),stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lago Sur//Visitas//ES','BEGIN:VEVENT','UID:'+a.reference+'@lagosur.local','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'SUMMARY:Visita privada a Lago Sur','DESCRIPTION:'+escape('Referencia: '+a.reference+' | Asesor: '+a.advisor+(a.demo?' | Reserva de demostración.':'')),'LOCATION:'+escape('Lago Sur, Cañadas del Lago, Corregidora, Querétaro'),'END:VEVENT','END:VCALENDAR'].join('\r\n')+'\r\n';
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity()||!selectedDay||!selectedTime)return;const data=Object.fromEntries(new FormData(form));
  if(data.phone.replace(/\D/g,'').length<10){status.textContent='Escribe un teléfono de al menos 10 dígitos.';status.className='form-status error';return}
  submit.disabled=true;submit.textContent='Reservando tu visita…';status.textContent='';
  try{const r=await fetch('/api/appointments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,consent:form.elements.consent.checked,date:selectedDay,time:selectedTime,interest:'Agendar una visita',source:JSON.stringify({campaign:campaign.enabled?'navidad':'directo',utm:location.search.slice(0,500)})})});const result=await r.json();
   if(!r.ok){if(r.status===409)await selectDay(selectedDay);throw new Error(result.error||'No pudimos registrar la visita.')}
   const a=result.appointment;q('#booking-body').hidden=true;q('#booking-success').hidden=false;q('#appointment-summary').textContent=niceDate(a.date)+' · '+a.time+' h\n'+a.advisor;q('#appointment-reference').textContent='TU REFERENCIA · '+a.reference;
   if(calendarBlob)URL.revokeObjectURL(calendarBlob);calendarBlob=URL.createObjectURL(new Blob([ics(a)],{type:'text/calendar;charset=utf-8'}));q('#calendar-download').href=calendarBlob;q('#calendar-download').download='Visita-LagoSur-'+a.reference+'.ics';form.reset();selectedTime='';selectedDay='';q('#time-slots').replaceChildren();q('#selected-date').textContent='Selecciona un día para ver horarios.';
  }catch(err){status.textContent=err.message||'No pudimos conectar con la agenda. Inténtalo de nuevo.';status.className='form-status error'}finally{submit.disabled=!selectedTime;submit.innerHTML='Reservar mi visita <span>↗</span>'}
 });
 const media=cfg.tour||{},player=q('#tour-player');
 function safeURL(value,video=false){try{const u=new URL(value,location.href);if(!['https:','http:','file:'].includes(u.protocol))return null;if(!video&&u.protocol!=='https:')return null;return u.href}catch{return null}}
 const embed=media.embedUrl&&safeURL(media.embedUrl),video=media.videoUrl&&safeURL(media.videoUrl,true);
 if(embed||video){q('#tour-category').textContent=embed?'RECORRIDO VIRTUAL · 360°':'RECORRIDO EN VIDEO';q('#tour-play').setAttribute('aria-label',embed?'Abrir recorrido virtual 360 grados':'Reproducir recorrido de la residencia');q('#tour-note').textContent=embed?'Explora a tu ritmo. Arrastra la vista y recorre cada espacio.':'Descubre los espacios en una grabación del interior.';}
 if(media.poster&&safeURL(media.poster,true))q('#tour-stage>img').src=media.poster;
 q('#tour-play').addEventListener('click',()=>{
  player.replaceChildren();
  if(embed){const frame=document.createElement('iframe');frame.src=embed;frame.title='Recorrido virtual del modelo Baikal';frame.allow='fullscreen; xr-spatial-tracking; gyroscope; accelerometer';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';player.append(frame);q('#tour-caption').textContent='Recorrido virtual · Modelo Baikal';}
  else if(video){const v=document.createElement('video');v.src=video;v.controls=true;v.playsInline=true;v.poster=media.poster||'assets/interior3.jpg';player.append(v);q('#tour-caption').textContent='Recorrido en video · Modelo Baikal';}
  else{const img=document.createElement('img');img.src='assets/interior3.jpg';img.alt='Recámara principal del modelo Baikal';player.append(img);const note=document.createElement('p');note.className='tour-preview-note';note.textContent='Vista previa del interior. Agenda una visita privada para descubrir todos sus espacios.';player.append(note);q('#tour-caption').textContent='Galería interior · Imagen ilustrativa, no recorrido 360°';}
  open(tour);
 });tour.addEventListener('close',()=>player.replaceChildren());
})();
