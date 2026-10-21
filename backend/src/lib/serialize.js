// Builds the JSON shapes the site expects (see the site's lib/types.ts).
import { pool } from '../db/pool.js';
import { toAccount } from './auth.js';

export function category(row) {
  return { id: row.id, parentId: row.parent_id, nameAr: row.name_ar, slug: row.slug, image: row.image };
}

function place(id, nameAr, nameEn, extra) {
  if (!id) return null;
  return { id, nameAr, nameEn, ...extra };
}

const PROFILE_SQL = `
  SELECT u.id, u.name, u.status, p.*,
         g.id AS g_id, g.name_ar AS g_name_ar, g.name_en AS g_name_en, g.slug AS g_slug,
         c.id AS c_id, c.name_ar AS c_name_ar, c.name_en AS c_name_en, c.code AS c_code
  FROM users u
  JOIN influencer_profiles p ON p.user_id = u.id
  LEFT JOIN governorates g ON g.id = p.governorate_id
  LEFT JOIN countries c ON c.id = p.country_id
  WHERE u.id = ANY($1)`;

/**
 * Loads creators by id, in the given order. `own` includes private contact fields
 * (WhatsApp, e-mail, birth date) that are never sent to the public listing.
 */
export async function loadInfluencers(ids, { own = false } = {}, db = pool) {
  if (!ids.length) return [];
  const [base, cats, socials, shots] = await Promise.all([
    db.query(PROFILE_SQL, [ids]),
    db.query(`SELECT ic.user_id, c.* FROM influencer_categories ic JOIN categories c ON c.id = ic.category_id
              WHERE ic.user_id = ANY($1) ORDER BY c.sort_order, c.id`, [ids]),
    db.query('SELECT * FROM social_accounts WHERE user_id = ANY($1) ORDER BY id', [ids]),
    db.query('SELECT * FROM portfolio_images WHERE user_id = ANY($1) ORDER BY sort_order, id', [ids]),
  ]);
  const group = (rows) => rows.reduce((map, row) => map.set(row.user_id, [...(map.get(row.user_id) || []), row]), new Map());
  const catBy = group(cats.rows);
  const socialBy = group(socials.rows);
  const shotBy = group(shots.rows);
  const byId = new Map(base.rows.map((row) => [row.id, row]));

  return ids.filter((id) => byId.has(id)).map((id) => {
    const row = byId.get(id);
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      profile: {
        bio: row.bio,
        gender: row.gender,
        birthDate: own ? row.birth_date : '',
        heightCm: row.height_cm,
        weightKg: row.weight_kg,
        skinTone: row.skin_tone,
        hairColor: row.hair_color,
        eyeColor: row.eye_color,
        hijab: row.hijab,
        experienceYears: row.experience_years,
        languages: row.languages || [],
        locationScope: row.location_scope,
        governorate: place(row.g_id, row.g_name_ar, row.g_name_en, { slug: row.g_slug }),
        country: place(row.c_id, row.c_name_ar, row.c_name_en, { code: row.c_code }),
        categories: (catBy.get(id) || []).map(category),
        socialAccounts: (socialBy.get(id) || []).map((item) => ({ id: item.id, platform: item.platform, handle: item.handle })),
        avatar: row.avatar,
        cover: row.cover,
        portfolio: (shotBy.get(id) || []).map((item) => ({ id: item.id, filePath: item.file_path, sortOrder: item.sort_order })),
        availability: row.availability,
        ...(own ? { whatsapp: row.whatsapp, contactEmail: row.contact_email } : {}),
      },
    };
  });
}

/** The signed-in user's own account with the profile that matches their role (`OwnAccount`). */
export async function loadAccount(userId, db = pool) {
  const { rows } = await db.query('SELECT id, name, role, email, phone, status FROM users WHERE id = $1', [userId]);
  if (!rows.length) return null;
  const user = rows[0];
  let profile = null;
  if (user.role === 'client') {
    const result = await db.query(
      `SELECT p.*, g.name_ar AS g_name_ar, g.name_en AS g_name_en, g.slug AS g_slug, c.name_ar AS c_name_ar, c.name_en AS c_name_en, c.code AS c_code
       FROM client_profiles p LEFT JOIN governorates g ON g.id = p.governorate_id LEFT JOIN countries c ON c.id = p.country_id
       WHERE p.user_id = $1`, [userId]);
    const row = result.rows[0];
    profile = row ? {
      brandName: row.brand_name,
      whatsapp: row.whatsapp,
      contactEmail: row.contact_email,
      locationScope: row.location_scope || undefined,
      governorate: place(row.governorate_id, row.g_name_ar, row.g_name_en, { slug: row.g_slug }),
      country: place(row.country_id, row.c_name_ar, row.c_name_en, { code: row.c_code }),
    } : null;
  } else if (user.role === 'influencer') {
    const [person] = await loadInfluencers([userId], { own: true }, db);
    profile = person?.profile || null;
  }
  return { ...toAccount(user), profile };
}

/**
 * Requests in the site's `OwnOrder` shape. `where` filters on the request alias `r`
 * (e.g. 'r.requester_id = $1'); `withRequester` adds who sent it (admin view).
 */
export async function loadOrders({ where = 'TRUE', params = [], withRequester = false } = {}, db = pool) {
  const requester = withRequester ? ', u.id AS u_id, u.name AS u_name, u.role AS u_role, u.phone AS u_phone, u.email AS u_email' : '';
  const join = withRequester ? 'JOIN users u ON u.id = r.requester_id' : '';
  const [ugc, service] = await Promise.all([
    db.query(`SELECT r.*${requester} FROM ugc_requests r ${join} WHERE ${where}`, params),
    db.query(`SELECT r.*, i.name AS influencer_name${requester} FROM service_requests r JOIN users i ON i.id = r.influencer_id ${join} WHERE ${where}`, params),
  ]);
  const ugcIds = ugc.rows.map((row) => row.id);
  const [faces, guests] = ugcIds.length ? await Promise.all([
    db.query('SELECT f.request_id, u.id, u.name FROM ugc_request_faces f JOIN users u ON u.id = f.influencer_id WHERE f.request_id = ANY($1)', [ugcIds]),
    db.query('SELECT request_id, name, note FROM ugc_request_guests WHERE request_id = ANY($1) ORDER BY id', [ugcIds]),
  ]) : [{ rows: [] }, { rows: [] }];

  const who = (row) => (withRequester ? { requester: { id: row.u_id, name: row.u_name, role: row.u_role, phone: row.u_phone, email: row.u_email } } : {});
  const stamp = (row) => ({ createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });

  const list = [
    ...ugc.rows.map((row) => ({
      kind: 'ugc',
      id: row.id,
      title: row.title,
      status: row.status,
      rejectionReason: row.rejection_reason,
      ...stamp(row),
      productDescription: row.product_description,
      executionDetails: row.execution_details,
      usagePlace: row.usage_place,
      quantity: row.quantity,
      details: null,
      faces: faces.rows.filter((face) => face.request_id === row.id).map((face) => ({ id: face.id, name: face.name })),
      guests: guests.rows.filter((guest) => guest.request_id === row.id).map((guest) => ({ name: guest.name, note: guest.note })),
      ...who(row),
    })),
    ...service.rows.map((row) => ({
      kind: 'service',
      id: row.id,
      title: row.title,
      status: row.status,
      rejectionReason: row.rejection_reason,
      ...stamp(row),
      details: row.details,
      faces: [{ id: row.influencer_id, name: row.influencer_name }],
      guests: [],
      ...who(row),
    })),
  ];
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
