import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

export function security(app) {
  app.set('trust proxy', process.env.TRUST_PROXY === '1');

  app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false // le site est statique; ajuste si besoin
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: false
  }));

  app.use(compression());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_WINDOW_MS || 60000),
    max: Number(process.env.RATE_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);
}
