import { Router } from 'express';

export const proxy = Router();

// Proxy simple -> /api/nexora/*  =>  NEXORA_API/*
proxy.all('/nexora/*', async (req, res) => {
  if (process.env.ENABLE_PROXY !== 'true' && process.env.ENABLE_PROXY !== '1') {
    return res.status(404).json({ error: 'proxy_disabled' });
  }
  const base = process.env.NEXORA_API;
  if (!base) return res.status(500).json({ error: 'NEXORA_API_missing' });

  const path = req.originalUrl.replace(/^\/api\/nexora\//, '/');
  try {
    const r = await fetch(base + path, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'x-tenant': process.env.NEXORA_TENANT || 'default',
        'authorization': req.headers['authorization'] || ''
      },
      body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {})
    });
    const buf = await r.arrayBuffer();
    res.status(r.status);
    r.headers.forEach((v,k)=>res.setHeader(k,v));
    res.send(Buffer.from(buf));
  } catch (e) {
    console.error('[proxy]', e.message);
    res.status(502).json({ error: 'bad_gateway' });
  }
});
