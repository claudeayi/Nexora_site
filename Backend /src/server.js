import 'dotenv/config.js';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { security } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { content } from './routes/content.js';
import { contact } from './routes/contact.js';
import { proxy } from './routes/proxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// middlewares
app.use(express.json({ limit: '1mb' }));
security(app);

// API routes
app.use('/api', content);
app.use('/api', contact);
app.use('/api', proxy);

// Static site (SPA + PWA)
// PUBLIC_DIR par défaut: ../nexora_site
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, '../../nexora_site'));
app.use(express.static(PUBLIC_DIR, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (/\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// SPA fallback
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

// errors
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`✅ Nexora Site Backend running on :${PORT}`);
  console.log(`   Serving static from: ${PUBLIC_DIR}`);
});
