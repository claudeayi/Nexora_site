import fs from 'fs/promises';
import path from 'path';

function dataDir() {
  return path.resolve(process.env.DATA_DIR || './var');
}

export async function ensureDirs() {
  await fs.mkdir(dataDir(), { recursive: true }).catch(() => {});
}

const OUTBOX = () => path.join(dataDir(), 'outbox.jsonl');

export async function pushOutbox(lineObj) {
  await ensureDirs();
  const line = JSON.stringify({ ...lineObj, ts: Date.now() }) + '\n';
  await fs.appendFile(OUTBOX(), line, 'utf8');
}

export async function readOutbox() {
  try {
    const raw = await fs.readFile(OUTBOX(), 'utf8');
    return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch { return []; }
}

export async function clearOutbox() {
  await fs.writeFile(OUTBOX(), '', 'utf8').catch(() => {});
}
