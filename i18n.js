export const I18N = {
  fr: { hero: { title: "Le copilote IA de votre croissance", sub: "Unifiez CRM, tracking, A/B testing et facturation. L’IA de Nexora suggère, teste et optimise automatiquement." },
        nav:{features:"Fonctionnalités",integrations:"Intégrations",pricing:"Tarifs",blog:"Blog",docs:"Docs",roadmap:"Roadmap",status:"Status",cta:"Essayer"} },
  en: { hero: { title: "The AI copilot for your growth", sub: "Unify CRM, tracking, A/B testing and billing. Nexora’s AI suggests, tests and optimizes automatically." },
        nav:{features:"Features",integrations:"Integrations",pricing:"Pricing",blog:"Blog",docs:"Docs",roadmap:"Roadmap",status:"Status",cta:"Try"} }
};

export function setLang(lang='fr'){
  localStorage.setItem('lang', lang);
  const d = I18N[lang] || I18N.fr;
  document.querySelectorAll('[data-i18n]').forEach(n=>{
    const path = n.getAttribute('data-i18n').split('.');
    let v=d; path.forEach(p=> v=v?.[p]);
    if (v) n.textContent = v;
  });
}
