import { Router } from 'express';
import { getPostsMeta, getPostBody, getRoadmap } from '../lib/content.js';

export const content = Router();

content.get('/health', (_req, res) => res.json({ ok: true, name: 'nexora-site-backend' }));

content.get('/posts', async (_req, res, next) => {
  try {
    const meta = await getPostsMeta();
    res.json(meta);
  } catch (e) { next(e); }
});

content.get('/posts/:slug', async (req, res, next) => {
  try {
    const md = await getPostBody(req.params.slug);
    res.type('text/markdown').send(md);
  } catch (e) { next(Object.assign(new Error('post_not_found'), { status: 404 })); }
});

content.get('/roadmap', async (_req, res, next) => {
  try { res.json(await getRoadmap()); }
  catch (e) { next(e); }
});
