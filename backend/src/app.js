import fs from 'node:fs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound } from './lib/http.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { publicRoutes } from './routes/public.js';
import { requestRoutes } from './routes/requests.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  fs.mkdirSync(config.uploadDir, { recursive: true });
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '7d', fallthrough: false }));

  app.get('/health', (req, res) => res.json({ success: true, data: { ok: true } }));

  const api = express.Router();
  api.use('/', publicRoutes);
  api.use('/auth', authRoutes);
  api.use('/me', meRoutes);
  api.use('/', requestRoutes);
  api.use('/admin', adminRoutes);
  app.use('/api/v1', api);

  app.use((req, res, next) => next(notFound('المسار غير موجود.')));
  app.use(errorHandler);
  return app;
}
