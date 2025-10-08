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
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    track.setAttribute('role', 'list');
    slides.forEach((s, i) => {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-label', `Slide ${i + 1} de ${slides.length}`);
      s.setAttribute('tabindex', '-1');
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

    function updateProgress(ts) {
      if (!progressBar || !intervalId) return;
      if (!progressStart) progressStart = ts;
      const elapsed = ts - progressStart;
      const pct = Math.min(1, elapsed / autoplayDelay);
      progressBar.style.setProperty('--progress', (pct * 100) + '%');
      if (pct >= 1) { progressStart = ts; }
      progressRaf = requestAnimationFrame(updateProgress);
    }
    function clearProgress() {
      if (progressRaf) cancelAnimationFrame(progressRaf);
      progressRaf = null; progressStart = 0;
      if (progressBar) progressBar.style.setProperty('--progress', '0%');
    }

    function applyEffect() {
      if (effect === 'fade' || effect === 'zoom') {
        slides.forEach((s, i) => {
          const active = i === index;
          s.classList.toggle('is-active', active);
          if (effect === 'fade') {
            s.style.opacity = active ? '1' : '0';
            s.style.transform = 'none';
          }
          if (effect === 'zoom') {
            s.style.opacity = active ? '1' : '0';
            s.style.transform = active ? 'scale(1)' : 'scale(.9)';
          }
        });
      } else {
        slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      }
    }

    function updateAria() {
      slides.forEach((s, i) => {
        const active = i === index;
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (active) s.setAttribute('tabindex', '0'); else s.setAttribute('tabindex', '-1');
      });
      if (dots.length) dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function update() {
      if (effect === 'slide') {
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
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
      if (e.key === 'ArrowLeft') { prev(); resetAutoplay(); }
    });

    // Garante estilos iniciais
    if (effect === 'fade' || effect === 'zoom') {
      slides.forEach(s => { s.style.position = 'absolute'; s.style.inset = '0'; });
    }
    update();
    startAutoplay();

    return () => { stopAutoplay(); };
  }
});

(function () {
  // Patch rápido: reforça funcionamento de carrosséis caso algum listener tenha falhado
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.carousel').forEach(root => {
      if (root.__patched) return; // evita duplicar
      root.__patched = true;
      const track = root.querySelector('.carousel-track');
      if (!track) return;
      const slides = Array.from(track.querySelectorAll('.slide'));
      if (!slides.length) return;
      const prevBtn = root.querySelector('.carousel-btn.prev');
      const nextBtn = root.querySelector('.carousel-btn.next');
      const dotsWrap = root.querySelector('.carousel-dots');
      const effect = (root.dataset.effect || 'slide').toLowerCase();

      // Se script original já adicionou essas classes não duplica
      if (!root.classList.contains('carousel-enhanced')) {
        root.classList.add('carousel-enhanced', `effect-${effect}`);
      }

      let index = 0;
      let autoplayDelay = parseInt(root.dataset.interval || '3000', 10);
      let autoplayEnabled = root.dataset.autoplay === undefined ? true : (root.dataset.autoplay === 'true');
      let intervalId = null;

      // Ajusta posicionamento para efeitos não-slide
      if (effect !== 'slide') {
        track.style.transform = 'none';
      }

      // (re)cria dots se estiver vazio
      let dots = [];
      if (dotsWrap && !dotsWrap.childElementCount) {
        slides.forEach((_, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'carousel-dot'; b.setAttribute('aria-label', `Ir para slide ${i + 1}`);
          b.addEventListener('click', () => { goTo(i); resetAutoplay(); });
          dotsWrap.appendChild(b); dots.push(b);
        });
      } else if (dotsWrap) { dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot')); }

      function applyEffect() {
        if (effect === 'fade' || effect === 'zoom') {
          slides.forEach((s, i) => {
            const active = i === index;
            s.classList.toggle('is-active', active);
            s.style.opacity = active ? '1' : '0';
            if (effect === 'zoom') s.style.transform = active ? 'scale(1)' : 'scale(.9)';
          });
        } else {
          track.style.transform = `translateX(-${index * 100}%)`;
          slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
        }
      }

      function updateAria() {
        slides.forEach((s, i) => {
          const active = i === index;
          s.setAttribute('aria-hidden', active ? 'false' : 'true');
          s.tabIndex = active ? 0 : -1;
        });
        if (dots.length) dots.forEach((d, i) => d.classList.toggle('active', i === index));
      }

      function update() { applyEffect(); updateAria(); }
      function goTo(i) { index = ((i % slides.length) + slides.length) % slides.length; update(); }
      function next() { goTo(index + 1); }
      function prev() { goTo(index - 1); }
      function startAutoplay() { if (!autoplayEnabled) return; stopAutoplay(); intervalId = setInterval(next, autoplayDelay); }
      function stopAutoplay() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }
      function resetAutoplay() { stopAutoplay(); startAutoplay(); }
      if (nextBtn) { nextBtn.addEventListener('click', e => { e.stopPropagation(); next(); resetAutoplay(); }); nextBtn.type = 'button'; }
      if (prevBtn) { prevBtn.addEventListener('click', e => { e.stopPropagation(); prev(); resetAutoplay(); }); prevBtn.type = 'button'; }
      root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { next(); resetAutoplay(); } if (e.key === 'ArrowLeft') { prev(); resetAutoplay(); } });
      if (effect === 'fade' || effect === 'zoom') { slides.forEach(s => { s.style.position = 'absolute'; s.style.inset = '0'; }); }
      update();
      startAutoplay();
    });
  });
})();

// Funcionalidade do Newsletter
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.querySelector('.newsletter-form');
  const newsletterInput = document.querySelector('.newsletter-input');
  const newsletterBtn = document.querySelector('.newsletter-btn');

  if (newsletterForm && newsletterInput && newsletterBtn) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Previne o reload da página
      
      const email = newsletterInput.value.trim();
      
      // Validação básica de email
      if (!email) {
        showMessage('Por favor, digite seu e-mail.', 'error');
        return;
      }
      
      if (!isValidEmail(email)) {
        showMessage('Por favor, digite um e-mail válido.', 'error');
        return;
      }
      
      // Verifica se o email já existe antes de salvar
      if (isEmailAlreadyRegistered(email)) {
        showMessage('Este e-mail já está cadastrado! 📧', 'info');
        return;
      }
      
      // Salva o email no localStorage
      saveEmailToLocalStorage(email);
      
      // Limpa o campo
      newsletterInput.value = '';
      
      // Mostra mensagem de sucesso
      showMessage('E-mail cadastrado com sucesso! 🎉', 'success');
    });
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isEmailAlreadyRegistered(email) {
    const emails = JSON.parse(localStorage.getItem('newsletter-emails') || '[]');
    return emails.includes(email);
  }

  function saveEmailToLocalStorage(email) {
    // Pega a lista existente ou cria uma nova
    let emails = JSON.parse(localStorage.getItem('newsletter-emails') || '[]');
    
    // Adiciona o email (já foi verificado que não existe)
    emails.push(email);
    localStorage.setItem('newsletter-emails', JSON.stringify(emails));
    console.log('📧 Email salvo:', email);
    console.log('📋 Total de emails cadastrados:', emails.length);
  }

  function showMessage(text, type = 'success') {
    // Remove mensagem anterior se existir
    const existingMessage = document.querySelector('.newsletter-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Cria a mensagem
    const message = document.createElement('div');
    message.className = `newsletter-message newsletter-message--${type}`;
    message.textContent = text;
    
    // Estilos inline para a mensagem
    Object.assign(message.style, {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      marginTop: '0.5rem',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: '600',
      textAlign: 'center',
      zIndex: '10',
      opacity: '0',
      transform: 'translateY(-10px)',
      transition: 'all 0.3s ease'
    });

    // Cores baseadas no tipo
    if (type === 'success') {
      Object.assign(message.style, {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      });
    } else if (type === 'error') {
      Object.assign(message.style, {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb'
      });
    } else if (type === 'info') {
      Object.assign(message.style, {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb'
      });
    }

    // Adiciona posição relativa ao container do form
    newsletterForm.style.position = 'relative';
    
    // Adiciona a mensagem
    newsletterForm.appendChild(message);
    
    // Anima a entrada
    setTimeout(() => {
      message.style.opacity = '1';
      message.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove a mensagem após 4 segundos
    setTimeout(() => {
      message.style.opacity = '0';
      message.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (message.parentNode) {
          message.remove();
        }
      }, 300);
    }, 4000);
  }

  // Função para desenvolvedores verem os emails cadastrados
  window.getNewsletterEmails = function() {
    const emails = JSON.parse(localStorage.getItem('newsletter-emails') || '[]');
    console.log('📧 Emails cadastrados:', emails);
    return emails;
  };

  // Função para limpar todos os emails (desenvolvimento)
  window.clearNewsletterEmails = function() {
    localStorage.removeItem('newsletter-emails');
    console.log('🗑️ Todos os emails foram removidos');
  };
});

// Funcionalidade do Botão WhatsApp
document.addEventListener('DOMContentLoaded', () => {
  const whatsappBtn = document.getElementById('whatsapp-float');
  
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', function() {
      const phoneNumber = '5527996003604'; // Número com código do país (55) e DDD (27)
      const message = 'Oi! 😍 Vi seu site e me apaixonei pelo seu trabalho! ✨ Queria saber mais sobre seus serviços de makeup, você tem agenda disponível? 💄💕'; // Mensagem padrão
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      // Abre o WhatsApp em uma nova aba
      window.open(whatsappURL, '_blank');
      
      // Feedback visual opcional
      whatsappBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        whatsappBtn.style.transform = '';
      }, 150);
    });
    
    // Adiciona um pequeno atraso na aparição do botão para criar um efeito suave
    setTimeout(() => {
      whatsappBtn.style.opacity = '1';
      whatsappBtn.style.transform = 'scale(1)';
    }, 1000);
  }
});

// Funcionalidade do Botão Velvet PDF
document.addEventListener('DOMContentLoaded', () => {
  const velvetBtn = document.getElementById('velvet-cta');
  
  if (velvetBtn) {
    velvetBtn.addEventListener('click', function() {
      // Abre o PDF do Velvet em uma nova aba
      window.open('pdf/velvet.pdf', '_blank');
      
      // Feedback visual opcional
      velvetBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        velvetBtn.style.transform = '';
      }, 150);
    });
  }
});

// Funcionalidade do Botão Noivas PDF
document.addEventListener('DOMContentLoaded', () => {
  const noivasBtn = document.getElementById('noivas-cta');
  
  if (noivasBtn) {
    noivasBtn.addEventListener('click', function() {
      // Abre o PDF de Noivas em uma nova aba
      window.open('pdf/noivas.pdf', '_blank');
      
      // Feedback visual opcional
      noivasBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        noivasBtn.style.transform = '';
      }, 150);
    });
  }
});

// Funcionalidade do Botão Portfólio PDF
document.addEventListener('DOMContentLoaded', () => {
  const portfolioBtn = document.getElementById('portfolio-cta');
  
  if (portfolioBtn) {
    portfolioBtn.addEventListener('click', function() {
      // Abre o PDF do Portfólio em uma nova aba
      window.open('pdf/portfolio.pdf', '_blank');
      
      // Feedback visual opcional
      portfolioBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        portfolioBtn.style.transform = '';
      }, 150);
    });
  }
});
