// app.js — Nexora_site FUTURIST (final)
// Conserve tes routes & composants, ajoute API editable, fallbacks réseau (outbox), UX+.

import { Router } from './router.js';
import { el, card, section, fmtDate, kpi, $ } from './components.js';
import { I18N, setLang } from './i18n.js';

/* =========================
 *  Config & Persistence
 * ========================= */
const LS = {
  API: 'nexora.api',
  TENANT: 'nexora.tenant',
  THEME: 'theme',
  LANG: 'lang',
  OUTBOX: 'nexora.outbox' // file d’attente offline
};

function api() {
  return localStorage.getItem(LS.API) || window.NEXORA_API || 'http://localhost:4000';
}
function setApi(value) {
  if (!value) return;
  localStorage.setItem(LS.API, value);
  window.NEXORA_API = value;
  const input = document.getElementById('apiUrl');
  if (input) input.value = value;
}

function tenant() {
  return localStorage.getItem(LS.TENANT) || window.NEXORA_TENANT || 'default';
}
function setTenant(value) {
  if (!value) return;
  localStorage.setItem(LS.TENANT, value);
  window.NEXORA_TENANT = value;
}

function getLang() {
  return localStorage.getItem(LS.LANG) || 'fr';
}

/* =========================
 *  Small Utils
 * ========================= */
document.getElementById('y').textContent = new Date().getFullYear();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toast(msg) {
  const n = el('div', { class: 'card', html: `<p>${msg}</p>` });
  Object.assign(n.style, { position: 'fixed', right: '12px', bottom: '12px', zIndex: 9999 });
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2600);
}

function utms() {
  const u = new URL(location.href);
  return ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
    .reduce((a,k)=>{ const v=u.searchParams.get(k); if(v) a[k]=v; return a; },{});
}

/* =========================
 *  Network helpers + Outbox
 * ========================= */
function loadOutbox() {
  try { return JSON.parse(localStorage.getItem(LS.OUTBOX) || '[]'); }
  catch { return []; }
}
function saveOutbox(arr) {
  localStorage.setItem(LS.OUTBOX, JSON.stringify(arr || []));
}

async function safeFetchJSON(path, { method='GET', body=null, headers={}, timeout=8000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(api() + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-tenant': tenant(), ...headers },
      body: body ? JSON.stringify(body) : null,
      signal: ctl.signal
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json().catch(() => ({}));
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function safePostWithOutbox(path, payload) {
  try {
    return await safeFetchJSON(path, { method: 'POST', body: payload });
  } catch {
    // Sauvegarde l’intention pour retry plus tard
    const box = loadOutbox();
    box.push({ path, payload, _ts: Date.now() });
    saveOutbox(box);
    throw new Error('offline_saved');
  }
}

async function flushOutbox() {
  const box = loadOutbox();
  if (!box.length) return;
  const rest = [];
  for (const it of box) {
    try {
      await safeFetchJSON(it.path, { method: 'POST', body: it.payload });
      await sleep(60);
    } catch {
      rest.push(it);
    }
  }
  saveOutbox(rest);
  if (box.length && !rest.length) toast('✅ Messages hors-ligne envoyés');
}
window.addEventListener('online', flushOutbox);

/* =========================
 *  Theme switch (light/dark)
 * ========================= */
(function(){
  const pref = localStorage.getItem(LS.THEME)
            || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  if (pref === 'light') document.documentElement.classList.add('light');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.onclick = () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem(LS.THEME, document.documentElement.classList.contains('light') ? 'light' : 'dark');
  };
})();

/* =========================
 *  i18n
 * ========================= */
(function(){
  const langSel = document.getElementById('lang');
  const cur = getLang();
  if (langSel) {
    langSel.value = cur; 
    setLang(cur);
    langSel.onchange = () => { setLang(langSel.value); localStorage.setItem(LS.LANG, langSel.value); location.hash = location.hash || '#/'; };
  }
})();

/* =========================
 *  Consent & Pixel loader
 * ========================= */
(function(){
  const K='nexora_consent', v=localStorage.getItem(K);
  const banner = document.getElementById('cookie-banner');
  function loadPixel(){
    const s=document.createElement('script');
    s.defer=true; s.src=(api())+'/events/sdk.js'; document.head.appendChild(s);
  }
  if (!banner) return;
  if (v==='allow'){ banner.classList.add('off'); loadPixel(); return; }
  if (v==='deny'){ banner.classList.add('off'); return; }
  banner.classList.remove('off');
  const ok = document.getElementById('cookie-accept');
  const no = document.getElementById('cookie-decline');
  if (ok) ok.onclick=()=>{ localStorage.setItem(K,'allow'); banner.classList.add('off'); loadPixel(); };
  if (no) no.onclick=()=>{ localStorage.setItem(K,'deny'); banner.classList.add('off'); };
})();

/* =========================
 *  Header bindings (API/TENANT)
 * ========================= */
(function(){
  const apiInput = document.getElementById('apiUrl');
  if (apiInput) {
    apiInput.value = api();
    apiInput.addEventListener('change', ()=>{
      setApi(apiInput.value.trim());
      toast('🔧 API enregistrée');
      flushOutbox();
    });
  }
  // Si tu ajoutes un champ tenant:
  const tInput = document.getElementById('tenantKey');
  if (tInput) {
    tInput.value = tenant();
    tInput.addEventListener('change', ()=>{ setTenant(tInput.value.trim()); toast('🏷️ Tenant enregistré'); });
  }
})();

/* =========================
 *  Nav active + smooth-scroll
 * ========================= */
(function(){
  const nav = document.querySelector('nav[role="navigation"]');
  function mark(){
    if (!nav) return;
    const h = location.hash || '#/';
    nav.querySelectorAll('a').forEach(a=>{
      a.classList.toggle('active', h.startsWith(a.getAttribute('href')));
    });
  }
  window.addEventListener('hashchange', mark);
  mark();

  // smooth scroll in-page anchors
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.querySelector(`[data-route="${id}"], ${id}`);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
  });
})();

/* =========================
 *  ROUTES
 * ========================= */

// Home / Landing
Router.on('/', async ({app})=>{
  const lang = localStorage.getItem(LS.LANG) || 'fr';
  const hero = el('section',{class:'hero'},[
    el('div',{html:`<h1><span class="grad">${I18N[lang].hero.title}</span></h1>
      <p class="sub">${I18N[lang].hero.sub}</p>
      <div class="row"><a class="btn" href="#/contact">Demander un accès</a><a class="btn ghost" href="#/pricing">Voir les tarifs</a></div>
      <div class="tags" style="margin-top:10px"><span class="tag">Multi-tenant</span><span class="tag">Sécurisé</span><span class="tag">API-first</span></div>`}),
    el('div',{},[ el('img',{src:'/assets/hero.svg',alt:'Illustration Nexora',loading:'lazy',style:'max-width:100%;height:auto;border-radius:16px;border:1px solid #23305c;box-shadow:0 10px 30px rgba(0,0,0,.25)'}) ])
  ]);

  const feats = el('div',{class:'grid'},[
    card('<h3>CRM intelligent</h3><p>Profils enrichis, scoring prédictif, pipelines IA.</p>'),
    card('<h3>Tracking & Attribution</h3><p>Pixel 1×1, SDK JS, attribution omnicanale, anti-fraude.</p>'),
    card('<h3>A/B & Bandits</h3><p>Assignation intelligente, arrêt auto, reporting.</p>'),
    card('<h3>Facturation</h3><p>Stripe, PayPal, CinetPay, multi-devise & taxes.</p>'),
    card('<h3>Automations</h3><p>Webhooks, règles IA, alertes d’anomalies.</p>'),
    card('<h3>Sécurité</h3><p>JWT, RBAC, export, DPA, rétention.</p>')
  ]);

  let overview = { leadCount:0, clickCount:0, eventCount:0, narrative:'' };
  try { overview = await safeFetchJSON('/copilot/overview'); } catch {}

  const metrics = el('div',{class:'grid',html:
    kpi('Leads', overview.leadCount) + kpi('Clics', overview.clickCount) + kpi('Événements', overview.eventCount)
  });

  const copilot = section('Copilote IA', `
    <form id="copilot" class="row">
      <input class="input" name="goal" placeholder="Objectif (ex : +500 leads / 2 semaines)" required/>
      <input class="input" name="audience" placeholder="Audience (ex : PME e-commerce)" required/>
      <input class="input" name="product" placeholder="Produit / Offre" required/>
      <button class="btn">Générer un plan</button>
    </form>
    <div class="grid" style="margin-top:12px">
      <pre class="code" id="cp-plan">/* Plan généré... */</pre>
      <pre class="code" id="cp-var">/* Variants A/B... */</pre>
      <pre class="code" id="cp-utm">/* UTMs... */</pre>
    </div>
  `);

  const socialProof = section('Ils préparent Nexora', `
    <div class="tags"><span class="tag">E-commerce</span><span class="tag">SaaS</span><span class="tag">Fintech</span><span class="tag">Éducation</span></div>
  `);

  const blogTeaser = el('section',{},[
    el('h2',{class:'h',html:'Derniers articles'}),
    el('div',{id:'blog-teaser',class:'grid'})
  ]);

  app.append(hero, section('Tout-en-un, vraiment.', feats.outerHTML), metrics, copilot, socialProof, blogTeaser);

  // Copilot generate (avec outbox sur échec)
  $('#copilot').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try{
      const out = await safeFetchJSON('/copilot/generate', { method:'POST', body:data });
      $('#cp-plan').textContent = JSON.stringify(out.plan||out,null,2);
      $('#cp-var').textContent  = JSON.stringify(out.variants||[],null,2);
      $('#cp-utm').textContent  = JSON.stringify(out.utm||{},null,2);
      window.nexora?.track?.('copilot_generate', data);
    }catch{
      // stocke une intention de génération pour audit (facultatif)
      try { await safePostWithOutbox('/events', { name:'copilot_generate_offline', properties:data, url:location.href }); } catch {}
      toast('Hors-ligne : plan non généré, réessaie plus tard.');
    }
  });

  // Blog teaser
  const meta = await fetch('/data/posts.json').then(r=>r.json()).catch(()=>[]);
  $('#blog-teaser').innerHTML = meta.slice(0,3).map(p =>
    `<div class="card"><h3><a href="#/blog/${p.slug}">${p.title}</a></h3><p class="sub">${p.excerpt}</p><small class="mono">${fmtDate(p.date)}</small></div>`
  ).join('') || '<div class="card">Aucun article pour le moment.</div>';
});

// Features
Router.on('/features', async ({app})=>{
  app.append(el('h1',{class:'h',html:'Fonctionnalités'}));
  app.append(card(`<ul>
    <li>CRM : contacts, entreprises, deals, scoring IA, vues sauvegardées</li>
    <li>Tracking : pixel/SDK, événements custom, attribution, anti-fraude</li>
    <li>Expérimentation : A/B, bandits, capping, segmentation</li>
    <li>Billing : Stripe, PayPal, CinetPay, coupons, essais, taxes</li>
    <li>Automations : webhooks, règles, alertes d’anomalies</li>
    <li>Sécurité : RBAC, audit, DPA, export, rétention</li>
  </ul>`));
});

// Intégrations
Router.on('/integrations', ({app})=>{
  app.append(el('h1',{class:'h',html:'Intégrations'}));
  app.append(card(`<div class="tags">
    <span class="tag">Stripe</span><span class="tag">PayPal</span><span class="tag">CinetPay</span>
    <span class="tag">Segment</span><span class="tag">BigQuery</span><span class="tag">Slack</span>
  </div>`));
});

// Pricing
Router.on('/pricing', ({app})=>{
  app.append(el('h1',{class:'h',html:'Tarification'}));
  const panel = card(`<div class="grid pricing">
    <div class="card"><h3>Free</h3><p><span class="price">0€</span>/mois</p><ul><li>1 projet · 1k événements</li><li>Leads & liens illimités</li></ul></div>
    <div class="card highlight">
      <h3>Pro</h3><p><span id="pricePro" class="price">29€</span>/mois</p>
      <div class="row"><button id="btnSuggest" class="btn ghost">Adapter à mon pays</button><button id="btnCheckout" class="btn">Souscrire</button></div>
      <small class="sub">Stripe/PayPal/CinetPay</small>
    </div>
    <div class="card"><h3>Enterprise</h3><p><span class="price">Sur devis</span></p><ul><li>SSO, SLA, audit</li><li>On-prem/VPC</li></ul></div>
  </div>`);
  app.append(panel);

  $('#btnSuggest').onclick = async ()=>{
    try{
      const loc = Intl.DateTimeFormat().resolvedOptions().locale || 'fr-FR';
      const country = (loc.split('-')[1] || 'FR').toUpperCase();
      const out = await safeFetchJSON('/copilot/pricing/suggest', { method:'POST', body:{ currency:'EUR', country, base_monthly:29 } });
      if (out?.monthly) $('#pricePro').textContent = `${out.monthly}€`;
      toast('Tarif adapté pour ' + (out?.country || country));
    }catch{ toast('API indisponible — tarifs par défaut'); }
  };

  $('#btnCheckout').onclick = async ()=>{
    try{
      const o = await safeFetchJSON('/billing/checkout', { method:'POST', body:{ plan:'pro', provider:'STRIPE' } });
      if (o?.url) location.href = o.url; else toast('Checkout indisponible');
    }catch{ toast('Erreur de checkout'); }
  };
});

// Blog index
Router.on('/blog', async ({app})=>{
  app.append(el('h1',{class:'h',html:'Blog'}));
  const search = el('input',{class:'input',placeholder:'Rechercher...',id:'q'});
  app.append(card(search.outerHTML));
  const list = el('div',{class:'grid',id:'bloglist'}); app.append(list);

  const posts = await fetch('/data/posts.json').then(r=>r.json()).catch(()=>[]);
  function render(q=''){
    const ql=q.trim().toLowerCase();
    list.innerHTML = posts.filter(p => !ql || p.title.toLowerCase().includes(ql) || p.tags.join(' ').toLowerCase().includes(ql))
      .map(p=>`<div class="card"><h3><a href="#/blog/${p.slug}">${p.title}</a></h3><p class="sub">${p.excerpt}</p><div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><small class="mono">${fmtDate(p.date)}</small></div>`).join('');
  }
  render();
  document.getElementById('q').oninput = e => render(e.target.value);
});

// Article
Router.on('/blog/:slug', async ({app, params})=>{
  const metas = await fetch('/data/posts.json').then(r=>r.json()).catch(()=>[]);
  const post = metas.find(p=>p.slug===params.slug);
  if (!post) return app.append(card('<h2>Article introuvable</h2>'));
  const md = await fetch(`/data/posts/${post.slug}.md`).then(r=>r.text()).catch(()=>null);
  app.append(el('article',{class:'article card',html:`<h1>${post.title}</h1><p class="sub">${fmtDate(post.date)} · ${post.tags.join(', ')}</p>${markdownToHTML(md||'')}`}));
});

// Docs
Router.on('/docs', ({app})=>{
  app.append(el('h1',{class:'h',html:'Docs – Démarrer en 2 minutes'}));
  app.append(card(`<ol>
    <li>Ajoutez dans votre <code>&lt;head&gt;</code> :
      <pre class="code">&lt;script&gt;window.NEXORA_API='${api()}';window.NEXORA_TENANT='${tenant()}'&lt;/script&gt;
&lt;script src='${api()}/events/sdk.js'&gt;&lt;/script&gt;</pre></li>
    <li>Envoyez un lead :
      <pre class="code">fetch('${api()}/leads?t=${tenant()}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo@nexora.ai'})})</pre></li>
    <li>Copilote :
      <pre class="code">fetch('${api()}/copilot/generate',{method:'POST',headers:{'Content-Type':'application/json','x-tenant':'${tenant()}'},body:JSON.stringify({goal:'500 leads',audience:'PME',product:'Nexora'})})</pre></li>
  </ol>`));
});

// Roadmap
Router.on('/roadmap', async ({app})=>{
  app.append(el('h1',{class:'h',html:'Roadmap'}));
  const data = await fetch('/data/roadmap.json').then(r=>r.json()).catch(()=>({planned:[],building:[],done:[]}));
  app.append(section('En cours', data.building.map(i=>`<div class="card"><strong>${i.title}</strong><p class="sub">${i.desc}</p></div>`).join('') || '<div class="card">—</div>'));
  app.append(section('Prévu', data.planned.map(i=>`<div class="card"><strong>${i.title}</strong><p class="sub">${i.desc}</p></div>`).join('') || '<div class="card">—</div>'));
  app.append(section('Livré', data.done.map(i=>`<div class="card"><strong>${i.title}</strong><p class="sub">${i.desc}</p></div>`).join('') || '<div class="card">—</div>'));
});

// Status
Router.on('/status', async ({app})=>{
  app.append(el('h1',{class:'h',html:'Status système'}));
  const cards = el('div',{class:'grid',id:'statusgrid'}); app.append(cards);
  async function ping(pathList){
    const results = [];
    for (const p of pathList){
      const t0=performance.now();
      try{ const r=await fetch(`${api()}${p}`,{headers:{'x-tenant':tenant()}}); results.push({p,ok:r.ok,ms:Math.round(performance.now()-t0)}); }
      catch{ results.push({p,ok:false,ms:Math.round(performance.now()-t0)}); }
    }
    return results;
  }
  const checks = await ping(['/copilot/overview','/events/sdk.js','/billing/plan','/auth/me']);
  cards.innerHTML = checks.map(c=>`<div class="card"><div class="stat"><div class="kpi" style="color:${c.ok?'var(--ok)':'var(--danger)'}">${c.ok?'OK':'DOWN'}</div><div>${c.p}</div></div><div class="sub">${c.ms} ms</div></div>`).join('');
});

// Changelog
Router.on('/changelog', async ({app})=>{
  app.append(el('h1',{class:'h',html:'Changelog'}));
  const data = await fetch('/data/posts.json').then(r=>r.json()).catch(()=>[]);
  app.append(card(`<ul>${data.slice(0,8).map(p=>`<li>${fmtDate(p.date)} — ${p.title}</li>`).join('')}</ul>`));
});

// Contact
Router.on('/contact', ({app})=>{
  app.append(el('h1',{class:'h',html:'Rejoindre l’accès anticipé'}));
  app.append(card(`<form id="lead" class="row">
    <input class="input" name="name" placeholder="Nom" required/>
    <input class="input" type="email" name="email" placeholder="Email professionnel" required/>
    <input class="input" name="company" placeholder="Société (optionnel)"/>
    <input class="input" name="phone" placeholder="Téléphone (optionnel)"/>
    <textarea class="input" name="message" placeholder="Contexte / Objectifs"></textarea>
    <div class="row"><button class="btn">Demander une démo</button><label class="sub"><input type="checkbox" id="nl"> S’abonner à la newsletter</label></div>
    <p class="sub" id="msg"></p>
  </form>`));
  $('#lead').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.target).entries());
    const payload = { ...v, ...utms(), tag: ($('#nl').checked ? 'newsletter' : undefined) };
    try{
      await safeFetchJSON(`/leads?t=${encodeURIComponent(tenant())}`, { method:'POST', body:payload });
      $('#msg').textContent='Merci ! Nous revenons très vite ✅';
      e.target.reset(); window.nexora?.track?.('lead_submit',{email:payload.email});
    }catch{
      try { await safePostWithOutbox('/events', { name:'lead_submit_offline', properties:payload, url:location.href }); } catch {}
      $('#msg').textContent='Hors-ligne : demande enregistrée, nous l’enverrons plus tard ⏳';
    }
  });
});

/* =========================
 *  Markdown util
 * ========================= */
function markdownToHTML(md){
  if(!md) return '';
  let html = md
    .replace(/^### (.*$)/gim,'<h3>$1</h3>')
    .replace(/^## (.*$)/gim,'<h2>$1</h2>')
    .replace(/^# (.*$)/gim,'<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim,'<em>$1</em>')
    .replace(/`([^`]+)`/gim,'<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim,'<img alt="$1" src="$2" loading="lazy"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim,'<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/^\s*-\s+(.*)$/gim,'<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims,'<ul>$1</ul>');
  html = html.replace(/^(?!<h\d|<ul|<li|<img|<p|<pre|<blockquote)(.+)$/gim,'<p>$1</p>');
  return html;
}

/* =========================
 *  Boot
 * ========================= */
flushOutbox(); // tente d’envoyer la file d’attente au démarrage
