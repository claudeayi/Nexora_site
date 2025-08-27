// Router hash-based simple + routes dynamiques
export const Router = (() => {
  const routes = new Map();
  const notFound = () => document.getElementById('app').innerHTML =
    `<div class="card"><h2>404</h2><p>Page introuvable.</p></div>`;

  function parse() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs||''));
    return { path, params };
  }

  function on(path, handler){ routes.set(path, handler); return Router; }
  function go(path){ location.hash = path; }

  async function run(){
    const { path, params } = parse();
    const match = [...routes.keys()].find(p => {
      if (p===path) return true;
      if (p.includes('/:')) {
        const a = p.split('/').filter(Boolean), b = path.split('/').filter(Boolean);
        if (a.length !== b.length) return false;
        return a.every((seg,i)=> seg.startsWith(':') || seg===b[i]);
      }
      return false;
    });
    const app = document.getElementById('app'); app.innerHTML='';
    if (!match) return notFound();

    const dyn = match.includes('/:');
    const ctx = { params, app, route: path };
    if (!dyn) return routes.get(match)(ctx);

    const keys = match.split('/').filter(Boolean);
    const vals = path.split('/').filter(Boolean);
    const pathParams = {};
    keys.forEach((k,i)=>{ if(k.startsWith(':')) pathParams[k.slice(1)] = vals[i]; });
    return routes.get(match)({ ...ctx, params: { ...params, ...pathParams } });
  }

  window.addEventListener('hashchange', run);
  window.addEventListener('load', run);
  return { on, go, run };
})();
