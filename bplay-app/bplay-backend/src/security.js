import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';

export function buildCors() {
  const env = process.env.CORS_ORIGINS || '';
  const whitelist = env.split(',').map(s => s.trim()).filter(Boolean);

  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // permite curl / server-side
      if (whitelist.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed by CORS'));
    },
    credentials: false,
    methods: ['GET','POST'],
    allowedHeaders: ['Content-Type']
  });
}

export function security(app) {
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": ["'self'", "https:"],
        "script-src-attr": ["'none'"]
      }
    },
    crossOriginOpenerPolicy: { policy: "same-origin" }
  }));

  app.use(buildCors());

  app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 120, // 120 req/min por IP
    standardHeaders: true,
    legacyHeaders: false
  }));

  app.use(compression());
  app.use(cookieParser());
}
