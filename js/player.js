(function(){
  'use strict';
  const cfg=window.SUPABASE_CONFIG||{};
  const hasConfig=cfg.url && cfg.key && !String(cfg.url).includes('SEU-PROJETO') && !String(cfg.key).includes('SUA_PUBLISHABLE');
  const root=document.getElementById('playerRoot');
  const stage=document.getElementById('stage');
  const status=document.getElementById('status');
  const empty=document.getElementById('empty');
  const emptyMessage=document.getElementById('emptyMessage');
  const startBtn=document.getElementById('startBtn');
  const fullscreenBtn=document.getElementById('fullscreenBtn');
  const params=new URLSearchParams(location.search);
  const pathOrientation=location.pathname.toLowerCase().includes('/portrait/')?'portrait':'';
  const code=(params.get('code')||localStorage.getItem('vitrine_screen_code')||'TV-0001').trim();
  localStorage.setItem('vitrine_screen_code',code);
  let supabase=null, screen=null, items=[], index=0, timer=null, heartbeatTimer=null, reloadTimer=null, started=false;

  const ua=navigator.userAgent||'';
  const isSamsung=/SMART-TV|Tizen|SamsungBrowser/i.test(ua);
  const isAndroid=/Android/i.test(ua);
  const isTCL=/TCL|AFT|GoogleTV|Android TV/i.test(ua);
  const platform=isSamsung?'Samsung/Tizen':(isTCL||isAndroid?'Android/Google TV/TCL':'Web');

  function applyOrientation(orientation){
    const value=(orientation||'landscape').toLowerCase()==='portrait'?'portrait':'landscape';
    root.classList.remove('portrait','landscape');
    root.classList.add(value);
    document.documentElement.dataset.orientation=value;
  }

  function setStatus(text,show=true){status.textContent=text+(code?' • '+code:'');status.classList.toggle('visible',show);if(show)setTimeout(()=>status.classList.remove('visible'),2500)}
  function showEmpty(msg){emptyMessage.textContent=msg;empty.hidden=false}
  function hideEmpty(){empty.hidden=true}
  function clearStage(){if(timer)clearTimeout(timer);timer=null;stage.innerHTML=''}

  async function requestFullscreen(){
    try{if(document.fullscreenElement)return;if(root.requestFullscreen)await root.requestFullscreen();else if(root.webkitRequestFullscreen)root.webkitRequestFullscreen();}catch(e){}
  }

  async function startPlayback(){
    started=true;startBtn.textContent='Reproduzindo';startBtn.disabled=true;root.classList.add('kiosk');await requestFullscreen();playNext();
  }
  startBtn.addEventListener('click',startPlayback);
  fullscreenBtn.addEventListener('click',requestFullscreen);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!started)startPlayback()});

  function normalizeItems(rows){return (rows||[]).map(r=>({id:r.id,type:r.media?.type||r.type||'text',url:r.media?.file_url||r.file_url||'',text:r.media?.text_content||r.text_content||r.name||'',duration:Number(r.duration||r.media?.duration||8)})).filter(x=>x.type==='text'||x.url)}

  function playNext(){
    clearStage();
    if(!items.length){showEmpty('Nenhum conteúdo disponível para esta tela.');setTimeout(playNext,5000);return}
    hideEmpty();const item=items[index%items.length];index=(index+1)%items.length;
    if(item.type==='video'){
      const v=document.createElement('video');v.src=item.url;v.autoplay=true;v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.controls=false;stage.appendChild(v);
      let finished=false;const next=()=>{if(finished)return;finished=true;playNext()};v.addEventListener('ended',next);v.addEventListener('error',()=>setTimeout(next,1000));v.play().catch(()=>{startBtn.disabled=false;startBtn.textContent='Toque/OK para iniciar';setStatus('Aguardando início do vídeo',true);});
      timer=setTimeout(next,Math.max(5, item.duration||30)*1000);
    } else if(item.type==='image'){
      const img=document.createElement('img');img.src=item.url;img.alt=item.text||'Conteúdo';img.loading='eager';stage.appendChild(img);timer=setTimeout(playNext,Math.max(2,item.duration||8)*1000);
    } else {
      const div=document.createElement('div');div.className='slide-text';div.textContent=item.text||'Vitrine Digital';stage.appendChild(div);timer=setTimeout(playNext,Math.max(2,item.duration||8)*1000);
    }
  }

  function demo(){
    items=[
      {type:'text',text:'Vitrine Digital',duration:5},
      {type:'text',text:'Sua marca aparecendo todos os dias.',duration:5},
      {type:'text',text:'PLAYER MULTIPLATAFORMA • '+platform,duration:5}
    ];setStatus('Modo demonstração • '+platform);startPlayback();
  }

  async function loadOnline(){
    supabase=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await supabase.from('screens').select('*').eq('code',code).eq('active',true).maybeSingle();
    if(error)throw error;if(!data)throw new Error('Tela não encontrada');screen=data;
    applyOrientation(pathOrientation || data.orientation || 'landscape');
    await heartbeat();await loadPlaylist();
    heartbeatTimer=setInterval(heartbeat,30000);reloadTimer=setInterval(loadPlaylist,60000);
    setStatus('Online • '+platform);
    startBtn.disabled=false;
  }
  async function heartbeat(){if(!supabase||!screen)return;try{await supabase.from('screens').update({status:'online',ultima_conexao:new Date().toISOString(),player_version:'2.2'}).eq('id',screen.id)}catch(e){setStatus('Sem sincronização');}}
  async function loadPlaylist(){
    if(!screen||!supabase)return;
    const {data,error}=await supabase.from('playlist_items').select('id,position,duration,media:media_id(id,type,file_url,text_content,name,duration,active)').eq('playlist_id',screen.playlist_id).order('position',{ascending:true});
    if(error)throw error;items=normalizeItems((data||[]).filter(x=>x.media&&x.media.active!==false));index=0;if(started)playNext();
  }

  async function boot(){
    applyOrientation(pathOrientation || params.get('orientation') || 'landscape');
    setStatus('Player V2.2 • '+platform);
    if(!hasConfig){demo();return}
    try{await loadOnline();startPlayback()}catch(e){console.error(e);showEmpty('Não foi possível conectar. Verifique a internet e a configuração.');setStatus('Offline • '+platform,true);setTimeout(()=>{if(!started)demo()},4000)}
  }
  boot();
})();
