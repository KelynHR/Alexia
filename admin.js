(()=>{
 let data=[],view='leads',loading=0;const q=s=>document.querySelector(s),count=q('#count'),rows=q('#rows'),search=q('#search');
 const time=s=>new Date(s).toLocaleString('es-MX',{timeZone:'America/Mexico_City'});
 function cell(value){const td=document.createElement('td');td.textContent=value??'';return td}
 function render(){
  const term=search.value.toLocaleLowerCase('es'),filtered=data.filter(x=>[x.name,x.email,x.phone,x.interest,x.advisor_name,x.reference,x.date].join(' ').toLocaleLowerCase('es').includes(term));
  const headings=view==='leads'?['Fecha','Nombre','Correo','Teléfono','Interés','Mensaje','Origen']:['Referencia','Día','Hora Qro.','Asesor','Nombre','Correo','Teléfono','Estado','Acción'];
  const hr=document.createElement('tr');headings.forEach(v=>{const th=document.createElement('th');th.scope='col';th.textContent=v;hr.append(th)});q('#table-head').replaceChildren(hr);
  rows.replaceChildren(...filtered.map(x=>{const tr=document.createElement('tr');
   if(view==='leads')[time(x.created_at),x.name,x.email,x.phone,x.interest,x.message||'—',x.source].forEach(v=>tr.append(cell(v)));
   else{
    [x.reference,x.date,x.time,x.advisor_name,x.name,x.email,x.phone].forEach(v=>tr.append(cell(v)));
    const state=cell(''),badge=document.createElement('span');badge.className='status-pill'+(x.status==='cancelled'?' cancelled':'');badge.textContent=x.status==='cancelled'?'Cancelada':'Registrada';state.append(badge);tr.append(state);
    const action=cell('');if(x.status==='confirmed'){const b=document.createElement('button');b.className='cancel-btn';b.textContent='Cancelar cita';b.addEventListener('click',()=>cancel(x,b));action.append(b)}else action.textContent='—';tr.append(action);
   }return tr;
  }));count.textContent=`${data.length} ${view==='leads'?'prospectos':'citas'} · ${filtered.length} visibles`;q('#empty').hidden=filtered.length>0;
 }
 async function cancel(x,button){if(!confirm('¿Cancelar la cita '+x.reference+' del '+x.date+' a las '+x.time+'? El horario volverá a estar disponible.'))return;button.disabled=true;try{const r=await fetch('/api/appointments/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:x.id})});const result=await r.json();if(!r.ok)throw new Error(result.error);await load()}catch(e){count.textContent=e.message||'No pudimos cancelar la cita.';button.disabled=false}}
 async function load(){const request=++loading;count.textContent='Cargando…';try{const r=await fetch(view==='leads'?'/api/leads':'/api/appointments');if(!r.ok)throw new Error('No se pudo acceder a los registros.');const result=await r.json();if(request!==loading)return;data=result[view];render()}catch(e){if(request===loading)count.textContent=e.message}}
 document.querySelectorAll('[data-view]').forEach(b=>{b.addEventListener('click',()=>{view=b.dataset.view;search.value='';document.querySelectorAll('[data-view]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));q('#admin-panel').setAttribute('aria-labelledby',view+'-tab');q('#search-label').textContent=view==='leads'?'Buscar por nombre, correo, teléfono o interés':'Buscar por nombre, referencia, fecha o asesor';q('#export-link').href=view==='leads'?'/api/leads/export':'/api/appointments/export';load()});b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){const other=q(view==='leads'?'#appointments-tab':'#leads-tab');other.click();other.focus()}})});
 search.addEventListener('input',render);q('#refresh').addEventListener('click',load);load();
})();
