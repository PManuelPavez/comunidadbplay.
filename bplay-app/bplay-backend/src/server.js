import 'dotenv/config';
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { security } from './security.js';
import publicRoutes from './routes/public.js';
import contactRoutes from './routes/contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 8080);

// Seguridad base
security(app);

// Logs (solo en dev)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API
app.use('/api', publicRoutes);
app.use('/api', contactRoutes);

// Static (sirve tu frontend si lo copias a /public)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, {
  maxAge: '1h',
  setHeaders: (res, p) => {
    if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// SPA fallback (opcional)
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(publicDir, 'index.html'), err => {
    if (err) next();
  });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const msg = process.env.NODE_ENV === 'production'
    ? 'Unexpected error'
    : (err.message || 'Unhandled');
  if (status >= 500) {
    console.error('[ERR]', err);
  }
  res.status(status).json({ error: msg });
});

app.listen(PORT, () => {
  console.log(`> API ready on http://localhost:${PORT}`);
});
