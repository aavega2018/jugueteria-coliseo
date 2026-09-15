(() => {
"use strict";
const USER="admin";
const PASS_HASH="65eca44cf34c2dedef78627c3b808d069e8d9b0bf4cd1aef5a8d851f786b4cb9";
const KEY="jugueteria_coliseo_admin_data_v3";
const SESSION="jugueteria_coliseo_admin_session_v3";
const $=id=>document.getElementById(id);
let data, editing=null, dirty=false;

function clone(x){return JSON.parse(JSON.stringify(x));}
function norm(raw){
 const d=clone(raw||{});
 d.negocio=d.negocio||{};
 d.categorias=Array.isArray(d.categorias)?d.categorias:[];
 d.productos=Array.isArray(d.productos)?d.productos:[];
 d.productos=d.productos.map(p=>({
  nombre:String(p.nombre??""), precio:Number(p.precio??0),
  categoria:String(p.categoria??""), imagen:String(p.imagen??""),
  descripcion:String(p.descripcion??""), activo:p.activo!==false
 }));
 return d;
}
function msg(t,type="ok"){
 const x=$("message"); if(!x)return;
 x.textContent=t; x.className="message show "+type;
 clearTimeout(msg.timer); msg.timer=setTimeout(()=>x.className="message",5000);
}
function load(){
 try{const s=localStorage.getItem(KEY); if(s)data=norm(JSON.parse(s));}
 catch(e){localStorage.removeItem(KEY);msg("No se pudo leer la copia local.","warn");}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));dirty=true;}catch(e){msg("No se pudo guardar en el navegador.","warn");}}
function fill(){
 const n=data.negocio;
 ["siteName","tagline","direccion","telefono1","telefono2","whatsapp","horario","facebook","instagram","mapa"]
 .forEach((id,i)=>$(id).value=n[["nombre","lema","direccion","telefono1","telefono2","whatsapp","horario","facebook","instagram","mapa"][i]]||"");
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function cats(selected=""){
 const s=$("pCategoria"); s.innerHTML='<option value="">Selecciona una categoría</option>';
 data.categorias.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;o.selected=c===selected;s.appendChild(o);});
}
function renderCats(){
 const l=$("categoryList");l.innerHTML="";
 data.categorias.forEach((c,i)=>{
  const n=data.productos.filter(p=>p.categoria===c).length;
  const li=document.createElement("li");
  li.innerHTML=`<div class="item-main"><strong>${esc(c)}</strong><small>${n} producto(s)</small></div>
  <div class="item-actions"><button type="button" class="btn-secondary" data-action="rename-cat" data-i="${i}">✏ Renombrar</button>
  <button type="button" class="btn-danger" data-action="delete-cat" data-i="${i}">🗑 Eliminar</button></div>`;
  l.appendChild(li);
 });cats($("pCategoria").value);
}
function renderProducts(){
 const l=$("productList");l.innerHTML="";
 data.productos.forEach((p,i)=>{
  const li=document.createElement("li");
  li.innerHTML=`<div class="item-main"><strong>${esc(p.nombre)}</strong>
  <small>CUP ${Number(p.precio||0).toLocaleString("es-CU",{minimumFractionDigits:2})} · ${esc(p.categoria||"Sin categoría")} · ${p.activo===false?"OCULTO":"ACTIVO"}</small></div>
  <div class="item-actions"><button type="button" class="btn-secondary" data-action="edit-product" data-i="${i}">✏ Editar</button>
  <button type="button" class="btn-secondary" data-action="duplicate-product" data-i="${i}">📋 Duplicar</button>
  <button type="button" class="btn-secondary" data-action="toggle-product" data-i="${i}">${p.activo===false?"👁 Mostrar":"🙈 Ocultar"}</button>
  <button type="button" class="btn-danger" data-action="delete-product" data-i="${i}">🗑 Eliminar</button></div>`;
  l.appendChild(li);
 });
}
function render(){fill();renderCats();renderProducts();}
async function sha(s){
 if(!crypto?.subtle)return "";
 const b=new TextEncoder().encode(s),d=await crypto.subtle.digest("SHA-256",b);
 return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function login(user,pass){
 const hash=await sha(pass);
 return user===USER && (hash?hash===PASS_HASH:pass==="Coliseo2026*");
}
function sessionOK(){
 try{const s=JSON.parse(sessionStorage.getItem(SESSION)||"null");return !!(s&&s.user===USER&&s.exp>Date.now());}catch(e){return false;}
}
function start(){sessionStorage.setItem(SESSION,JSON.stringify({user:USER,exp:Date.now()+30*60000}));}
function show(){load();$("loginScreen").hidden=true;$("adminApp").hidden=false;render();}
function logout(){$("adminApp").hidden=true;$("loginScreen").hidden=false;sessionStorage.removeItem(SESSION);$("loginPass").value="";}
function resetForm(){editing=null;$("formTitle").textContent="➕ Agregar producto";$("saveProductText").textContent="Agregar producto";$("cancelEdit").hidden=true;$("productForm").reset();$("pActivo").checked=true;cats();}
function download(){
 const text="// Datos de Juguetería Coliseo\n// Generado desde admin.html\nwindow.SITE_DATA = "+JSON.stringify(norm(data),null,2)+";\n";
 const a=document.createElement("a"),u=URL.createObjectURL(new Blob([text],{type:"application/javascript;charset=utf-8"}));
 a.href=u;a.download="data.js";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);dirty=false;msg("data.js generado. Reemplázalo en js/data.js de GitHub.");
}
function init(){
 $("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();$("loginError").textContent="Comprobando...";
  try{if(await login($("loginUser").value.trim(),$("loginPass").value)){start();$("loginError").textContent="";show();}
  else{$("loginError").textContent="Usuario o contraseña incorrectos.";$("loginPass").select();}}
  catch(err){console.error(err);$("loginError").textContent="Error del panel. Recarga la página.";}}
 });
 $("logoutBtn").onclick=()=>{if(!dirty||confirm("Hay cambios pendientes. ¿Cerrar sesión sin descargar data.js?"))logout();};
 $("saveSite").onclick=()=>{Object.assign(data.negocio,{nombre:$("siteName").value.trim(),lema:$("tagline").value.trim(),direccion:$("direccion").value.trim(),telefono1:$("telefono1").value.trim(),telefono2:$("telefono2").value.trim(),whatsapp:$("whatsapp").value.replace(/\D/g,""),horario:$("horario").value.trim(),facebook:$("facebook").value.trim(),instagram:$("instagram").value.trim(),mapa:$("mapa").value.trim()});save();render();msg("Datos del negocio guardados.");};
 $("categoryForm").onsubmit=e=>{e.preventDefault();const v=$("newCategory").value.trim().replace(/\s+/g," ");if(!v)return;if(data.categorias.some(c=>c.toLowerCase()===v.toLowerCase()))return msg("Esa categoría ya existe.","warn");data.categorias.push(v);$("newCategory").value="";save();render();msg("Categoría agregada.");};
 $("categoryList").onclick=e=>{const b=e.target.closest("button");if(!b)return;const i=+b.dataset.i,c=data.categorias[i];if(c==null)return;
  if(b.dataset.action==="rename-cat"){const v=prompt("Nuevo nombre de la categoría:",c);if(v===null)return;const n=v.trim().replace(/\s+/g," ");if(!n)return msg("El nombre no puede quedar vacío.","warn");if(data.categorias.some((x,j)=>j!==i&&x.toLowerCase()===n.toLowerCase()))return msg("Ya existe otra categoría.","warn");data.productos.forEach(p=>{if(p.categoria===c)p.categoria=n;});data.categorias[i]=n;save();render();msg("Categoría renombrada.");}
  if(b.dataset.action==="delete-cat"){if(data.productos.some(p=>p.categoria===c))return msg("No se puede eliminar: tiene productos asociados.","warn");if(confirm(`¿Eliminar la categoría "${c}"?`)){data.categorias.splice(i,1);save();render();msg("Categoría eliminada.");}}
 };
 $("productForm").onsubmit=e=>{e.preventDefault();const p={nombre:$("pNombre").value.trim(),precio:Number($("pPrecio").value),categoria:$("pCategoria").value,imagen:$("pImagen").value.trim(),descripcion:$("pDescripcion").value.trim(),activo:$("pActivo").checked};if(!p.nombre)return msg("El producto necesita un nombre.","warn");if(!Number.isFinite(p.precio)||p.precio<0)return msg("El precio no es válido.","warn");if(!p.categoria)return msg("Selecciona una categoría.","warn");if(!p.imagen)return msg("Indica la ruta de la imagen.","warn");if(editing===null){data.productos.push(p);msg("Producto agregado.");}else{data.productos[editing]=p;msg("Producto actualizado.");}save();render();resetForm();};
 $("cancelEdit").onclick=resetForm;
 $("pImagenFile").onchange=()=>{const f=$("pImagenFile").files[0];if(f){$("pImagen").value="img/"+f.name;msg("Ruta colocada. Sube también la imagen a img/ en GitHub.","warn");}};
 $("productList").onclick=e=>{const b=e.target.closest("button");if(!b)return;const i=+b.dataset.i,p=data.productos[i];if(!p)return;
  if(b.dataset.action==="edit-product"){editing=i;$("formTitle").textContent="✏ Editar producto";$("saveProductText").textContent="Guardar cambios";$("cancelEdit").hidden=false;$("pNombre").value=p.nombre;$("pPrecio").value=p.precio;cats(p.categoria);$("pImagen").value=p.imagen;$("pDescripcion").value=p.descripcion;$("pActivo").checked=p.activo!==false;$("productForm").scrollIntoView({behavior:"smooth"});}
  if(b.dataset.action==="duplicate-product"){data.productos.splice(i+1,0,{...p,nombre:p.nombre+" (copia)"});save();render();msg("Producto duplicado.");}
  if(b.dataset.action==="toggle-product"){p.activo=p.activo===false;save();render();msg(p.activo?"Producto visible.":"Producto ocultado.");}
  if(b.dataset.action==="delete-product"&&confirm(`¿Eliminar "${p.nombre}"?`)){data.productos.splice(i,1);save();render();resetForm();msg("Producto eliminado.");}
 };
 $("download").onclick=download;
 $("clearLocal").onclick=()=>{if(confirm("¿Restaurar datos originales de data.js?")){localStorage.removeItem(KEY);data=norm(window.SITE_DATA||{});dirty=false;resetForm();render();msg("Datos originales restaurados.");}};
 if(sessionOK())show();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();