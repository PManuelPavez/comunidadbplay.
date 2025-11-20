import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

  const supabase = createClient(
    "https://mkplcvwomznyyqniiwqt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcGxjdndvbXpueXlxbmlpd3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjY0MzMsImV4cCI6MjA3ODcwMjQzM30.Ckauv0DBuiHoXjFeZlmwgugtuuipw3VEYCA6lWuvYWo"
);

  // Guarda la visita al cargar la página
  async function trackPromoVisit() {
    const prov = localStorage.getItem('bp.province') || 'desconocido';
    const res = await supabase.from('promos_visitas').insert([{ provincia: prov }]);
    if (res.error) {
      console.error('Error al registrar visita:', res.error.message);
    } else {
      console.log('✔ Visita registrada en Supabase');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    trackPromoVisit();
  });
(function () {
  const s = document.getElementById("promoSlider");
  if (!s || s.dataset.init) return;
  s.dataset.init = "1";

  const wrap = s.querySelector(".slides");
  const dotsWrap = s.querySelector(".dots");

  // 3 slides exactos
  let slides = Array.from(wrap.children)
    .filter((el) => el.classList.contains("slide"))
    .slice(0, 3);
  wrap.innerHTML = "";
  slides.forEach((el) => wrap.appendChild(el));

  // Estado
  let idx = 0,
    timer = null,
    hover = false,
    delay = 9000;
  slides[idx].classList.add("is-active");

  // Dots
  dotsWrap.innerHTML = "";
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot" + (i === idx ? " is-active" : "");
    b.setAttribute("aria-label", `Ir al slide ${i + 1}`);
    b.addEventListener("click", () => go(i, true));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  // Panel VIP sincronizado
  const info = document.getElementById("promoInfo");
  const infos = info ? Array.from(info.querySelectorAll(".info")) : [];

  function syncInfo() {
    const id = slides[idx].id; // joker | primer-deposito | referidos
    infos.forEach((a) => a.classList.toggle("is-active", a.dataset.for === id));
  }

  function go(n, user) {
    slides[idx].classList.remove("is-active");
    dots[idx].classList.remove("is-active");
    idx = (n + slides.length) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx].classList.add("is-active");
    syncInfo();
    if (user) restart();
  }

  function start() {
    timer = setInterval(() => {
      if (!hover) go(idx + 1);
    }, delay);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function restart() {
    stop();
    start();
  }

  s.addEventListener("mouseenter", () => (hover = true));
  s.addEventListener("mouseleave", () => (hover = false));

  // Swipe
  let sx = 0;
  s.addEventListener("pointerdown", (e) => {
    sx = e.clientX;
    s.setPointerCapture(e.pointerId);
  });
  s.addEventListener("pointerup", (e) => {
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 40) {
      go(idx + (dx < 0 ? 1 : -1), true);
    }
    sx = 0;
  });

  syncInfo();
  start();
})();