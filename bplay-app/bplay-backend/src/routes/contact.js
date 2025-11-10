import express from 'express';
import nodemailer from 'nodemailer';
import { safeParse, ContactSchema } from '../lib/validators.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * POST /api/contact
 * { name, email, message }
 */
router.post('/contact', express.json(), async (req, res, next) => {
  try {
    const data = safeParse(ContactSchema, req.body);
    const html = `
      <h3>Nuevo mensaje desde el sitio</h3>
      <p><b>Nombre:</b> ${escapeHtml(data.name)}</p>
      <p><b>Email:</b> ${escapeHtml(data.email)}</p>
      <p><b>Mensaje:</b></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(data.message)}</pre>
    `;
    await transporter.sendMail({
      from: `"Web Bplay" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO,
      subject: 'Contacto desde la web',
      html
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

function escapeHtml(s=''){
  return s
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

export default router;
