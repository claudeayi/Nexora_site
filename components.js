// components.js — Nexora Futurist (final)

export const $ = (s) => document.querySelector(s);

// Helper template: html`<div>${x}</div>`
export const html = (strings, ...vals) =>
  strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');

// Création d’élément avec attributs étendus:
// el('button', { class:'btn', id:'x', style:{marginTop:'8px'}, dataset:{plan:'pro'},
//                on:{ click: (e)=>... }, html:'OK' }, [child1, child2])
export function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);

  if (attrs && typeof attrs === 'object') {
    // Événements
    if (attrs.on && typeof attrs.on === 'object') {
      for (const [evt, fn] of Object.entries(attrs.on)) {
        if (typeof fn === 'function') n.addEventListener(evt, fn, false);
      }
    }
    // style objet
    if (attrs.style && typeof attrs.style === 'object') {
      Object.assign(n.style, attrs.style);
    }
    // dataset
    if (attrs.dataset && typeof attrs.dataset === 'object') {
      for (const [k, v] of Object.entries(attrs.dataset)) {
        n.dataset[k] = v;
      }
    }

    // attributs standards
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = String(v ?? '');
      else if (k === 'text') n.textContent = String(v ?? '');
      else if (k === 'on' || k === 'style' || k === 'dataset') {/* déjà traité */}
      else if (v === false || v == null) {/* ignore */}
      else n.setAttribute(k, String(v));
    }
  }

  // enfants
  const arr = Array.isArray(children) ? children : [children];
  for (const c of arr) {
    if (!c && c !== 0) continue;
    if (c instanceof Node) n.appendChild(c);
    else if (typeof c === 'string') n.insertAdjacentHTML('beforeend', c);
    else n.appendChild(document.createTextNode(String(c)));
  }
  return n;
}

// Carte standard
export function card(inner, opts = {}) {
  const extra = opts.class ? ` ${opts.class}` : '';
  return el('div', { class: 'card' + extra, html: inner });
}

// Section avec titre H2 + carte
export function section(title, inner, opts = {}) {
  const wrap = el('section', opts);
  wrap.append(
    el('h2', { class: 'h', text: title }),
    card(inner)
  );
  return wrap;
}

// Date lisible locale
export function fmtDate(iso, locale) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso ?? '');
    return d.toLocaleDateString(locale || navigator.language || 'fr-FR', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  } catch {
    return String(iso ?? '');
  }
}

// KPI compact (retourne une string HTML pour usage inline)
export function kpi(label, value) {
  return `
    <div class="card stat">
      <div class="kpi">${value ?? '—'}</div>
      <div class="sub">${label ?? ''}</div>
    </div>
  `;
}

// Toast minimal (stack en bas à droite)
export function toast(message = '', type = 'info', timeout = 3000) {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = el('div', {
      id: 'toast-box',
      style: {
        position: 'fixed', right: '16px', bottom: '16px',
        display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999
      }
    });
    document.body.appendChild(box);
  }
  const bg = type === 'error' ? '#43222a' : type === 'success' ? '#1b3b2f' : '#121a36';
  const t = el('div', {
    class: 'card',
    style: {
      padding: '10px 14px', borderRadius: '10px',
      background: bg, color: '#eaf0ff',
      boxShadow: '0 10px 30px rgba(0,0,0,.35)', maxWidth: '420px'
    },
    html: `<span>${escapeHtml(String(message))}</span>`
  });
  box.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

// Petit spinner utilitaire
export function spinner(size = 18) {
  const s = el('span', {
    class: 'spinner',
    style: {
      display: 'inline-block',
      width: size + 'px', height: size + 'px',
      border: '2px solid rgba(255,255,255,.25)',
      borderTopColor: 'rgba(255,255,255,.9)',
      borderRadius: '50%',
      animation: 'nexora-spin 1s linear infinite'
    },
    ariaLabel: 'Chargement'
  });
  // injecte @keyframes si absent
  if (!document.getElementById('spin-style')) {
    const st = el('style', { id: 'spin-style', html: `@keyframes nexora-spin{to{transform:rotate(360deg)}}` });
    document.head.appendChild(st);
  }
  return s;
}

/* -------- Helpers privés -------- */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
  );
}
