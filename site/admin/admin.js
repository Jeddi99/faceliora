'use strict';
(() => {
 const seed=[
  {id:'web',offer:'DooDee web',platform:'Browser',url:'https://www.doodee.app/',label:'เปิด DooDee web',status:'ready',source:'ปลายทางที่ได้รับใน brief ไม่ได้ทดสอบแอป'},
  {id:'mobile',offer:'DooDee mobile',platform:'App Store',url:'',label:'App Store (รอยืนยัน)',status:'pending',source:'URL และความพร้อมรอยืนยัน'},
  {id:'scanner',offer:'Faceliora scanner',platform:'iPhone',url:'',label:'ดาวน์โหลด scanner (รอ)',status:'pending',source:'รุ่นเครื่อง ราคา และลิงก์รอยืนยัน'},
  {id:'windows',offer:'DooDeeClinic desktop',platform:'Windows (ข้อเสนอแยกลิงก์)',url:'',label:'Windows (รอลิงก์)',status:'pending',source:'ยังไม่ยืนยัน OS หรือตัวติดตั้งปัจจุบัน'},
  {id:'mac',offer:'DooDeeClinic desktop',platform:'Mac (ข้อเสนอแยกลิงก์)',url:'',label:'Mac (รอลิงก์)',status:'pending',source:'ยังไม่ยืนยัน OS หรือตัวติดตั้งปัจจุบัน'}
 ];
 const rows=seed.map(x=>({...x}));
 const $=s=>document.querySelector(s), list=$('#admin-list'), listView=$('#list-view'), editView=$('#edit-view'), form=$('#link-form');
 let active=null, original=null, draft=null, focusId=null;
 const text=(tag,content,cls)=>{const el=document.createElement(tag);el.textContent=content;if(cls)el.className=cls;return el;};
 function render(){
  list.replaceChildren();
  rows.forEach(row=>{
   const article=document.createElement('article');article.className='admin-row';
   const product=document.createElement('div');product.append(text('h2',row.offer),text('p',row.platform,'status'));
   const destination=document.createElement('div');destination.className='destination';destination.append(text('p',row.url||'ยังไม่มี URL'),text('p',row.status==='pending'?'รอยืนยัน':'มีปลายทางในร่างจำลอง','status'),text('p',row.source,'small'));
   const button=text('button','แก้ลิงก์','quiet');button.type='button';button.id='edit-'+row.id;button.setAttribute('aria-label','แก้ลิงก์ '+row.offer+' '+row.platform);button.addEventListener('click',()=>edit(row.id));
   article.append(product,destination,button);list.append(article);
  });
 }
 function read(){return {url:$('#destination').value.trim(),label:$('#cta-label').value.trim(),status:$('#availability').value};}
 function dirty(){return JSON.stringify(read())!==JSON.stringify(original);}
 function validate(show=false){
  const v=read();let error='';
  if(!v.url&&v.status==='ready')error='เพิ่ม URL ก่อนเลือกมีปลายทาง หรือเปลี่ยนสถานะกลับเป็นรอยืนยัน';
  if(v.url){
   try{const u=new URL(v.url);const host=u.hostname.toLowerCase().replace(/\.$/,'');const localOrIP=/^[\d.]+$/.test(host)||host.includes(':')||/^(localhost|local)$|\.(localhost|local)$/.test(host);if(u.protocol!=='https:'||u.username||u.password||!host.includes('.')||localOrIP||/\s/.test(v.url))error='ใช้ URL แบบ https:// ที่มีชื่อโดเมน และไม่มีรหัสผ่านหรือช่องว่าง';}catch{error='รูปแบบ URL ไม่ถูกต้อง เช่น https://downloads.example.invalid/mobile';}
  }
  const labelError=!v.label?'ระบุชื่อปุ่มก่อนเก็บร่าง':v.label.length>32?'ย่อชื่อปุ่มให้ไม่เกิน 32 ตัวอักษร':'';
  if(show){$('#url-error').textContent=error;$('#destination').setAttribute('aria-invalid',String(!!error));$('#label-error').textContent=labelError;$('#cta-label').setAttribute('aria-invalid',String(!!labelError));}
  return {valid:!error&&!labelError,error,labelError};
 }
 function preview(){
  draft=read();const v=validate(false);
  $('#unsaved').textContent=dirty()?'มีการแก้ไขที่ยังไม่เก็บร่าง':'ยังไม่มีการแก้ไข';
  $('#preview-label').textContent=draft.label||'ยังไม่มีชื่อปุ่ม';
  $('#preview-url').textContent=draft.url||'ยังไม่มี URL';
  $('#preview-state').textContent=!v.valid?'รูปแบบร่างยังไม่ถูกต้อง':draft.status==='pending'?'รอยืนยัน ปุ่มสาธารณะควรยังไม่เปิดลิงก์':'ตัวอย่างมีปลายทาง ยังไม่ใช่การยืนยันความพร้อมหรือการเผยแพร่';
  if($('#destination').getAttribute('aria-invalid')==='true'||$('#cta-label').getAttribute('aria-invalid')==='true')validate(true);
 }
 function edit(id){
  active=rows.find(x=>x.id===id);focusId='edit-'+id;original={url:active.url,label:active.label,status:active.status};draft={...original};
  $('#edit-heading').textContent='แก้ลิงก์ '+active.offer;$('#edit-offer').textContent=active.platform+' / ข้อมูลทดลองเฉพาะหน้านี้';
  $('#destination').value=draft.url;$('#cta-label').value=draft.label;$('#availability').value=draft.status;
  $('#url-error').textContent='';$('#label-error').textContent='';$('#destination').removeAttribute('aria-invalid');$('#cta-label').removeAttribute('aria-invalid');$('#discard').hidden=true;
  listView.hidden=true;editView.hidden=false;preview();$('#destination').focus();
 }
 function back(){editView.hidden=true;listView.hidden=false;$('#discard').hidden=true;render();$('#'+focusId)?.focus();active=null;draft=null;original=null;}
 form.addEventListener('input',preview);form.addEventListener('change',preview);
 form.addEventListener('submit',e=>{
  e.preventDefault();const v=validate(true);
  if(!v.valid){(v.error?$('#destination'):$('#cta-label')).focus();return;}
  Object.assign(active,read());active.source='ร่างจำลองในหน่วยความจำ รีเฟรชแล้วคืนค่าเดิม ไม่ได้เผยแพร่';
  $('#session-status').textContent='เก็บร่างจำลองเฉพาะหน้านี้แล้ว ดูแถวที่แก้ไขได้ด้านบน เว็บไซต์จริงไม่เปลี่ยน';back();
 });
 $('#cancel-edit').addEventListener('click',()=>{if(dirty()){$('#discard').hidden=false;$('#continue-edit').focus();}else back();});
 $('#continue-edit').addEventListener('click',()=>{$('#discard').hidden=true;$('#destination').focus();});
 $('#discard-edit').addEventListener('click',back);
 const setEmpty=empty=>{list.hidden=empty;$('#empty-state').hidden=!empty;$('#empty-toggle').textContent=empty?'กลับไปรายการตัวอย่าง':'ดูตัวอย่างรายการว่าง';if(empty)$('#restore-list').focus();};
 $('#empty-toggle').addEventListener('click',()=>setEmpty(!list.hidden));
 $('#restore-list').addEventListener('click',()=>{setEmpty(false);$('#empty-toggle').focus();});
 render();listView.hidden=false;
})();
