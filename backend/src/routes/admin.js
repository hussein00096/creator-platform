import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../lib/auth.js';
import { badRequest, conflict, handle, notFound, paging, send } from '../lib/http.js';
import { category, loadAccount, loadOrders } from '../lib/serialize.js';
import { enums, optId, optText, parse, text, z } from '../lib/validate.js';
import { categoryTree, contactShape } from './public.js';

export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRole('admin'));

adminRoutes.get('/stats', handle(async (req, res) => {
  const [accounts, ugc, service] = await Promise.all([
    query('SELECT role, status, count(*)::int AS n FROM users GROUP BY role, status'),
    query('SELECT status, count(*)::int AS n FROM ugc_requests GROUP BY status'),
    query('SELECT status, count(*)::int AS n FROM service_requests GROUP BY status'),
  ]);
  const requests = {};
  [...ugc.rows, ...service.rows].forEach((row) => { requests[row.status] = (requests[row.status] || 0) + row.n; });
  send(res, { accounts: accounts.rows, requests });
}));

// ---- accounts ----
adminRoutes.get('/accounts', handle(async (req, res) => {
  const { page, limit, offset } = paging(req, 25, 100);
  const where = ["u.role <> 'admin'"];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };
  if (['user', 'client', 'influencer'].includes(req.query.role)) add('u.role = ?', req.query.role);
  if (['pending', 'approved', 'rejected', 'suspended'].includes(req.query.status)) add('u.status = ?', req.query.status);
  const search = String(req.query.search || '').trim();
  if (search) add('(u.name ILIKE ? OR u.phone ILIKE ? OR u.email ILIKE ? OR cp.brand_name ILIKE ?)', `%${search}%`);
  const from = `FROM users u LEFT JOIN client_profiles cp ON cp.user_id = u.id WHERE ${where.join(' AND ')}`;
  const [count, rows] = await Promise.all([
    query(`SELECT count(*)::int AS total ${from}`, params),
    query(`SELECT u.id, u.name, u.role, u.status, u.status_reason, u.phone, u.email, u.created_at, cp.brand_name ${from}
           ORDER BY (u.status = 'pending') DESC, u.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
  ]);
  send(res, rows.rows.map((row) => ({
    id: row.id, name: row.name, role: row.role, status: row.status, statusReason: row.status_reason,
    phone: row.phone, email: row.email, brandName: row.brand_name, createdAt: row.created_at.toISOString(),
  })), { page, limit, total: count.rows[0].total });
}));

adminRoutes.get('/accounts/:id', handle(async (req, res) => {
  const account = await loadAccount(Number(req.params.id));
  if (!account || account.role === 'admin') throw notFound('الحساب غير موجود.');
  const { rows } = await query('SELECT status_reason, created_at FROM users WHERE id = $1', [account.id]);
  send(res, { ...account, statusReason: rows[0].status_reason, createdAt: rows[0].created_at.toISOString() });
}));

/** Approve, reject, suspend or reopen an account. */
adminRoutes.patch('/accounts/:id/status', handle(async (req, res) => {
  const body = parse(z.object({ status: enums.accountStatus, reason: optText(500) }), req.body);
  const { rows } = await query(
    "UPDATE users SET status = $2, status_reason = $3, updated_at = now() WHERE id = $1 AND role <> 'admin' RETURNING id",
    [Number(req.params.id), body.status, body.reason ?? null],
  );
  if (!rows.length) throw notFound('الحساب غير موجود.');
  const meta = await query('SELECT status_reason, created_at FROM users WHERE id = $1', [rows[0].id]);
  send(res, { ...(await loadAccount(rows[0].id)), statusReason: meta.rows[0].status_reason, createdAt: meta.rows[0].created_at.toISOString() });
}));

// ---- requests ----
adminRoutes.get('/requests', handle(async (req, res) => {
  const { page, limit, offset } = paging(req, 25, 100);
  const parts = [];
  const params = [];
  // status may be a comma list, e.g. "pending,reviewing" for open requests
  const statuses = String(req.query.status || '').split(',').filter((value) => enums.requestStatus.safeParse(value).success);
  if (statuses.length) {
    params.push(statuses);
    parts.push(`r.status = ANY($${params.length})`);
  }
  let list = await loadOrders({ where: parts.join(' AND ') || 'TRUE', params, withRequester: true });
  if (req.query.kind === 'ugc' || req.query.kind === 'service') list = list.filter((item) => item.kind === req.query.kind);
  send(res, list.slice(offset, offset + limit), { page, limit, total: list.length });
}));

adminRoutes.patch('/requests/:kind/:id', handle(async (req, res) => {
  const table = req.params.kind === 'ugc' ? 'ugc_requests' : req.params.kind === 'service' ? 'service_requests' : null;
  if (!table) throw notFound('نوع الطلب غير معروف.');
  const body = parse(z.object({ status: enums.requestStatus, rejectionReason: optText(1000) }), req.body);
  if (body.status === 'rejected' && !body.rejectionReason) throw badRequest('اكتب سبب الاعتذار.');
  const { rows } = await query(
    `UPDATE ${table} SET status = $2, rejection_reason = $3, updated_at = now() WHERE id = $1 RETURNING id`,
    [Number(req.params.id), body.status, body.status === 'rejected' ? body.rejectionReason : null],
  );
  if (!rows.length) throw notFound('الطلب غير موجود.');
  const [item] = await loadOrders({ where: 'r.id = $1', params: [rows[0].id], withRequester: true }).then((list) => list.filter((entry) => entry.kind === req.params.kind));
  send(res, item);
}));

// ---- categories ----
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'المعرّف بالإنجليزي: أحرف صغيرة وأرقام وشرطات فقط.').max(80);

adminRoutes.get('/categories', handle(async (req, res) => {
  send(res, await categoryTree());
}));

adminRoutes.post('/categories', handle(async (req, res) => {
  const body = parse(z.object({ nameAr: text(2, 120, 'اكتب اسم التصنيف.'), slug, parentId: optId, image: optText(500) }), req.body);
  if (body.parentId) {
    const parent = await query('SELECT parent_id FROM categories WHERE id = $1', [body.parentId]);
    if (!parent.rows.length || parent.rows[0].parent_id !== null) throw badRequest('اختر مجالاً رئيسياً كأب.');
  }
  try {
    const { rows } = await query(
      `INSERT INTO categories (parent_id, name_ar, slug, image, sort_order)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(max(sort_order), -1) + 1 FROM categories WHERE parent_id IS NOT DISTINCT FROM $1)) RETURNING *`,
      [body.parentId ?? null, body.nameAr, body.slug, body.image ?? null],
    );
    send(res, category(rows[0]), undefined, 201);
  } catch (error) {
    if (error.code === '23505') throw conflict('هذا المعرّف مستخدم.');
    throw error;
  }
}));

adminRoutes.patch('/categories/:id', handle(async (req, res) => {
  const body = parse(z.object({ nameAr: optText(120), slug: slug.optional(), image: optText(500), sortOrder: z.number().int().optional() }), req.body);
  try {
    const { rows } = await query(
      `UPDATE categories SET name_ar = COALESCE($2, name_ar), slug = COALESCE($3, slug), image = CASE WHEN $5 THEN $4 ELSE image END,
         sort_order = COALESCE($6, sort_order) WHERE id = $1 RETURNING *`,
      [Number(req.params.id), body.nameAr ?? null, body.slug ?? null, body.image ?? null, 'image' in (req.body || {}), body.sortOrder ?? null],
    );
    if (!rows.length) throw notFound('التصنيف غير موجود.');
    send(res, category(rows[0]));
  } catch (error) {
    if (error.code === '23505') throw conflict('هذا المعرّف مستخدم.');
    throw error;
  }
}));

adminRoutes.delete('/categories/:id', handle(async (req, res) => {
  const id = Number(req.params.id);
  const used = await query(
    'SELECT count(*)::int AS n FROM influencer_categories ic JOIN categories c ON c.id = ic.category_id WHERE c.id = $1 OR c.parent_id = $1',
    [id],
  );
  if (used.rows[0].n) throw conflict(`ما ينحذف: ${used.rows[0].n} صانع محتوى يستخدم هذا التصنيف.`);
  const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [id]);
  if (!rowCount) throw notFound('التصنيف غير موجود.');
  send(res, { id });
}));

// ---- platform contact ----
adminRoutes.put('/platform-contact', handle(async (req, res) => {
  const field = z.preprocess((value) => value ?? '', z.string().trim().max(500));
  const body = parse(z.object({
    companyName: field, phone: field, whatsapp: field, email: field, address: field, website: field,
    instagram: field, tiktok: field, facebook: field, snapchat: field, xAccount: field,
  }), req.body);
  const { rows } = await query(
    `INSERT INTO platform_contact (id, company_name, phone, whatsapp, email, address, website, instagram, tiktok, facebook, snapchat, x_account)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET company_name = $1, phone = $2, whatsapp = $3, email = $4, address = $5, website = $6,
       instagram = $7, tiktok = $8, facebook = $9, snapchat = $10, x_account = $11 RETURNING *`,
    [body.companyName, body.phone, body.whatsapp, body.email, body.address, body.website, body.instagram, body.tiktok, body.facebook, body.snapchat, body.xAccount],
  );
  send(res, contactShape(rows[0]));
}));
