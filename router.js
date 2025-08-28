// router.js — Nexora Futurist (final)
// Hash-based, routes dynamiques, hooks, nav active, 404 custom, erreurs gérées.

export const Router = (() => {
  const routes = new Map();

  // --- 404 par défaut (personnalisable via setNotFound)
  let notFound = () => {
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div class="card"><h2>404</h2><p>Page introuvable.</p></div>`;
  };
  function setNotFound(fn) { if (typeof fn === 'function') notFound = fn; }

  // --- Hooks globaux
  const before = [];   // (ctx) => void|Promise
  const after  = [];   // (ctx) => void|Promise
  function beforeEach(fn){ if (typeof fn==='function') before.push(fn); return Router; }
  function afterEach(fn){ if (typeof fn==='function') after.push(fn);  return Router; }

  // --- Parse hash -> { path, params(query) }
  function parseHash(hashStr = location.hash) {
    const h = (hashStr || '').replace(/^#/, '') || '/';
    const [rawPath, qs] = h.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    return { path: rawPath, params };
  }

  // --- Add route
  function on(path, handler){
    routes.set(path, handler);
    return Router;
  }

  // --- Programmatic navigation (merge query option)
  function go(path, { query, replace=false } = {}){
    const base = path.replace(/^#/, '');
    const url = query ? `#${base}?${new URLSearchParams(query).toString()}` : `#${base}`;
    if (replace) history.replaceState(null, '', url);
    else location.hash = url;
  }

  // --- Matching util (supports /:slug)
  function matchRoute(path) {
    for (const pattern of routes.keys()) {
      if (pattern === path) return { pattern, params: {} };

      if (pattern.includes('/:')) {
        const a = pattern.split('/').filter(Boolean);
        const b = path.split('/').filter(Boolean);
        if (a.length !== b.length) continue;

        const params = {};
        let ok = true;
        for (let i=0; i<a.length; i++){
          if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i] || '');
          else if (a[i] !== b[i]) { ok = false; break; }
        }
        if (ok) return { pattern, params };
      }
    }
    return null;
  }

  // --- Nav active (a[href^="#/"])
  function markActiveNav(){
    const nav = document.querySelector('nav[role="navigation"]');
    if (!nav) return;
    const h = location.hash || '#/';
    nav.querySelectorAll('a[href^="#/"]').forEach(a=>{
      a.classList.toggle('active', h.startsWith(a.getAttribute('href')));
    });
  }

  // --- Run the router
  async function run(){
    // hash vide -> home
    if (!location.hash) location.hash = '#/';

    const { path, params: queryParams } = parseHash();
    const m = matchRoute(path);

    const app = document.getElementById('app');
    if (app) app.innerHTML = '';

    if (!m) { notFound(); markActiveNav(); return; }

    // Construit le ctx
    const ctx = {
      app,
      route: path,
      params: { ...queryParams, ...m.params }
    };

    // Hooks before
    for (const fn of before) { try { await fn(ctx); } catch(e){ console.error('beforeEach error', e); } }

    // Exécute handler + protections
    try {
      const handler = routes.get(m.pattern);
      const out = handler && handler(ctx);
      if (out instanceof Promise) await out;
      // Scroll top après rendu
      requestAnimationFrame(() => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {} });
    } catch (e) {
      console.error('Route handler error', e);
      if (app) app.innerHTML = `<div class="card"><h2>Erreur</h2><p>Une erreur est survenue lors du rendu de la page.</p></div>`;
    }

    // Hooks after
    for (const fn of after) { try { await fn(ctx); } catch(e){ console.error('afterEach error', e); } }

    // Met à jour la nav active
    markActiveNav();
  }

  // --- Liens SPA (optionnel) : Router.link('a[data-link]')
  function link(selector='a[data-link]'){
    document.addEventListener('click', (e)=>{
      const a = e.target.closest(selector);
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#/')) {
        e.preventDefault();
        location.hash = href;
      }
    });
    return Router;
  }

  // Listeners
  window.addEventListener('hashchange', run);
  window.addEventListener('load', run);

  // API publique
  return { on, go, run, parse: parseHash, setNotFound, beforeEach, afterEach, link };
})();
