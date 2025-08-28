// i18n.js
const LS_LANG = 'nexora.lang';
const dict = {
  fr: {
    hero_title: 'Nexora — le copilote IA tout-en-un pour votre croissance 🚀',
    features: 'Fonctionnalités clés',
    feat_crm: 'Centralisez leads, contacts et clients dans une base optimisée IA.',
    feat_tracking: 'Suivi multi-canal (web, mobile, social) + insights en temps réel.',
    feat_ab: 'A/B testing multi-variantes automatisé.',
    feat_billing: 'Stripe, PayPal, Mobile Money, reporting clair.',
    feat_ai: 'Recommandations stratégiques en continu.',
    feat_auto: 'Emailing, nurturing, scoring prédictif, intégrations.',
    pricing: 'Tarifs',
    btn_adapt: 'Adapter à mon pays',
    p_free: 'CRM de base, tracking limité',
    p_pro: 'IA Copilot, A/B, Facturation',
    p_ent: 'Support dédié et intégrations avancées',
    blog: 'Blog',
    back_blog: 'Retour au blog',
    contact: 'Contact',
    name: 'Nom',
    your_message: 'Votre message…',
    send: 'Envoyer'
  },
  en: {
    hero_title: 'Nexora — your all-in-one AI copilot for growth 🚀',
    features: 'Key features',
    feat_crm: 'Centralize leads, contacts and customers with AI-optimized DB.',
    feat_tracking: 'Multi-channel tracking with real-time insights.',
    feat_ab: 'Automated multi-variant A/B testing.',
    feat_billing: 'Stripe, PayPal, Mobile Money, clear reporting.',
    feat_ai: 'Continuous strategic recommendations.',
    feat_auto: 'Emailing, nurturing, predictive scoring, integrations.',
    pricing: 'Pricing',
    btn_adapt: 'Adapt to my country',
    p_free: 'Basic CRM, limited tracking',
    p_pro: 'AI Copilot, A/B, Billing',
    p_ent: 'Dedicated support, advanced integrations',
    blog: 'Blog',
    back_blog: 'Back to blog',
    contact: 'Contact',
    name: 'Name',
    your_message: 'Your message…',
    send: 'Send'
  }
};

export function getLang(){ return localStorage.getItem(LS_LANG) || 'fr'; }
export function setLang(l){ localStorage.setItem(LS_LANG, l || 'fr'); }
export function t(key){ const l=getLang(); return (dict[l]&&dict[l][key]) || (dict.fr[key]||key); }
