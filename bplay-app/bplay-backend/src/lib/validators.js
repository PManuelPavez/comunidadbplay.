import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  message: z.string().min(5).max(2000)
});

export function safeParse(schema, data){
  const r = schema.safeParse(data);
  if (!r.success) {
    const msg = r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    const e = new Error(msg);
    e.status = 400;
    throw e;
  }
  return r.data;
}
