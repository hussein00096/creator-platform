import { Router } from 'express';
import { query, tx } from '../db/pool.js';
import { canOrder, requireAuth } from '../lib/auth.js';
import { badRequest, forbidden, handle, send } from '../lib/http.js';
import { optText, parse, text, z } from '../lib/validate.js';

export const requestRoutes = Router();

function mayOrder(user) {
  if (canOrder(user)) return;
  if (user.role === 'client') throw forbidden('حسابك قيد المراجعة. تكدر تطلب بعد ما نعتمده.');
  throw forbidden('الطلبات متاحة للحسابات العادية وحسابات الشركات.');
}

/** UGC content request; optional chosen creators and outside names. */
requestRoutes.post('/ugc-requests', requireAuth, handle(async (req, res) => {
  mayOrder(req.user);
  const body = parse(z.object({
    title: text(3, 200, 'اكتب اسم المشروع.'),
    productDescription: text(10, 4000, 'اكتب عن المنتج (١٠ أحرف على الأقل).'),
    executionDetails: text(10, 4000, 'اكتب رؤية التنفيذ (١٠ أحرف على الأقل).'),
    usagePlace: text(3, 400, 'اكتب وين راح ينشر المحتوى.'),
    quantity: z.preprocess(Number, z.number().int().min(1).max(200)),
    influencerIds: z.array(z.preprocess(Number, z.number().int().positive())).max(200).default([]),
    externalNames: z.array(z.object({ name: text(1, 160), note: optText(400) })).max(50).default([]),
  }), req.body);

  const ids = [...new Set(body.influencerIds)];
  if (ids.length) {
    const { rows } = await query("SELECT id FROM users WHERE id = ANY($1) AND role = 'influencer' AND status = 'approved'", [ids]);
    if (rows.length !== ids.length) throw badRequest('بعض الوجوه المختارة غير متاحة.');
  }
  const id = await tx(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO ugc_requests (requester_id, title, product_description, execution_details, usage_place, quantity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, body.title, body.productDescription, body.executionDetails, body.usagePlace, body.quantity],
    );
    const requestId = rows[0].id;
    if (ids.length) await db.query('INSERT INTO ugc_request_faces (request_id, influencer_id) SELECT $1, unnest($2::int[])', [requestId, ids]);
    for (const guest of body.externalNames) {
      await db.query('INSERT INTO ugc_request_guests (request_id, name, note) VALUES ($1, $2, $3)', [requestId, guest.name, guest.note ?? null]);
    }
    return requestId;
  });
  send(res, { id }, undefined, 201);
}));

/** Booking request for one creator (from their profile page). */
requestRoutes.post('/service-requests', requireAuth, handle(async (req, res) => {
  mayOrder(req.user);
  const body = parse(z.object({
    influencerUserId: z.preprocess(Number, z.number().int().positive()),
    title: text(1, 200, 'اكتب عنوان الطلب.'),
    details: text(10, 4000, 'صِف المشروع (١٠ أحرف على الأقل).'),
  }), req.body);
  const { rows } = await query("SELECT p.availability FROM users u JOIN influencer_profiles p ON p.user_id = u.id WHERE u.id = $1 AND u.role = 'influencer' AND u.status = 'approved'", [body.influencerUserId]);
  if (!rows.length) throw badRequest('هذه الموهبة غير متاحة.');
  if (rows[0].availability === 'paused') throw badRequest('هذه الموهبة في استراحة حالياً.');
  const created = await query(
    'INSERT INTO service_requests (requester_id, influencer_id, title, details) VALUES ($1, $2, $3, $4) RETURNING id',
    [req.user.id, body.influencerUserId, body.title, body.details],
  );
  send(res, { id: created.rows[0].id }, undefined, 201);
}));
