import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { forbidden, handle, unauthorized } from './http.js';

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const checkPassword = (password, hash) => bcrypt.compare(password, hash);

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/** The account shape the site keeps in its session (lib/types.ts `Account`). */
export function toAccount(row) {
  return { id: row.id, name: row.name, role: row.role, email: row.email, phone: row.phone, status: row.status };
}

/**
 * Loads the user behind the Bearer token into req.user. Role and status are read
 * from the database on every request, so approvals and upgrades apply immediately.
 */
export const requireAuth = handle(async (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('انتهت الجلسة. سجّل الدخول مرة ثانية.');
  }
  const { rows } = await query('SELECT id, name, role, email, phone, status FROM users WHERE id = $1', [Number(payload.sub)]);
  if (!rows.length) throw unauthorized('انتهت الجلسة. سجّل الدخول مرة ثانية.');
  if (rows[0].status === 'suspended') throw forbidden('هذا الحساب موقوف. تواصل ويانا.');
  req.user = rows[0];
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}

/** Normal users (approved on sign-up) and approved companies may place requests. */
export function canOrder(user) {
  return (user.role === 'user' || user.role === 'client') && user.status === 'approved';
}
