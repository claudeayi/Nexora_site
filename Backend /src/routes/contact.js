import { Router } from 'express';
import { z } from 'zod';
import { pushOutbox, readOutbox, clearOutbox } from '../lib/outbox.js';

export const contact = Router();

const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  message: z.string().min(5).max(4000),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  tag: z.string().optional()
});

async function forwardToNexora(evtName, properties) {
  const base = process.env.NEXORA_API;
  if (!base) throw new Error('NEXORA_API not set');

  const r = await fetch(`${base}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant': process.env.NEXORA_TENANT || 'default'
    },
    body: JSON.stringify({ name: evtName, properties, url: properties?.landingPage || '' })
  });
  if (!r.ok) throw new Error('Nexora API error ' + r.status);
  return r.json().catch(() => ({}));
}

contact.post('/contact', async (req, res, next) => {
  try {
    const data = ContactSchema.parse(req.body || {});
    // Try forward to Nexora; if fails, store to outbox
    try {
      await forwardToNexora('contact_message', data);
      res.json({ ok: true, forwarded: true });
    } catch {
      await pushOutbox({ type: 'contact_message', data });
      res.json({ ok: true, forwarded: false, stored: true });
    }
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: 'invalid', issues: e.issues });
    next(e);
  }
});

// Admin util simple: flush outbox (à appeler manuellement)
contact.post('/outbox/flush', async (_req, res) => {
  const items = await readOutbox();
  let sent = 0, left = [];
  for (const it of items) {
    try {
      await forwardToNexora(it.type, it.data);
      sent++;
    } catch {
      left.push(it);
    }
  }
  // réécrit le reste
  if (left.length) {
    await clearOutbox();
    for (const it of left) await pushOutbox(it);
  } else {
    await clearOutbox();
  }
  res.json({ ok: true, sent, pending: left.length });
});
