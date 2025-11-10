import express from 'express';
import { normalizeProvince } from '../lib/geo.js';
import { REGISTRY_BY_PROVINCE, CBU_BY_PROVINCE } from '../data/registry-map.js';

const router = express.Router();

/**
 * GET /api/register-url?province=Cordoba
 * Devuelve la URL de registro para la provincia normalizada
 */
router.get('/register-url', (req, res) => {
  const raw = String(req.query.province || '');
  const p = normalizeProvince(raw);
  const url = (p && REGISTRY_BY_PROVINCE[p]) || null;
  res.json({ province: p, url });
});

/**
 * GET /api/cbu?province=Mendoza
 * Devuelve CBU según provincia (útil para sorteo/promos)
 */
router.get('/cbu', (req, res) => {
  const raw = String(req.query.province || '');
  const p = normalizeProvince(raw);
  const cbu = (p && CBU_BY_PROVINCE[p]) || null;
  res.json({ province: p, cbu });
});

/**
 * POST /api/track
 * Guarda un evento ligero (por ahora solo log; podés enchufar DB/SIEM)
 */
router.post('/track', express.json(), (req, res) => {
  const { type = 'click', meta = {} } = req.body || {};
  console.log('[TRACK]', {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ua: req.headers['user-agent'],
    type, meta, t: Date.now()
  });
  res.json({ ok: true });
});

export default router;
