<script>
/* --- Fetch helper + Outbox (fallback offline) --- */
import { getAPI } from './config.js';

const OUTBOX_KEY = 'nexora_outbox';

function saveOutbox(item) {
  const box = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  box.push(Object.assign({ _ts: Date.now() }, item));
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
}

export async function safePost(path, payload, { timeout = 6000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(getAPI() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: controller.signal
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json().catch(() => ({}));
  } catch (e) {
    // fallback → on sauvegarde pour retry
    saveOutbox({ path, payload });
    throw e;
  }
}

export async function safeGet(path, { timeout = 6000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(getAPI() + path, { signal: controller.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json().catch(() => ({}));
  } catch (e) {
    throw e;
  }
}

export async function flushOutbox() {
  const box = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  if (!box.length) return;
  const rest = [];
  for (const it of box) {
    try {
      await fetch(getAPI() + it.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(it.payload || {})
      });
    } catch { rest.push(it); }
  }
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(rest));
}

window.addEventListener('online', flushOutbox);
window.addEventListener('load', () => setTimeout(flushOutbox, 1200));
</script>
