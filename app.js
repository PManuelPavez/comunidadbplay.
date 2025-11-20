(() => {
  // ===== Menú hamburguesa =====
  const body = document.body;
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobileMenu');
  function openMenu(){ body.classList.add('menu-open'); menu?.removeAttribute('hidden'); toggle?.setAttribute('aria-expanded','true'); }
  function closeMenu(){ body.classList.remove('menu-open'); menu?.setAttribute('hidden',''); toggle?.setAttribute('aria-expanded','false'); }
  toggle?.addEventListener('click', () => (body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  menu?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu(); });

  // ===== Reloj (hh:mm) =====
  const clockEl = document.getElementById('clock');
  function tick(){ if (!clockEl) return; const n = new Date(); clockEl.textContent = n.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }
  tick(); setInterval(tick, 1000);

  // ===== Registro por jurisdicción =====
  const REG = {
    "BUENOS AIRES":"https://pba.bplay.bet.ar/register?memberid=10163&sourceid=73",
    "CABA":"https://caba.bplay.bet.ar/register?memberid=37&sourceid=14",
    "CIUDAD AUTONOMA DE BUENOS AIRES":"https://caba.bplay.bet.ar/register?memberid=37&sourceid=14",
    "SANTA FE":"https://santafe.bplay.bet.ar/register?memberid=10154&sourceid=12",
    "CORDOBA":"https://cordoba.bplay.bet.ar/register?memberid=21&sourceid=6",
    "MENDOZA":"https://mendoza.bplay.bet.ar/register?memberid=33&sourceid=6"
  };
  const DEF = "https://www.bplay.bet.ar/registro";
  const regLinks = document.querySelectorAll('[data-register-link]');
  const setReg = (p) => { const url = REG[(p||'').toUpperCase()] || DEF; regLinks.forEach(a => a.href = url); };
  (() => {
    const h = location.host.toUpperCase();
    if (h.includes("CABA")) setReg("CABA");
    else if (h.includes("SANTAFE")) setReg("SANTA FE");
    else if (h.includes("CORDOBA")) setReg("CORDOBA");
    else if (h.includes("MENDOZA")) setReg("MENDOZA");
    else if (h.includes("PBA")) setReg("BUENOS AIRES");
    else setReg(null);
  })();

  // ===== Ubicación legible (no coordenadas) =====
  const geoEl = document.getElementById('geo');
  async function reverseGeocode(lat, lon){
    try{
      const u = new URL("https://nominatim.openstreetmap.org/reverse");
      u.searchParams.set("format","jsonv2");
      u.searchParams.set("lat",lat); u.searchParams.set("lon",lon);
      u.searchParams.set("zoom","10"); u.searchParams.set("accept-language","es");
      const r = await fetch(u, { headers:{ "User-Agent":"bplay-help/1.0", "Referer": location.origin }});
      if (!r.ok) throw 0;
      const d = await r.json(), a = d.address || {};
      const prov = a.state || a.region || a.province || "", city = a.city || a.town || a.village || "";
      const label = prov ? (city ? `${city}, ${prov}` : prov) : (city || "Argentina");
      geoEl && (geoEl.textContent = label);
      if (prov){
        let k = prov.toUpperCase();
        if (k.includes("BUENOS AIRES") && !k.includes("AUTÓNOMA")) k = "BUENOS AIRES";
        if (k.includes("AUTONOMA") || k.includes("AUTÓNOMA")) k = "CABA";
        if (k.includes("SANTA FE")) k = "SANTA FE";
        if (k.includes("CORDOBA") || k.includes("CÓRDOBA")) k = "CORDOBA";
        if (k.includes("MENDOZA")) k = "MENDOZA";
        setReg(k);
      }
    }catch(e){ geoEl && !geoEl.textContent && (geoEl.textContent = "Argentina"); }
  }
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      p => reverseGeocode(p.coords.latitude, p.coords.longitude),
      () => { geoEl && (geoEl.textContent = "Argentina"); },
      { enableHighAccuracy:false, timeout:3000, maximumAge:600000 }
    );
  } else { geoEl && (geoEl.textContent = "Argentina"); }

  // ===== Modales YT =====
  const YT = { promos:"Y4oIwbRD6kk", depositos:"fOHKlUBGsaI", identidad:"esIjo3nCNc8", retiros:"cRu3etHQErw" };
  const map = {
    "modal-depositos": YT.depositos,
    "modal-retiros":   YT.retiros,
    "modal-promos":    YT.promos,
    "modal-identidad": YT.identidad,
    "modal-problemas": YT.retiros
  };
  function openModal(id, vid){
    const m = document.getElementById(id); if (!m) return;
    const f = m.querySelector('iframe[data-yt]');
    if (f && vid) f.src = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
    m.hidden = false; document.documentElement.style.overflow = "hidden";
  }
  function closeModal(el){
    const m = el.closest('.overlay'); if (!m) return;
    const f = m.querySelector('iframe[data-yt]'); if (f) f.src = "";
    m.hidden = true; document.documentElement.style.overflow = "";
  }
  document.addEventListener('click',e=>{
    if (e.target.matches('[data-close]') || e.target.classList.contains('overlay')) closeModal(e.target);
  });
  document.addEventListener('keydown',e=>{
    if (e.key === 'Escape'){ document.querySelectorAll('.overlay:not([hidden])').forEach(ov=>{ const b=ov.querySelector('[data-close]')||ov; closeModal(b); }); }
  });
  const bind = (sel,cb)=> document.querySelectorAll(sel).forEach(a=>a.addEventListener('click',e=>{e.preventDefault(); cb();}));
  bind('a[href="#deposito-retiro"]', ()=>openModal('modal-depositos', YT.depositos));
  bind('a[href="#promociones"]',      ()=>openModal('modal-promos',    YT.promos));
  bind('a[href="#contacto-soporte"]', ()=>openModal('modal-problemas', YT.retiros));
  document.querySelectorAll('.cat-card[data-target]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.getAttribute('data-target'); openModal(id, map[id]);
    });
  });
})();
/* ================= Carousel 3-up continuo ================= */
(function initCarousel(){
  const root = document.getElementById('promoCarousel');
  if(!root) return;

  const viewport = root.querySelector('.car-viewport');
  const track = root.querySelector('.car-track');
  const prevBtn = root.querySelector('.car-btn--prev');
  const nextBtn = root.querySelector('.car-btn--next');

  // Duplicamos hasta cubrir +2 anchos de viewport (loop suave)
  const baseSlides = Array.from(track.children);
  function cloneToFill(){
    const vw = viewport.clientWidth;
    const slideW = baseSlides[0].getBoundingClientRect().width + gap();
    const need = Math.ceil((vw * 2.2) / slideW); // factor “buffer”
    for(let i=0;i<need;i++){
      baseSlides.forEach(s => track.appendChild(s.cloneNode(true)));
    }
  }
  // gap entre slides (leer del CSS)
  function gap(){
    const cs = getComputedStyle(track);
    return parseFloat(cs.columnGap || cs.gap || '16');
  }

  let x = 0;
  let speed = 48; // px por segundo (ajustá gusto)
  let raf = null;
  let last = performance.now();

  function step(now){
    const dt = (now - last) / 1000;
    last = now;
    x -= speed * dt;
    // Cuando el primer slide sale completamente por la izquierda, lo mandamos al final y corregimos x
    const first = track.children[0];
    const rect = first.getBoundingClientRect();
    const slideW = rect.width + gap();
    if(Math.abs(x) >= slideW){
      track.appendChild(first);
      x += slideW;
    }
    track.style.transform = `translate3d(${x}px,0,0)`;
    raf = requestAnimationFrame(step);
  }

  function play(){ if(!raf){ last = performance.now(); raf = requestAnimationFrame(step); } }
  function pause(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }

  // Controles (empujoncito manual)
  function nudge(dir){
    // empuje discreto de 1 slide
    const slideW = track.children[0].getBoundingClientRect().width + gap();
    // animación breve
    const target = x + dir * -slideW;
    const start = x;
    const dur = 300;
    const t0 = performance.now();
    pause();
    (function anim(t){
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      x = start + (target - start) * ease;
      track.style.transform = `translate3d(${x}px,0,0)`;
      if(p < 1){ requestAnimationFrame(anim); } else { play(); }
    })(t0);
  }

  // Pausa en hover y foco
  viewport.addEventListener('mouseenter', pause);
  viewport.addEventListener('mouseleave', play);
  viewport.addEventListener('focusin', pause);
  viewport.addEventListener('focusout', play);

  // Botones
  prevBtn.addEventListener('click', ()=>nudge(-1));
  nextBtn.addEventListener('click', ()=>nudge(1));

  // Drag / swipe básico
  let dragX = null;
  viewport.addEventListener('pointerdown', (e)=>{ dragX = e.clientX; pause(); viewport.setPointerCapture(e.pointerId); });
  viewport.addEventListener('pointermove', (e)=>{
    if(dragX===null) return;
    const dx = e.clientX - dragX;
    x += dx;
    dragX = e.clientX;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
  viewport.addEventListener('pointerup', (e)=>{ dragX=null; play(); });
  viewport.addEventListener('pointercancel', ()=>{ dragX=null; play(); });

  // Reflow/resize
  function setup(){
    pause(); track.style.transform='translate3d(0,0,0)'; x=0;
    // limpiar clones previos si los hubiera
    while(track.children.length > baseSlides.length){
      track.removeChild(track.lastElementChild);
    }
    cloneToFill(); play();
  }
  setup();
  new ResizeObserver(setup).observe(viewport);

  // Respeta preferencias de movimiento reducido
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', ()=> mq.matches ? pause() : play());
  if(mq.matches) pause();
})();
/* ===== UTIL ===== */
const $ = (q, ctx=document) => ctx.querySelector(q);
const $$ = (q, ctx=document) => Array.from(ctx.querySelectorAll(q));

/* ===== HAMBURGUESA ===== */
(() => {
  const body=document.body, t=$('.nav-toggle'), m=$('#mobileMenu');
  if(!t || !m) return;
  const open=()=>{ body.classList.add('menu-open'); m.hidden=false; t.setAttribute('aria-expanded','true'); };
  const close=()=>{ body.classList.remove('menu-open'); m.hidden=true; t.setAttribute('aria-expanded','false'); };
  t.addEventListener('click', ()=> body.classList.contains('menu-open') ? close() : open());
  m.addEventListener('click', e=>{ if(e.target.closest('a')) close(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
})();

/* ===== RELOJ ===== */
(() => {
  const clock = $('#clock');
  const tick = () => { if (!clock) return; const n=new Date();
    clock.textContent = n.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  };
  tick(); setInterval(tick, 1000);
})();

/* ===== SLIDER ===== */
function initSlider(root){
  const wrap = root.querySelector('.slides'); if(!wrap) return;
  const slides = $$('.slide', wrap);
  const dots = root.querySelector('.dots');
  if(dots){
    dots.innerHTML = slides.map((_,i)=>`<button aria-label="Ir al slide ${i+1}"></button>`).join('');
  }
  const btns = dots ? $$('.dots button', root) : [];
  const to = idx => { wrap.scrollTo({left: wrap.clientWidth*idx, behavior:'smooth'}); };
  btns.forEach((b,i)=> b.addEventListener('click', ()=> to(i)));
  const activate = () => {
    const i = Math.round(wrap.scrollLeft / wrap.clientWidth);
    btns.forEach((b,j)=> b.classList.toggle('is-active', j===i));
  };
  wrap.addEventListener('scroll', () => requestAnimationFrame(activate));
  activate();
}
$$('[data-slider]').forEach(initSlider);

/* ===== FAB ===== */
(() => {
  const fab = document.querySelector('[data-fab]');
  if(!fab) return;
  const main = fab.querySelector('.fab__main');
  main.addEventListener('click', ()=> fab.classList.toggle('is-open'));
  // cerrar al hacer click fuera
  document.addEventListener('click', e=>{
    if(!fab.contains(e.target) && fab.classList.contains('is-open')) fab.classList.remove('is-open');
  });
})();

/* ===== REGISTRO POR JURISDICCIÓN + CBU ===== */
const REG = {
  "BUENOS AIRES": "https://pba.bplay.bet.ar/register?memberid=10163&sourceid=73",
  "CABA":          "https://caba.bplay.bet.ar/register?memberid=37&sourceid=14",
  "SANTA FE":      "https://santafe.bplay.bet.ar/register?memberid=10154&sourceid=12",
  "CORDOBA":       "https://cordoba.bplay.bet.ar/register?memberid=21&sourceid=6",
  "MENDOZA":       "https://mendoza.bplay.bet.ar/register?memberid=33&sourceid=6",
};
const DEF_REG = "https://www.bplay.bet.ar/registro";

const CBU = {
  "MENDOZA":      "0000061100000000049650",
  "SANTA FE":     "0000061100000000008387",
  "CORDOBA":      "0000061100000000025021",
  "CABA":         "0000061100000000008059",
  "BUENOS AIRES": "0000061100000000014997",
};

function normalizeProvince(raw=""){
  let k = raw.toUpperCase()
    .replaceAll("Á","A").replaceAll("É","E").replaceAll("Í","I").replaceAll("Ó","O").replaceAll("Ú","U");
  if (k.includes("AUTONOMA") && k.includes("BUENOS AIRES")) return "CABA";
  if (k.includes("CIUDAD AUTONOMA")) return "CABA";
  if (k.includes("CABA")) return "CABA";
  if (k.includes("BUENOS AIRES")) return "BUENOS AIRES";
  if (k.includes("SANTA FE")) return "SANTA FE";
  if (k.includes("CORDOBA")) return "CORDOBA";
  if (k.includes("MENDOZA")) return "MENDOZA";
  return null;
}

function setRegisterLinks(key){
  const url = REG[key] || DEF_REG;
  $$('[data-register-link]').forEach(a=> a.href = url);
  const el = document.getElementById('link-registro');
  if (el) el.title = `Registro → ${url} ${key?`(${key})`:"(default)"}`;
}

function renderBankBox(key, labelText){
  const box = document.getElementById('bankBox');
  if(!box) return;
  const geoLabel = document.getElementById('bankBoxGeo');
  const cbuEl = document.getElementById('bankCbu');
  const provSel = document.getElementById('provSel');

  const cbu = CBU[key] || "—";
  cbuEl.textContent = cbu;
  if (labelText) geoLabel.textContent = labelText;
  box.hidden = false;

  if (provSel){
    provSel.value = key || "";
    provSel.addEventListener('change', e=>{
      const k = e.target.value || null;
      renderBankBox(k, k ? `Provincia seleccionada: ${k}` : '(detectando ubicación…)');
    }, { once:true }); // se reatacha cada vez que renderiza
  }
}

(async () => {
  // por host
  const H = location.host.toUpperCase();
  if (H.includes("CABA")) setRegisterLinks("CABA");
  else if (H.includes("SANTAFE")) setRegisterLinks("SANTA FE");
  else if (H.includes("CORDOBA")) setRegisterLinks("CORDOBA");
  else if (H.includes("MENDOZA")) setRegisterLinks("MENDOZA");
  else if (H.includes("PBA") || H.includes("BUENOSAIRES")) setRegisterLinks("BUENOS AIRES");
  else setRegisterLinks(null);

  const geoEl = document.getElementById('geo');
  const onGeo = (prov, city) => {
    const label = prov ? (city ? `${city}, ${prov}` : prov) : (city || "Argentina");
    if (geoEl) geoEl.textContent = label;
    const key = normalizeProvince(prov || "");
    renderBankBox(key, label ? `Ubicación: ${label}` : '(detectando ubicación…)');
    setRegisterLinks(key);
  };

  // geolocalización + reverse geocoding
  async function reverseGeocode(lat, lon){
    try{
      const u = new URL("https://nominatim.openstreetmap.org/reverse");
      u.searchParams.set("format","jsonv2");
      u.searchParams.set("lat",lat); u.searchParams.set("lon",lon);
      u.searchParams.set("zoom","10");
      u.searchParams.set("accept-language","es");
      const r = await fetch(u, {headers:{ "User-Agent":"bplay-help/1.0", "Referer": location.origin }});
      if (!r.ok) throw 0;
      const d = await r.json();
      const a = d.address || {};
      onGeo(a.state || a.region || a.province || "", a.city || a.town || a.village || "");
    }catch(e){
      onGeo("", "");
    }
  }
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      p => reverseGeocode(p.coords.latitude, p.coords.longitude),
      () => onGeo("", ""),
      { enableHighAccuracy:false, timeout:3000, maximumAge:600000 }
    );
  } else {
    onGeo("", "");
  }
})();

/* ===== COPIAR AL PORTAPAPELES ===== */
document.addEventListener('click', async (e)=>{
  const btn = e.target.closest('[data-copy]');
  if(!btn) return;
  const sel = btn.getAttribute('data-copy');
  const el = document.querySelector(sel);
  const text = el?.textContent?.trim();
  if(!text) return;
  try{
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = 'Copiado ✓';
    setTimeout(()=> btn.textContent = old, 1100);
  }catch(err){
    alert('No se pudo copiar. Seleccioná y copiá manualmente.');
  }
});
function enableSwipe(sliderEl, onSwipeLeft, onSwipeRight){
  let sx = 0, sy = 0, locked = false;

  // start
  sliderEl.addEventListener('touchstart', (e)=>{
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY;
    locked = false;
  }, {passive:true});

  // move: si detectamos gesto horizontal dominante, prevenimos el scroll
  sliderEl.addEventListener('touchmove', (e)=>{
    if (e.touches.length !== 1) return;
    if (locked) { e.preventDefault(); return; }  // ya “tomamos” el gesto

    const t  = e.touches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;

    // umbral pequeño y prioridad a horizontal
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)){
      locked = true;
      e.preventDefault(); // <- evita el scroll nativo
    }
  }, {passive:false}); // importante: passive:false para poder prevenir

  // end: si hubo swipe horizontal real, navegamos
  sliderEl.addEventListener('touchend', (e)=>{
    if (!locked) return;
    const t  = e.changedTouches[0];
    const dx = t.clientX - sx;
    if (dx < -40) onSwipeLeft?.();   // siguiente
    else if (dx >  40) onSwipeRight?.(); // anterior
    locked = false;
  }, {passive:true});
}
/* === Guard de swipe: bloquea scroll horizontal nativo y llama a go() === */
function enableSwipe(el, onLeft, onRight){
  let sx = 0, sy = 0, taking = false;

  el.addEventListener('touchstart', (e)=>{
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY;
    taking = false;
  }, {passive:true});

  el.addEventListener('touchmove', (e)=>{
    if (e.touches.length !== 1) return;
    if (taking) { e.preventDefault(); return; }

    const t  = e.touches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;

    // si el gesto es mayormente horizontal, "tomamos" el control
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)){
      taking = true;
      e.preventDefault(); // <- clave para que no haga scroll nativo
    }
  }, {passive:false}); // importantísimo: passive:false

  el.addEventListener('touchend', (e)=>{
    if (!taking) return;
    const t  = e.changedTouches[0];
    const dx = t.clientX - sx;
    if (dx < -40) onLeft?.();   // siguiente
    else if (dx > 40) onRight?.(); // anterior
    taking = false;
  }, {passive:true});
}


/* ==== Registro/Login por jurisdicción – robusto para mobile y menús dinámicos ==== */
(function(){
  const REG = {
    "BUENOS AIRES":"https://pba.bplay.bet.ar/register?memberid=10163&sourceid=73",
    "CABA":"https://caba.bplay.bet.ar/register?memberid=37&sourceid=14",
    "SANTA FE":"https://santafe.bplay.bet.ar/register?memberid=10154&sourceid=12",
    "CORDOBA":"https://cordoba.bplay.bet.ar/register?memberid=21&sourceid=6",
    "MENDOZA":"https://mendoza.bplay.bet.ar/register?memberid=33&sourceid=6"
  };
  const LOGIN = {
    "BUENOS AIRES":"https://pba.bplay.bet.ar/login",
    "CABA":"https://caba.bplay.bet.ar/login",
    "SANTA FE":"https://santafe.bplay.bet.ar/login",
    "CORDOBA":"https://cordoba.bplay.bet.ar/login",
    "MENDOZA":"https://mendoza.bplay.bet.ar/login"
  };
  const DEF_REG   = "https://www.bplay.bet.ar/registro";
  const DEF_LOGIN = "https://www.bplay.bet.ar/login";

  const KEY_PROV="bp.province", KEY_TS="bp.province.ts", TTL=12*60*60*1000;

  const $all = sel => Array.from(document.querySelectorAll(sel));

  const normalize = (s="")=>{
    const k = String(s).toUpperCase()
      .replace(/Á/g,"A").replace(/É/g,"E").replace(/Í/g,"I").replace(/Ó/g,"O").replace(/Ú/g,"U").trim();
    if (k.includes("AUTONOMA") && k.includes("BUENOS AIRES")) return "CABA";
    if (k.includes("CIUDAD AUTONOMA")) return "CABA";
    if (k.includes("CABA")) return "CABA";
    if (k.includes("BUENOS AIRES")) return "BUENOS AIRES";
    if (k.includes("SANTA FE")) return "SANTA FE";
    if (k.includes("CORDOBA")) return "CORDOBA";
    if (k.includes("MENDOZA")) return "MENDOZA";
    return null;
  };

  const fromHost = ()=>{
    const H = location.host.toUpperCase();
    if (H.includes("CABA")) return "CABA";
    if (H.includes("SANTAFE")) return "SANTA FE";
    if (H.includes("CORDOBA")) return "CORDOBA";
    if (H.includes("MENDOZA")) return "MENDOZA";
    if (H.includes("PBA") || H.includes("BUENOSAIRES")) return "BUENOS AIRES";
    return null;
  };

  const fromHeaderGeo = ()=>{
    const t = document.getElementById('geo')?.textContent || "";
    // ejemplo: "Pergamino, Buenos Aires" -> "BUENOS AIRES"
    const seg = t.split(",").pop();
    return normalize(seg);
  };

  async function reverseGeocode(lat,lon){
    const u=new URL("https://nominatim.openstreetmap.org/reverse");
    u.searchParams.set("format","jsonv2");
    u.searchParams.set("lat",lat); u.searchParams.set("lon",lon);
    u.searchParams.set("zoom","10"); u.searchParams.set("accept-language","es");
    const r=await fetch(u,{headers:{ "User-Agent":"bplay-helper/1.0", "Referer": location.origin }});
    if(!r.ok) throw 0;
    const d=await r.json();
    return normalize(d.address?.state || d.address?.region || d.address?.province || "");
  }

  function paintLinks(prov){
    const reg = REG[prov]   || DEF_REG;
    const log = LOGIN[prov] || DEF_LOGIN;
    $all('[data-register-link]').forEach(a=>{ if(a) a.href = reg; });
    $all('[data-login-link]').forEach(a=>{ if(a) a.href = log;  });
  }

  function cacheProv(prov){
    if(!prov) return;
    localStorage.setItem(KEY_PROV, prov);
    localStorage.setItem(KEY_TS,  Date.now().toString());
  }

  async function detectProv(){
    // 0) window.bpProvince (por si otro módulo ya lo resolvió)
    if (window.bpProvince) { cacheProv(window.bpProvince); return window.bpProvince; }

    // 1) cache
    const ts=+(localStorage.getItem(KEY_TS)||0);
    const c = localStorage.getItem(KEY_PROV);
    if (c && (Date.now()-ts)<TTL) return c;

    // 2) header #geo inmediato
    const fromGeo = fromHeaderGeo();
    if (fromGeo){ cacheProv(fromGeo); return fromGeo; }

    // 3) host
    const host = fromHost();
    if (host){ cacheProv(host); return host; }

    // 4) geoloc (solo https)
    if (location.protocol==="https:" && navigator.geolocation){
      try{
        const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:3000,maximumAge:600000}));
        const prov = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (prov){ cacheProv(prov); return prov; }
      }catch(e){}
    }
    return null;
  }

  // Pinta algo ya, y vuelve a pintar al refinar
  (async function init(){
    // primera aproximación
    const seed = localStorage.getItem(KEY_PROV) || fromHeaderGeo() || fromHost();
    paintLinks(seed);
    // resolución final
    const prov = await detectProv();
    paintLinks(prov);
  })();

  // Si el usuario toca antes: garantizamos redirección correcta
  document.addEventListener('click', async (e)=>{
    const a = e.target.closest?.('[data-register-link],[data-login-link]');
    if(!a) return;

    // si ya apunta a un destino final conocido, no tocar
    const href=a.getAttribute('href')||"";
    const finals = new Set([...Object.values(REG), ...Object.values(LOGIN), DEF_REG, DEF_LOGIN]);
    if ([...finals].some(u => href.startsWith(u))) return;

    e.preventDefault();
    const prov = await detectProv();
    const url = a.matches('[data-register-link]') ? (REG[prov]||DEF_REG) : (LOGIN[prov]||DEF_LOGIN);
    a.href = url; // pinta para próximas veces
    location.href = url; // redirige ya
  }, {capture:true});

  // Menú hamburguesa / DOM dinámico: observa y repinta
  const mo = new MutationObserver(()=> {
    const prov = localStorage.getItem(KEY_PROV) || fromHeaderGeo() || fromHost();
    paintLinks(prov);
  });
  mo.observe(document.documentElement, {subtree:true, childList:true});
})();

