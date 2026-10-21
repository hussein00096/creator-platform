import { Router } from 'express';
import { query } from '../db/pool.js';
import { handle, notFound, paging, send } from '../lib/http.js';
import { category, loadInfluencers } from '../lib/serialize.js';

export const publicRoutes = Router();

/** Categories as a two-level tree: parents with `children`. */
export async function categoryTree() {
  const { rows } = await query('SELECT * FROM categories ORDER BY sort_order, id');
  const parents = rows.filter((row) => row.parent_id === null).map((row) => ({ ...category(row), children: [] }));
  const byId = new Map(parents.map((item) => [item.id, item]));
  rows.filter((row) => row.parent_id !== null).forEach((row) => byId.get(row.parent_id)?.children.push(category(row)));
  return parents;
}

publicRoutes.get('/categories', handle(async (req, res) => {
  send(res, await categoryTree());
}));

publicRoutes.get('/governorates', handle(async (req, res) => {
  const { rows } = await query('SELECT id, name_ar, name_en, slug FROM governorates ORDER BY id');
  send(res, rows.map((row) => ({ id: row.id, nameAr: row.name_ar, nameEn: row.name_en, slug: row.slug })));
}));

publicRoutes.get('/countries', handle(async (req, res) => {
  const { rows } = await query('SELECT id, name_ar, name_en, code FROM countries ORDER BY id');
  send(res, rows.map((row) => ({ id: row.id, nameAr: row.name_ar, nameEn: row.name_en, code: row.code })));
}));

export function contactShape(row) {
  if (!row) return null;
  return {
    companyName: row.company_name, phone: row.phone, whatsapp: row.whatsapp, email: row.email, address: row.address,
    website: row.website, instagram: row.instagram, tiktok: row.tiktok, facebook: row.facebook, snapchat: row.snapchat, xAccount: row.x_account,
  };
}

publicRoutes.get('/platform-contact', handle(async (req, res) => {
  const { rows } = await query('SELECT * FROM platform_contact WHERE id = 1');
  send(res, contactShape(rows[0]));
}));

/**
 * Approved creators with filters used by the directory:
 * search (name or specialty), categoryId (a specialty or a whole field), locationScope, gender,
 * governorateId or governorateIds (comma list), platform (comma list), available=1, and
 * sort = newest (default) | oldest | name | popular (most requests received).
 * meta also carries `available`: how many of the matches currently accept work.
 */
const PLATFORMS = new Set(['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat', 'x']);
const ids = (value) => String(value || '').split(',').map(Number).filter((id) => Number.isInteger(id) && id > 0);

function creatorFilters(q, { skipAvailable = false } = {}) {
  const where = ["u.role = 'influencer'", "u.status = 'approved'"];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };

  const search = String(q.search || '').trim();
  if (search) {
    add(`(u.name ILIKE ? OR EXISTS (SELECT 1 FROM influencer_categories ic JOIN categories c ON c.id = ic.category_id
          LEFT JOIN categories cp ON cp.id = c.parent_id WHERE ic.user_id = u.id AND (c.name_ar ILIKE ? OR cp.name_ar ILIKE ?)))`, `%${search}%`);
  }
  const categoryId = Number(q.categoryId);
  if (Number.isInteger(categoryId) && categoryId > 0) {
    add(`EXISTS (SELECT 1 FROM influencer_categories ic JOIN categories c ON c.id = ic.category_id
          WHERE ic.user_id = u.id AND (c.id = ? OR c.parent_id = ?))`, categoryId);
  }
  if (q.locationScope === 'inside_iraq' || q.locationScope === 'outside_iraq') add('p.location_scope = ?', q.locationScope);
  if (q.gender === 'male' || q.gender === 'female') add('p.gender = ?', q.gender);
  const governorates = [...new Set([...ids(q.governorateId), ...ids(q.governorateIds)])];
  if (governorates.length) add('p.governorate_id = ANY(?)', governorates);
  const platforms = String(q.platform || '').split(',').filter((item) => PLATFORMS.has(item));
  if (platforms.length) add('EXISTS (SELECT 1 FROM social_accounts s WHERE s.user_id = u.id AND s.platform = ANY(?))', platforms);
  if (!skipAvailable && (q.available === '1' || q.available === 'true')) where.push("p.availability = 'active'");

  return { from: `FROM users u JOIN influencer_profiles p ON p.user_id = u.id WHERE ${where.join(' AND ')}`, params };
}

const POPULARITY = `((SELECT count(*) FROM service_requests s WHERE s.influencer_id = u.id)
  + (SELECT count(*) FROM ugc_request_faces f WHERE f.influencer_id = u.id))`;
const SORTS = {
  newest: 'u.created_at DESC, u.id DESC',
  oldest: 'u.created_at ASC, u.id ASC',
  name: 'u.name ASC, u.id ASC',
  popular: `${POPULARITY} DESC, u.created_at DESC, u.id DESC`,
};

publicRoutes.get('/influencers', handle(async (req, res) => {
  const { page, limit, offset } = paging(req, 18, 60);
  const { from, params } = creatorFilters(req.query);
  const loose = creatorFilters(req.query, { skipAvailable: true });
  const order = SORTS[req.query.sort] || SORTS.newest;
  const [count, available, rows] = await Promise.all([
    query(`SELECT count(*)::int AS total ${from}`, params),
    query(`SELECT count(*)::int AS n ${loose.from} AND p.availability = 'active'`, loose.params),
    query(`SELECT u.id ${from} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`, params),
  ]);
  const people = await loadInfluencers(rows.rows.map((row) => row.id));
  send(res, people, { page, limit, total: count.rows[0].total, available: available.rows[0].n });
}));

/** Counts over all public creators, for filter labels: total, available, per city, platform and category. */
publicRoutes.get('/influencers/facets', handle(async (req, res) => {
  const base = "FROM users u JOIN influencer_profiles p ON p.user_id = u.id WHERE u.role = 'influencer' AND u.status = 'approved'";
  const [totals, cities, platforms, categories] = await Promise.all([
    query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE p.availability = 'active')::int AS available ${base}`),
    query(`SELECT p.governorate_id AS id, count(*)::int AS count ${base} AND p.governorate_id IS NOT NULL GROUP BY p.governorate_id ORDER BY count DESC`),
    query(`SELECT s.platform, count(DISTINCT u.id)::int AS count FROM social_accounts s JOIN users u ON u.id = s.user_id
           JOIN influencer_profiles p ON p.user_id = u.id WHERE u.role = 'influencer' AND u.status = 'approved' GROUP BY s.platform ORDER BY count DESC`),
    query(`SELECT x.id, count(DISTINCT x.user_id)::int AS count FROM (
             SELECT c.id, ic.user_id FROM influencer_categories ic JOIN categories c ON c.id = ic.category_id
             UNION ALL SELECT c.parent_id, ic.user_id FROM influencer_categories ic JOIN categories c ON c.id = ic.category_id WHERE c.parent_id IS NOT NULL
           ) x JOIN users u ON u.id = x.user_id WHERE u.role = 'influencer' AND u.status = 'approved' GROUP BY x.id`),
  ]);
  send(res, {
    total: totals.rows[0].total,
    available: totals.rows[0].available,
    governorates: cities.rows,
    platforms: platforms.rows,
    categories: categories.rows,
  });
}));

publicRoutes.get('/influencers/:id', handle(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound('هذه الموهبة غير موجودة.');
  const { rows } = await query("SELECT id FROM users WHERE id = $1 AND role = 'influencer' AND status = 'approved'", [id]);
  if (!rows.length) throw notFound('هذه الموهبة غير موجودة.');
  const [person] = await loadInfluencers([id]);
  if (!person) throw notFound('هذه الموهبة غير موجودة.');
  send(res, person);
}));
