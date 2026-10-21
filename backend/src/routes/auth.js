import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query, tx } from '../db/pool.js';
import { checkPassword, hashPassword, requireAuth, signToken, toAccount } from '../lib/auth.js';
import { badRequest, conflict, forbidden, handle, send, unauthorized } from '../lib/http.js';
import { saveClientProfile, saveInfluencerProfile } from '../lib/profiles.js';
import { enums, influencerProfile, optEmail, optId, optPhone, parse, password, phone, text, z } from '../lib/validate.js';

export { createUser };

export const authRoutes = Router();

const tooMany = { success: false, message: 'محاولات كثيرة. انتظر شوية وحاول مرة ثانية.' };
// Login: only failed attempts count, so normal use never hits the limit.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany });
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany });

/** Inserts a user; maps unique-violation on phone/email to a friendly 409. */
async function createUser(db, { name, phone: tel, email: mail, password: pass, role, status }) {
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, phone, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, tel || null, mail || null, await hashPassword(pass), role, status],
    );
    return rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw conflict(String(error.constraint).includes('email') ? 'هذا البريد مسجّل مسبقاً. سجّل الدخول.' : 'هذا الرقم مسجّل مسبقاً. سجّل الدخول.');
    }
    throw error;
  }
}

/** Log in with phone OR e-mail (the site sends it in `phone`). */
authRoutes.post('/login', loginLimiter, handle(async (req, res) => {
  const body = parse(z.object({
    phone: z.string().trim().min(3).optional(),
    email: z.string().trim().optional(),
    password: z.string().min(1, 'اكتب كلمة المرور.'),
  }), req.body);
  const id = (body.phone || body.email || '').trim();
  if (!id) throw badRequest('اكتب رقم الهاتف أو البريد الإلكتروني.');
  const lookup = id.includes('@') ? id.toLowerCase() : id.replace(/[\s\-()]/g, '');
  const { rows } = await query('SELECT * FROM users WHERE phone = $1 OR email = $1', [lookup]);
  const user = rows[0];
  if (!user || !(await checkPassword(body.password, user.password_hash))) throw unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة.');
  if (user.status === 'suspended') throw forbidden('هذا الحساب موقوف. تواصل ويانا.');
  send(res, { token: signToken(user.id), user: toAccount(user) });
}));

authRoutes.get('/me', requireAuth, handle(async (req, res) => {
  send(res, toAccount(req.user));
}));

/** Normal account: name + phone or e-mail + password. Approved at once and signed in. */
authRoutes.post('/register/user', signupLimiter, handle(async (req, res) => {
  const body = parse(z.object({
    name: text(2, 120, 'اكتب اسمك.'),
    phone: optPhone,
    email: optEmail,
    password,
  }).refine((value) => value.phone || value.email, { message: 'اكتب رقم الهاتف أو البريد الإلكتروني.', path: ['phone'] }), req.body);
  const user = await createUser({ query }, { ...body, role: 'user', status: 'approved' });
  send(res, { token: signToken(user.id), user: toAccount(user) }, undefined, 201);
}));

/** Company account: reviewed before it can order. */
authRoutes.post('/register/client', signupLimiter, handle(async (req, res) => {
  const body = parse(z.object({
    name: text(2, 120, 'اكتب اسمك.'),
    phone,
    email: optEmail,
    password,
    brandName: text(2, 160, 'اكتب اسم العلامة.'),
    whatsapp: optPhone,
    contactEmail: optEmail,
    locationScope: enums.scope,
    governorateId: optId,
    countryId: optId,
  }), req.body);
  const user = await tx(async (db) => {
    const created = await createUser(db, { ...body, role: 'client', status: 'pending' });
    await saveClientProfile(db, created.id, body);
    return created;
  });
  send(res, { user: toAccount(user) }, undefined, 201);
}));

/** Direct creator sign-up: account + creator profile in one step, reviewed before going public. */
authRoutes.post('/register/influencer', signupLimiter, handle(async (req, res) => {
  const account = parse(z.object({ name: text(2, 120, 'اكتب اسمك.'), phone, email: optEmail, password }), req.body);
  const profile = parse(influencerProfile, req.body);
  const user = await tx(async (db) => {
    const created = await createUser(db, { ...account, role: 'influencer', status: 'pending' });
    await saveInfluencerProfile(db, created.id, profile);
    return created;
  });
  send(res, { user: toAccount(user) }, undefined, 201);
}));
