import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function baseContentDir() {
  const p = process.env.CONTENT_DIR || path.join(__dirname, '../../..', 'nexora_site', 'data');
  return path.resolve(p);
}

export async function getPostsMeta() {
  const file = path.join(baseContentDir(), 'posts.json');
  const raw = await fs.readFile(file, 'utf8').catch(() => '[]');
  return JSON.parse(raw);
}

export async function getPostBody(slug) {
  const file = path.join(baseContentDir(), 'posts', `${slug}.md`);
  return fs.readFile(file, 'utf8');
}

export async function getRoadmap() {
  const file = path.join(baseContentDir(), 'roadmap.json');
  const raw = await fs.readFile(file, 'utf8').catch(() => '{"planned":[],"building":[],"done":[]}');
  return JSON.parse(raw);
}
