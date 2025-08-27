<script>
/* --- UI helpers (smooth scroll, nav active, hooks) --- */
import { initApiInput, getAPI } from './config.js';
import { safePost, safeGet } from './network.js';

export function initSmoothScrollAndActive() {
  document.documentElement.style.scrollBehavior = 'smooth';
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(s => obs.observe(s));
}

export function initForms() {
  // Contact → events
  const form = document.querySelector('#contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const message = form.querySelector('[name="message"]').value.trim();
      const payload = { name: 'contact_submit', properties: { name, email, message, page: location.href } };
      try {
        await safePost('/events', payload);
        toast('Message envoyé ✅');
        form.reset();
      } catch {
        toast('Hors-ligne : message sauvegardé, il sera renvoyé ⏳');
      }
    });
  }

  // Pricing dynamique
  const btn = document.querySelector('#btnPricingAdapt');
  if (btn) {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const cc = (Intl.DateTimeFormat().resolvedOptions().locale || 'fr-FR').split('-')[1] || 'FR';
      try {
        const data = await safeGet('/copilot/pricing/suggest?country=' + encodeURIComponent(cc));
        const el = document.querySelector('[data-plan="pro"] .price');
        if (el && data?.monthly && data?.currency) el.textContent = `${data.monthly} ${data.currency}/mois`;
        toast('Tarifs adaptés à ' + (data.country || cc));
      } catch {
        toast('API indisponible — tarifs par défaut conservés');
      } finally { btn.disabled = false; }
    });
  }
}

export function initHeaderApiField() { initApiInput(); }

// Mini toast
export function toast(msg = '') {
  let t = document.querySelector('#toast');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id: 'toast' });
    Object.assign(t.style, { position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
      background: '#121a36', color: '#eaf0ff', padding: '10px 14px', borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,.3)', zIndex: 9999, fontSize: '14px' });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2800);
}

export function boot() {
  initHeaderApiField();
  initSmoothScrollAndActive();
  initForms();
  // Ping backend (facultatif)
  fetch(getAPI() + '/').catch(()=>{});
}
</script>
