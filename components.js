export const $ = s => document.querySelector(s);
export function el(tag, attrs={}, children=[]){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==='class') n.className=v;
    else if (k==='html') n.innerHTML=v;
    else n.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c=> c && n.appendChild(c));
  return n;
}
export function card(html){ return el('div',{class:'card',html}); }
export function section(title, html){
  return el('section',{},[ el('h2',{class:'h',html:title}), card(html) ]);
}
export function fmtDate(iso){ try{ return new Date(iso).toLocaleDateString(); }catch{ return iso; } }
export function kpi(label, value){ return `<div class="card stat"><div class="kpi">${value}</div><div class="sub">${label}</div></div>`; }
