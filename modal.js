// modal.js - Gerenciamento de modais

(function() {
  'use strict';

  // Abre modal
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Foco no modal
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // Trap focus
    trapFocus(modal);
  }

  // Fecha modal
  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    // Retorna foco ao botão que abriu
    const trigger = document.querySelector(`[data-modal="${modal.id}"]`);
    if (trigger) trigger.focus();
  }

  // Trap focus dentro do modal
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    });
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
    // Botões que abrem modais
    document.querySelectorAll('[data-modal]').forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const modalId = this.getAttribute('data-modal');
        openModal(modalId);
      });
    });

    // Botões e overlays que fecham modais
    document.querySelectorAll('[data-close-modal]').forEach(closeBtn => {
      closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
      });
    });

    // Fechar com ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.is-active');
        if (activeModal) closeModal(activeModal);
      }
    });
  });
})();
