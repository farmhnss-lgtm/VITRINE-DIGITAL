/* Vitrine Digital V1 - painel */
const cfg = window.SUPABASE_CONFIG || {};
const hasSupabase = !!(cfg.url && cfg.key && !cfg.url.includes("SEU-PROJETO"));
const db = hasSupabase && window.supabase ? window.supabase.createClient(cfg.url, cfg.key) : null;

const demo = {
  screens: JSON.parse(localStorage.getItem("vd_screens") || "[]"),
  media: JSON.parse(localStorage.getItem("vd_media") || "[]"),
  playlists: JSON.parse(localStorage.getItem("vd_playlists") || "[]"),
  schedules: JSON.parse(localStorage.getItem("vd_schedules") || "[]")
};
function saveDemo(){ for(const k of Object.keys(demo)) localStorage.setItem("vd_"+k, JSON.stringify(demo[k])); }

function qs(s){return document.querySelector(s)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

document.querySelectorAll(".nav").forEach(n=>n.onclick=()=> {
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));
  n.classList.add("active"); qs("#"+n.dataset.section).classList.add("active"); render();
});
qs("#refreshBtn").onclick=render;

async function load(table, fallback){
  if(!db) return demo[fallback];
  const {data,error}=await db.from(table).select("*").order("created_at",{ascending:false});
  if(error){console.warn(error); return []}
  return data||[];
}
async function render(){
  const screens=await load("screens","screens"), media=await load("media","media"), playlists=await load("playlists","playlists"), schedules=await load("schedules","schedules");
  qs("#statScreens").textContent=screens.length;
  qs("#statOnline").textContent=screens.filter(s=>s.status==="online").length;
  qs("#statMedia").textContent=media.length;
  qs("#statPlaylists").textContent=playlists.length;
  qs("#modeLabel").textContent=db?"SUPABASE":"DEMO LOCAL";
  qs("#screensBody").innerHTML=screens.map(s=>`<tr><td>${esc(s.name)}</td><td><code>${esc(s.code)}</code></td><td>${esc(s.location||"")}</td><td>${s.status==="online"?"🟢 Online":"⚪ Offline"}</td><td>${esc(s.playlist_id||"—")}</td></tr>`).join("")||emptyRow(5,"Nenhuma tela cadastrada.");
  qs("#mediaBody").innerHTML=media.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.type)}</td><td>${esc(m.duration||10)}s</td><td>${m.file_url?`<a href="${esc(m.file_url)}" target="_blank">Abrir</a>`:"—"}</td></tr>`).join("")||emptyRow(4,"Nenhum conteúdo.");
  qs("#playlistsBody").innerHTML=playlists.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.item_count??"—")}</td><td>${p.active?"Ativa":"Inativa"}</td></tr>`).join("")||emptyRow(3,"Nenhuma playlist.");
  qs("#schedulesBody").innerHTML=schedules.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.playlist_id)}</td><td>${esc(s.start_time||"")}–${esc(s.end_time||"")}</td><td>${esc(s.days||"Todos")}</td></tr>`).join("")||emptyRow(4,"Nenhuma programação.");
}
function emptyRow(n,text){return `<tr><td colspan="${n}" class="muted">${text}</td></tr>`}

function openModal(title,body){qs("#modalTitle").textContent=title;qs("#modalBody").innerHTML=body;qs("#modal").classList.remove("hidden")}
qs("#closeModal").onclick=()=>qs("#modal").classList.add("hidden");
qs("#modal").onclick=e=>{if(e.target.id==="modal")qs("#modal").classList.add("hidden")};

qs("#addScreenBtn").onclick=()=>openModal("Adicionar tela",`
<form id="screenForm" class="form">
<label>Nome<input name="name" required placeholder="Totem 01"></label>
<label>Código<input name="code" required placeholder="TV-0001"></label>
<label>Local<input name="location" placeholder="Loja São Fernandes"></label>
<button class="btn">Salvar</button></form>`);
qs("#addMediaBtn").onclick=()=>openModal("Adicionar conteúdo",`
<form id="mediaForm" class="form">
<label>Nome<input name="name" required placeholder="Campanha 01"></label>
<label>Tipo<select name="type"><option value="image">Imagem</option><option value="video">Vídeo</option></select></label>
<label>URL do arquivo<input name="url" placeholder="https://..."></label>
<label>Duração (segundos)<input name="duration" type="number" min="1" value="10"></label>
<button class="btn">Salvar</button></form>`);
qs("#addPlaylistBtn").onclick=()=>openModal("Nova playlist",`
<form id="playlistForm" class="form">
<label>Nome<input name="name" required placeholder="Campanha Loja"></label>
<button class="btn">Salvar</button></form>`);
qs("#addScheduleBtn").onclick=()=>openModal("Nova programação",`
<form id="scheduleForm" class="form">
<label>Nome<input name="name" required placeholder="Campanha manhã"></label>
<label>Playlist ID<input name="playlist_id" required placeholder="UUID da playlist"></label>
<label>Início<input name="start_time" type="time" value="08:00"></label>
<label>Fim<input name="end_time" type="time" value="18:00"></label>
<label>Dias<input name="days" value="Seg,Ter,Qua,Qui,Sex"></label>
<button class="btn">Salvar</button></form>`);

document.addEventListener("submit",async e=>{
  if(!["screenForm","mediaForm","playlistForm","scheduleForm"].includes(e.target.id))return;
  e.preventDefault(); const f=new FormData(e.target);
  if(e.target.id==="screenForm"){
    const row={name:f.get("name"),code:f.get("code"),location:f.get("location"),status:"offline"};
    if(db) await db.from("screens").insert(row); else demo.screens.push({id:crypto.randomUUID(),...row,created_at:new Date().toISOString()});
  } else if(e.target.id==="mediaForm"){
    const row={name:f.get("name"),type:f.get("type"),file_url:f.get("url"),duration:Number(f.get("duration")||10),active:true};
    if(db) await db.from("media").insert(row); else demo.media.push({id:crypto.randomUUID(),...row,created_at:new Date().toISOString()});
  } else if(e.target.id==="playlistForm"){
    const row={name:f.get("name"),active:true};
    if(db) await db.from("playlists").insert(row); else demo.playlists.push({id:crypto.randomUUID(),...row,item_count:0,created_at:new Date().toISOString()});
  } else {
    const row={name:f.get("name"),playlist_id:f.get("playlist_id"),start_time:f.get("start_time"),end_time:f.get("end_time"),days:f.get("days"),active:true};
    if(db) await db.from("schedules").insert(row); else demo.schedules.push({id:crypto.randomUUID(),...row,created_at:new Date().toISOString()});
  }
  saveDemo(); qs("#modal").classList.add("hidden"); render();
});
render();
