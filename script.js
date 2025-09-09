// script.js - carrossel avançado com efeitos, autoplay, acessibilidade, swipe e barra de progresso
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel').forEach(initCarousel);

  function initCarousel(root) {
    const track = root.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.querySelectorAll('.slide'));
    if (slides.length === 0) return;

    const prevBtn = root.querySelector('.carousel-btn.prev');
    const nextBtn = root.querySelector('.carousel-btn.next');
    const dotsWrap = root.querySelector('.carousel-dots');

    // efeito configurável
    const effect = (root.dataset.effect || 'slide').toLowerCase();
    root.classList.add('carousel-enhanced', `effect-${effect}`);

    // acessibilidade
    root.setAttribute('role','region');
    root.setAttribute('aria-roledescription','carousel');
    track.setAttribute('role','list');
    slides.forEach((s,i)=>{
      s.setAttribute('role','group');
      s.setAttribute('aria-label', `Slide ${i+1} de ${slides.length}`);
      s.setAttribute('tabindex','-1');
      s.classList.add('carousel-item');
    });

    // config
    const defaultInterval = 100;
    const autoplayDelay = parseInt(root.dataset.interval, 10) || defaultInterval;
    const autoplayEnabled = root.dataset.autoplay === undefined ? true : (root.dataset.autoplay === 'true');

    let index = 0;
    let intervalId = null;
    let progressRaf = null;
    let progressStart = 0;

    slides.forEach(s => { s.style.minWidth = '100%'; });

    // dots
    const dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir para slide ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    // barra de progresso
    let progressBar = null;
    if (autoplayEnabled && root.dataset.progress !== 'false') {
      const wrap = document.createElement('div');
      wrap.className = 'carousel-progress';
      const bar = document.createElement('span');
      bar.className = 'carousel-progress-bar';
      wrap.appendChild(bar);
      root.appendChild(wrap);
      progressBar = bar;
    }

    function updateProgress(ts){
      if(!progressBar || !intervalId) return;
      if(!progressStart) progressStart = ts;
      const elapsed = ts - progressStart;
      const pct = Math.min(1, elapsed / autoplayDelay);
      progressBar.style.setProperty('--progress', (pct*100)+'%');
      if(pct >= 1) { progressStart = ts; }
      progressRaf = requestAnimationFrame(updateProgress);
    }
    function clearProgress(){
      if(progressRaf) cancelAnimationFrame(progressRaf);
      progressRaf = null; progressStart = 0;
      if(progressBar) progressBar.style.setProperty('--progress','0%');
    }

    function applyEffect(){
      if(effect === 'fade' || effect === 'zoom') {
        slides.forEach((s,i)=>{
          const active = i === index;
            s.classList.toggle('is-active', active);
            if(effect === 'fade') {
              s.style.opacity = active ? '1' : '0';
              s.style.transform = 'none';
            }
            if(effect === 'zoom') {
              s.style.opacity = active ? '1' : '0';
              s.style.transform = active ? 'scale(1)' : 'scale(.9)';
            }
        });
      } else {
        slides.forEach((s,i)=> s.classList.toggle('is-active', i===index));
      }
    }

    function updateAria(){
      slides.forEach((s,i)=>{
        const active = i===index;
          s.setAttribute('aria-hidden', active? 'false':'true');
          if(active) s.setAttribute('tabindex','0'); else s.setAttribute('tabindex','-1');
      });
      if(dots.length) dots.forEach((d,i)=> d.classList.toggle('active', i===index));
    }

    function update() {
      if(effect === 'slide') {
        track.style.transform = `translateX(-${index * 100}%)`;
      }
      applyEffect();
      updateAria();
    }

    function goTo(i) {
      index = ((i % slides.length) + slides.length) % slides.length;
      update();
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });

    // fallback teclado
    root.addEventListener('keydown', e=>{
      if(e.key==='ArrowRight'){ next(); resetAutoplay(); }
      if(e.key==='ArrowLeft'){ prev(); resetAutoplay(); }
    });

    // Garante estilos iniciais
    if(effect==='fade' || effect==='zoom') {
      slides.forEach(s=>{ s.style.position='absolute'; s.style.inset='0'; });
    }
    update();
    startAutoplay();

    return () => { stopAutoplay(); };
  }
});

(function(){
  // Patch rápido: reforça funcionamento de carrosséis caso algum listener tenha falhado
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.carousel').forEach(root => {
      if(root.__patched) return; // evita duplicar
      root.__patched = true;
      const track = root.querySelector('.carousel-track');
      if(!track) return;
      const slides = Array.from(track.querySelectorAll('.slide'));
      if(!slides.length) return;
      const prevBtn = root.querySelector('.carousel-btn.prev');
      const nextBtn = root.querySelector('.carousel-btn.next');
      const dotsWrap = root.querySelector('.carousel-dots');
      const effect = (root.dataset.effect || 'slide').toLowerCase();

      // Se script original já adicionou essas classes não duplica
      if(!root.classList.contains('carousel-enhanced')) {
        root.classList.add('carousel-enhanced', `effect-${effect}`);
      }

      let index = 0;
      let autoplayDelay = parseInt(root.dataset.interval||'3000',10);
      let autoplayEnabled = root.dataset.autoplay === undefined ? true : (root.dataset.autoplay === 'true');
      let intervalId = null;

      // Ajusta posicionamento para efeitos não-slide
      if(effect !== 'slide') {
        track.style.transform = 'none';
      }

      // (re)cria dots se estiver vazio
      let dots = [];
      if(dotsWrap && !dotsWrap.childElementCount) {
        slides.forEach((_,i)=>{
          const b=document.createElement('button');
          b.type='button'; b.className='carousel-dot'; b.setAttribute('aria-label',`Ir para slide ${i+1}`);
          b.addEventListener('click',()=>{ goTo(i); resetAutoplay(); });
          dotsWrap.appendChild(b); dots.push(b);
        });
      } else if(dotsWrap) { dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot')); }

      function applyEffect(){
        if(effect === 'fade' || effect === 'zoom') {
          slides.forEach((s,i)=>{
            const active = i===index;
            s.classList.toggle('is-active',active);
            s.style.opacity = active? '1':'0';
            if(effect === 'zoom') s.style.transform = active? 'scale(1)':'scale(.9)';
          });
        } else {
          track.style.transform = `translateX(-${index*100}%)`;
          slides.forEach((s,i)=> s.classList.toggle('is-active', i===index));
        }
      }

      function updateAria(){
        slides.forEach((s,i)=>{
          const active = i===index;
          s.setAttribute('aria-hidden', active? 'false':'true');
          s.tabIndex = active? 0 : -1;
        });
        if(dots.length) dots.forEach((d,i)=> d.classList.toggle('active', i===index));
      }

      function update(){ applyEffect(); updateAria(); }
      function goTo(i){ index = ((i % slides.length)+slides.length)%slides.length; update(); }
      function next(){ goTo(index+1); }
      function prev(){ goTo(index-1); }
      function startAutoplay(){ if(!autoplayEnabled) return; stopAutoplay(); intervalId = setInterval(next, autoplayDelay); }
      function stopAutoplay(){ if(intervalId){ clearInterval(intervalId); intervalId=null; } }
      function resetAutoplay(){ stopAutoplay(); startAutoplay(); }
      if(nextBtn){ nextBtn.addEventListener('click', e=>{ e.stopPropagation(); next(); resetAutoplay(); }); nextBtn.type='button'; }
      if(prevBtn){ prevBtn.addEventListener('click', e=>{ e.stopPropagation(); prev(); resetAutoplay(); }); prevBtn.type='button'; }
      root.addEventListener('keydown', e=>{ if(e.key==='ArrowRight'){ next(); resetAutoplay(); } if(e.key==='ArrowLeft'){ prev(); resetAutoplay(); } });
      if(effect==='fade' || effect==='zoom') { slides.forEach(s=>{ s.style.position='absolute'; s.style.inset='0'; }); }
      update();
      startAutoplay();
    });
  });
})();
