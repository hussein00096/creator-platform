// Idempotent seed: reference data, the contact row, and the admin account from .env.
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { hashPassword } from '../lib/auth.js';
import { categories, countries, governorates } from './data.js';
import { pool, tx } from './pool.js';

export async function seed() {
  await tx(async (db) => {
    let order = 0;
    for (const parent of categories) {
      const { rows } = await db.query(
        `INSERT INTO categories (parent_id, name_ar, slug, sort_order) VALUES (NULL, $1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`,
        [parent.nameAr, parent.slug, order++],
      );
      let childOrder = 0;
      for (const [slug, nameAr] of parent.children) {
        await db.query(
          `INSERT INTO categories (parent_id, name_ar, slug, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING`,
          [rows[0].id, nameAr, slug, childOrder++],
        );
      }
    }
    for (const [slug, nameAr, nameEn] of governorates) {
      await db.query('INSERT INTO governorates (slug, name_ar, name_en) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING', [slug, nameAr, nameEn]);
    }
    for (const [code, nameAr, nameEn] of countries) {
      await db.query('INSERT INTO countries (code, name_ar, name_en) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING', [code, nameAr, nameEn]);
    }
    await db.query("INSERT INTO platform_contact (id, company_name) VALUES (1, 'بريق') ON CONFLICT (id) DO NOTHING");

    const { phone, email, password, name } = config.admin;
    if ((phone || email) && password) {
      const existing = await db.query('SELECT id FROM users WHERE phone = $1 OR email = $2', [phone || null, email ? email.toLowerCase() : null]);
      if (!existing.rows.length) {
        await db.query(
          "INSERT INTO users (name, phone, email, password_hash, role, status) VALUES ($1, $2, $3, $4, 'admin', 'approved')",
          [name, phone || null, email ? email.toLowerCase() : null, await hashPassword(password)],
        );
        console.log('created admin account');
      }
    } else {
      console.warn('ADMIN_PHONE/ADMIN_EMAIL and ADMIN_PASSWORD not set — no admin account created');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => console.log('seed complete'))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
