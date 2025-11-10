/* center-slider.js  — slider “center mode” (bucle, autoplay, flechas, dots, drag) */
(function initCenterSlider(){
  const root = document.getElementById('promoSlider');
  if(!root) return;

  const viewport = root.querySelector('.cs-viewport');
  const track    = root.querySelector('.cs-track');
  const slides   = Array.from(track.children);
  const prevBtn  = root.querySelector('.cs-prev');
  const nextBtn  = root.querySelector('.cs-next');
  const dotsBox  = root.querySelector('.cs-dots');

  // Dots
  slides.forEach((_,i)=>{
    const d=document.createElement('button');
    d.className='cs-dot'; d.type='button'; d.setAttribute('aria-label', `Ir al slide ${i+1}`);
    d.addEventListener('click', ()=> goTo(i));
    dotsBox.appendChild(d);
  });
  const dots = Array.from(dotsBox.children);

  let index = 0;
  let autoplay = null;
  const GAP = 20; // igual que en CSS .cs-track gap:20px
  const slideW = () => slides[0].getBoundingClientRect().width;

  function setActive(){
    slides.forEach((s,i)=> s.classList.toggle('is-active', i===index));
    dots.forEach  ((d,i)=> d.classList.toggle('is-active', i===index));
  }
  function translate(i, animate=true){
    const w = slideW();
    const offset = (viewport.clientWidth - w)/2;
    const x = - (i * (w + GAP)) + offset;
    if(!animate){
      track.style.transition='none';
      track.style.transform = `translate3d(${x}px,0,0)`;
      void track.offsetWidth; // reflow
      track.style.transition='';
    } else {
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
  }
  function goTo(i, animate=true){ index = (i + slides.length) % slides.length; translate(index, animate); setActive(); }
  function next(){ goTo(index+1); }
  function prev(){ goTo(index-1); }

  // autoplay
  function play(){ if(!autoplay) autoplay = setInterval(next, 3800); }
  function pause(){ clearInterval(autoplay); autoplay=null; }

  // eventos
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  root.addEventListener('mouseenter', pause);
  root.addEventListener('mouseleave', play);
  viewport.addEventListener('focusin', pause);
  viewport.addEventListener('focusout', play);

  // drag / swipe
  let startX=null, startTx=0;
  viewport.addEventListener('pointerdown', e=>{
    viewport.setPointerCapture(e.pointerId);
    pause(); startX = e.clientX;
    const m = /matrix\(1, 0, 0, 1, (-?\d+(\.\d+)?), 0\)|translate3d\((-?\d+(\.\d+)?)px/.exec(getComputedStyle(track).transform);
    startTx = m ? parseFloat(m[1] ?? m[3]) : 0;
    track.style.transition='none';
  });
  viewport.addEventListener('pointermove', e=>{
    if(startX===null) return;
    const dx = e.clientX - startX;
    track.style.transform = `translate3d(${startTx + dx}px,0,0)`;
  });
  function endDrag(e){
    if(startX===null) return;
    const dx = e.clientX - startX;
    track.style.transition='';
    const threshold = slideW()*0.18;
    if(dx < -threshold) next();
    else if(dx > threshold) prev();
    else goTo(index);
    startX=null; play();
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // resize & motion
  const ro = new ResizeObserver(()=> goTo(index, false));
  ro.observe(viewport);
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', ()=> mq.matches ? pause() : play());

  // init
  goTo(0, false);
  if(!mq.matches) play();
})();
