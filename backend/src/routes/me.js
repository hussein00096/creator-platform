import { Router } from 'express';
import { config } from '../config.js';
import { query, tx } from '../db/pool.js';
import { hashPassword, requireAuth, requireRole } from '../lib/auth.js';
import { badRequest, conflict, forbidden, handle, notFound, send } from '../lib/http.js';
import { saveClientProfile, saveInfluencerProfile } from '../lib/profiles.js';
import { loadAccount, loadInfluencers, loadOrders } from '../lib/serialize.js';
import { publicPath, removeUpload, upload } from '../lib/upload.js';
import { enums, influencerProfile, optEmail, optId, optPassword, optPhone, optText, parse, z } from '../lib/validate.js';

export const meRoutes = Router();
meRoutes.use(requireAuth);

/** Updates name / phone / e-mail / password; maps duplicate phone or e-mail to 409. */
async function updateUser(db, userId, fields) {
  const sets = [];
  const params = [userId];
  const put = (column, value) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };
  if (fields.name) put('name', fields.name);
  if (fields.phone !== undefined && fields.phone !== null) put('phone', fields.phone);
  if (fields.email !== undefined) put('email', fields.email);
  if (fields.password) put('password_hash', await hashPassword(fields.password));
  if (!sets.length) return;
  try {
    await db.query(`UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, params);
  } catch (error) {
    if (error.code === '23505') throw conflict(String(error.constraint).includes('email') ? 'هذا البريد مستخدم بحساب ثاني.' : 'هذا الرقم مستخدم بحساب ثاني.');
    if (error.code === '23514') throw badRequest('لازم يبقى رقم هاتف أو بريد إلكتروني بالحساب.');
    throw error;
  }
}

meRoutes.get('/account', handle(async (req, res) => {
  send(res, await loadAccount(req.user.id));
}));

meRoutes.patch('/account', handle(async (req, res) => {
  const base = parse(z.object({
    name: optText(120).refine((value) => !value || value.length >= 2, 'الاسم قصير.'),
    phone: optPhone,
    email: optEmail,
    password: optPassword,
  }), req.body);

  await tx(async (db) => {
    if (req.user.role === 'client') {
      const company = parse(z.object({
        brandName: optText(160),
        whatsapp: optPhone,
        contactEmail: optEmail,
        locationScope: enums.scope.optional(),
        governorateId: optId,
        countryId: optId,
      }), req.body);
      await updateUser(db, req.user.id, { name: base.name, phone: base.phone, password: base.password });
      await saveClientProfile(db, req.user.id, company);
    } else if (req.user.role === 'influencer') {
      const profile = parse(influencerProfile, req.body);
      const extra = parse(z.object({ whatsapp: optPhone, contactEmail: optEmail, availability: enums.availability.optional() }), req.body);
      await updateUser(db, req.user.id, { name: base.name, password: base.password });
      await saveInfluencerProfile(db, req.user.id, profile, extra);
      // Contact fields may be cleared on purpose.
      await db.query('UPDATE influencer_profiles SET whatsapp = $2, contact_email = $3 WHERE user_id = $1', [req.user.id, extra.whatsapp ?? null, extra.contactEmail ?? null]);
    } else {
      await updateUser(db, req.user.id, { name: base.name, phone: base.phone, email: base.email, password: base.password });
    }
  });
  send(res, await loadAccount(req.user.id));
}));

/** A normal account becomes a creator: same login, the profile goes to review. */
meRoutes.post('/become-influencer', handle(async (req, res) => {
  if (req.user.role !== 'user') throw forbidden(req.user.role === 'influencer' ? 'حسابك صانع محتوى أصلاً.' : 'هذه الخطوة للحسابات العادية فقط.');
  const profile = parse(influencerProfile, req.body);
  const extra = parse(z.object({ name: optText(120), whatsapp: optPhone, contactEmail: optEmail }), req.body);
  await tx(async (db) => {
    await saveInfluencerProfile(db, req.user.id, profile, extra);
    await db.query(
      "UPDATE users SET role = 'influencer', status = 'pending', name = COALESCE($2, name), updated_at = now() WHERE id = $1",
      [req.user.id, extra.name && extra.name.length >= 2 ? extra.name : null],
    );
  });
  send(res, await loadAccount(req.user.id));
}));

/** Requests sent by this account. Creators don't send requests, so theirs is empty. */
meRoutes.get('/requests', handle(async (req, res) => {
  if (req.user.role === 'influencer') return send(res, []);
  return send(res, await loadOrders({ where: 'r.requester_id = $1', params: [req.user.id] }));
}));

// ---- creator photo room ----
const creator = requireRole('influencer');

async function ownProfile(userId) {
  const [person] = await loadInfluencers([userId], { own: true });
  if (!person) throw notFound('ما عندك ملف صانع محتوى بعد.');
  return person;
}

meRoutes.get('/profile', creator, handle(async (req, res) => {
  send(res, await ownProfile(req.user.id));
}));

for (const slot of ['avatar', 'cover']) {
  meRoutes.post(`/${slot}`, creator, upload.single('image'), handle(async (req, res) => {
    if (!req.file) throw badRequest('اختر صورة.');
    const { rows } = await query(`SELECT ${slot} AS old FROM influencer_profiles WHERE user_id = $1`, [req.user.id]);
    await query(`UPDATE influencer_profiles SET ${slot} = $2 WHERE user_id = $1`, [req.user.id, publicPath(req.file)]);
    await removeUpload(rows[0]?.old);
    send(res, await ownProfile(req.user.id));
  }));

  meRoutes.delete(`/${slot}`, creator, handle(async (req, res) => {
    const { rows } = await query(`SELECT ${slot} AS old FROM influencer_profiles WHERE user_id = $1`, [req.user.id]);
    await query(`UPDATE influencer_profiles SET ${slot} = NULL WHERE user_id = $1`, [req.user.id]);
    await removeUpload(rows[0]?.old);
    send(res, await ownProfile(req.user.id));
  }));
}

meRoutes.post('/portfolio', creator, upload.array('images', config.portfolioLimit), handle(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw badRequest('اختر صورة وحدة على الأقل.');
  const { rows } = await query('SELECT count(*)::int AS n, COALESCE(max(sort_order), -1) AS last FROM portfolio_images WHERE user_id = $1', [req.user.id]);
  if (rows[0].n + files.length > config.portfolioLimit) {
    await Promise.all(files.map((file) => removeUpload(publicPath(file))));
    throw badRequest(`المعرض يتسع لـ ${config.portfolioLimit} صور فقط.`);
  }
  let order = rows[0].last;
  for (const file of files) {
    order += 1;
    await query('INSERT INTO portfolio_images (user_id, file_path, sort_order) VALUES ($1, $2, $3)', [req.user.id, publicPath(file), order]);
  }
  send(res, await ownProfile(req.user.id));
}));

meRoutes.delete('/portfolio/:id', creator, handle(async (req, res) => {
  const { rows } = await query('DELETE FROM portfolio_images WHERE id = $1 AND user_id = $2 RETURNING file_path', [Number(req.params.id), req.user.id]);
  if (!rows.length) throw notFound('الصورة غير موجودة.');
  await removeUpload(rows[0].file_path);
  send(res, await ownProfile(req.user.id));
}));
