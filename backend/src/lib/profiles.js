// Writes creator and company profiles; shared by sign-up, upgrade, account edits and admin.
import { badRequest } from './http.js';

/** Throws 400 when a referenced category, governorate or country does not exist. */
async function checkRefs(db, data) {
  if (data.categoryIds?.length) {
    const { rows } = await db.query('SELECT id FROM categories WHERE id = ANY($1) AND parent_id IS NOT NULL', [data.categoryIds]);
    if (rows.length !== new Set(data.categoryIds).size) throw badRequest('اختر تخصصات من القائمة.');
  }
  if (data.locationScope === 'inside_iraq' && data.governorateId) {
    const { rows } = await db.query('SELECT 1 FROM governorates WHERE id = $1', [data.governorateId]);
    if (!rows.length) throw badRequest('اختر المحافظة.');
  }
  if (data.locationScope === 'outside_iraq' && data.countryId) {
    const { rows } = await db.query('SELECT 1 FROM countries WHERE id = $1', [data.countryId]);
    if (!rows.length) throw badRequest('اختر الدولة.');
  }
}

/** Creates or replaces a creator profile, its specialties and social accounts. */
export async function saveInfluencerProfile(db, userId, data, extra = {}) {
  await checkRefs(db, data);
  const inside = data.locationScope === 'inside_iraq';
  await db.query(
    `INSERT INTO influencer_profiles (user_id, bio, gender, birth_date, height_cm, weight_kg, skin_tone, hair_color, eye_color, hijab,
       experience_years, languages, location_scope, governorate_id, country_id, availability, whatsapp, contact_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,COALESCE($16,'active'),$17,$18)
     ON CONFLICT (user_id) DO UPDATE SET bio = $2, gender = $3, birth_date = $4, height_cm = $5, weight_kg = $6, skin_tone = $7,
       hair_color = $8, eye_color = $9, hijab = $10, experience_years = $11, languages = $12, location_scope = $13,
       governorate_id = $14, country_id = $15, availability = COALESCE($16, influencer_profiles.availability),
       whatsapp = COALESCE($17, influencer_profiles.whatsapp), contact_email = COALESCE($18, influencer_profiles.contact_email)`,
    [
      userId, data.bio, data.gender, data.birthDate, data.heightCm ?? null, data.weightKg ?? null, data.skinTone ?? null,
      data.hairColor ?? null, data.eyeColor ?? null, data.gender === 'male' ? 'not_applicable' : data.hijab ?? null,
      data.experienceYears ?? 0, data.languages, data.locationScope, inside ? data.governorateId : null, inside ? null : data.countryId,
      extra.availability ?? null, extra.whatsapp ?? null, extra.contactEmail ?? null,
    ],
  );
  await db.query('DELETE FROM influencer_categories WHERE user_id = $1', [userId]);
  await db.query('INSERT INTO influencer_categories (user_id, category_id) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING', [userId, data.categoryIds]);
  await db.query('DELETE FROM social_accounts WHERE user_id = $1', [userId]);
  for (const item of data.socialAccounts) {
    await db.query('INSERT INTO social_accounts (user_id, platform, handle) VALUES ($1, $2, $3)', [userId, item.platform, item.handle]);
  }
}

/** Creates or updates a company profile. */
export async function saveClientProfile(db, userId, data) {
  await checkRefs(db, data);
  const inside = data.locationScope === 'inside_iraq';
  await db.query(
    `INSERT INTO client_profiles (user_id, brand_name, whatsapp, contact_email, location_scope, governorate_id, country_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (user_id) DO UPDATE SET brand_name = $2, whatsapp = $3, contact_email = $4, location_scope = $5, governorate_id = $6, country_id = $7`,
    [userId, data.brandName ?? null, data.whatsapp ?? null, data.contactEmail ?? null, data.locationScope ?? null,
      inside ? data.governorateId ?? null : null, data.locationScope === 'outside_iraq' ? data.countryId ?? null : null],
  );
}
