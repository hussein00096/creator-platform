// End-to-end checks against a running API (npm run dev) and its database.
// Creates throwaway accounts with a unique suffix and deletes them afterwards.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { pool } from '../src/db/pool.js';

const BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 4000}/api/v1`;
const tag = String(Date.now()).slice(-7);
const phone = (n) => `0790${tag}${n}`;
const made = [];

async function call(path, { method = 'GET', body, token, form } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  const json = await res.json();
  return { status: res.status, ...json };
}

let admin;
let tree;
let govId;
const adult = '1995-05-05';

before(async () => {
  const login = await call('/auth/login', { method: 'POST', body: { phone: process.env.ADMIN_PHONE, password: process.env.ADMIN_PASSWORD } });
  assert.equal(login.status, 200, login.message);
  admin = login.data.token;
  tree = (await call('/categories')).data;
  govId = (await call('/governorates')).data[0].id;
});

after(async () => {
  if (made.length) await pool.query('DELETE FROM users WHERE id = ANY($1)', [made]);
  await pool.end();
});

const creatorFields = () => ({
  gender: 'female', birthDate: adult, heightCm: 168, weightKg: 58, skinTone: 'medium', hairColor: 'black', eyeColor: 'brown', hijab: 'no',
  experienceYears: 3, languages: ['العربية'], bio: 'صانعة محتوى أحب التصوير والقصص الحقيقية.', locationScope: 'inside_iraq',
  governorateId: String(govId), countryId: null, categoryIds: [tree[0].children[0].id], socialAccounts: [{ platform: 'instagram', handle: '@t' }],
});

test('reference data', async () => {
  assert.ok(tree.length >= 7 && tree[0].children.length > 0);
  assert.equal((await call('/countries')).data.find((c) => c.code === 'IQ').nameAr, 'العراق');
  const contact = await call('/platform-contact');
  assert.equal(contact.success, true);
});

test('normal user: sign up, log in by phone and e-mail, order at once, become a creator', async () => {
  const signup = await call('/auth/register/user', { method: 'POST', body: { name: 'مستخدم تجربة', phone: phone(1), email: `u${tag}@example.com`, password: 'secret123' } });
  assert.equal(signup.status, 201, signup.message);
  assert.equal(signup.data.user.role, 'user');
  assert.equal(signup.data.user.status, 'approved');
  made.push(signup.data.user.id);

  const dup = await call('/auth/register/user', { method: 'POST', body: { name: 'x y', phone: phone(1), password: 'secret123' } });
  assert.equal(dup.status, 409);

  const byMail = await call('/auth/login', { method: 'POST', body: { phone: `U${tag}@example.com`, password: 'secret123' } });
  assert.equal(byMail.status, 200, byMail.message);
  const bad = await call('/auth/login', { method: 'POST', body: { phone: phone(1), password: 'wrong-pass' } });
  assert.equal(bad.status, 401);
  const token = byMail.data.token;

  const order = await call('/ugc-requests', { method: 'POST', token, body: { title: 'حملة تجربة', productDescription: 'وصف المنتج للتجربة', executionDetails: 'فيديو قصير للتجربة', usagePlace: 'انستغرام', quantity: 2, influencerIds: [], externalNames: [{ name: 'ضيف', note: '' }] } });
  assert.equal(order.status, 201, order.message);
  const mine = await call('/me/requests', { token });
  assert.equal(mine.data.length, 1);
  assert.equal(mine.data[0].guests[0].name, 'ضيف');

  const upgraded = await call('/me/become-influencer', { method: 'POST', token, body: creatorFields() });
  assert.equal(upgraded.status, 200, upgraded.message);
  assert.equal(upgraded.data.role, 'influencer');
  assert.equal(upgraded.data.status, 'pending');
  assert.equal(upgraded.data.profile.categories.length, 1);

  const hidden = await call(`/influencers/${signup.data.user.id}`);
  assert.equal(hidden.status, 404, 'pending creators are not public');

  const approve = await call(`/admin/accounts/${signup.data.user.id}/status`, { method: 'PATCH', token: admin, body: { status: 'approved' } });
  assert.equal(approve.status, 200, approve.message);
  const shown = await call(`/influencers/${signup.data.user.id}`);
  assert.equal(shown.status, 200);
  assert.equal(shown.data.profile.whatsapp, undefined, 'private fields stay private');
  const listed = await call(`/influencers?categoryId=${tree[0].id}&limit=60`);
  assert.ok(listed.data.some((p) => p.id === signup.data.user.id), 'parent category filter matches');
  assert.ok(listed.meta.total >= 1);

  const form = new FormData();
  form.append('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'a.png');
  const avatar = await call('/me/avatar', { method: 'POST', token, form });
  assert.equal(avatar.status, 200, avatar.message);
  assert.match(avatar.data.profile.avatar, /^\/uploads\//);
  const file = await fetch(`${BASE.replace('/api/v1', '')}${avatar.data.profile.avatar}`);
  assert.equal(file.status, 200);
  const cleared = await call('/me/avatar', { method: 'DELETE', token });
  assert.equal(cleared.data.profile.avatar, null);
});

test('company: pending until approved, then can order and book a creator', async () => {
  const signup = await call('/auth/register/client', { method: 'POST', body: { name: 'شركة تجربة', phone: phone(2), password: 'secret123', brandName: 'علامة', whatsapp: '', contactEmail: '', locationScope: 'inside_iraq', governorateId: String(govId), countryId: null } });
  assert.equal(signup.status, 201, signup.message);
  made.push(signup.data.user.id);
  const token = (await call('/auth/login', { method: 'POST', body: { phone: phone(2), password: 'secret123' } })).data.token;

  const blocked = await call('/ugc-requests', { method: 'POST', token, body: { title: 'abc', productDescription: '1234567890', executionDetails: '1234567890', usagePlace: 'abc', quantity: 1 } });
  assert.equal(blocked.status, 403);

  await call(`/admin/accounts/${signup.data.user.id}/status`, { method: 'PATCH', token: admin, body: { status: 'approved' } });
  const account = await call('/me/account', { token });
  assert.equal(account.data.profile.brandName, 'علامة');
  const patched = await call('/me/account', { method: 'PATCH', token, body: { name: 'شركة معدلة', phone: phone(2), password: '', brandName: 'علامة٢', whatsapp: '', contactEmail: '', locationScope: 'inside_iraq', governorateId: String(govId), countryId: null } });
  assert.equal(patched.status, 200, patched.message);
  assert.equal(patched.data.profile.brandName, 'علامة٢');

  const creator = await call('/auth/register/influencer', { method: 'POST', body: { name: 'موهبة تجربة', phone: phone(3), password: 'secret123', ...creatorFields() } });
  assert.equal(creator.status, 201, creator.message);
  made.push(creator.data.user.id);
  await call(`/admin/accounts/${creator.data.user.id}/status`, { method: 'PATCH', token: admin, body: { status: 'approved' } });

  const booking = await call('/service-requests', { method: 'POST', token, body: { influencerUserId: creator.data.user.id, title: 'جلسة', details: 'تفاصيل الجلسة للتجربة' } });
  assert.equal(booking.status, 201, booking.message);

  const reject = await call(`/admin/requests/service/${booking.data.id}`, { method: 'PATCH', token: admin, body: { status: 'rejected' } });
  assert.equal(reject.status, 400, 'rejection needs a reason');
  const done = await call(`/admin/requests/service/${booking.data.id}`, { method: 'PATCH', token: admin, body: { status: 'rejected', rejectionReason: 'الموعد غير مناسب' } });
  assert.equal(done.data.status, 'rejected');
  const mine = await call('/me/requests', { token });
  assert.equal(mine.data[0].rejectionReason, 'الموعد غير مناسب');
  assert.equal(mine.data[0].faces[0].id, creator.data.user.id);
});

test('listing filters, sort and facets', async () => {
  const signup = await call('/auth/register/influencer', { method: 'POST', body: { name: 'فلتر تجربة', phone: phone(5), password: 'secret123', ...creatorFields(), socialAccounts: [{ platform: 'tiktok', handle: '@f' }] } });
  assert.equal(signup.status, 201, signup.message);
  const id = signup.data.user.id;
  made.push(id);
  await call(`/admin/accounts/${id}/status`, { method: 'PATCH', token: admin, body: { status: 'approved' } });

  const all = await call('/influencers?limit=60');
  assert.equal(typeof all.meta.available, 'number');
  const byPlatform = await call('/influencers?platform=tiktok&limit=60');
  assert.ok(byPlatform.data.some((p) => p.id === id));
  assert.ok(byPlatform.data.every((p) => p.profile.socialAccounts.some((s) => s.platform === 'tiktok')));
  const byCities = await call(`/influencers?governorateIds=${govId},999999&limit=60`);
  assert.ok(byCities.data.some((p) => p.id === id));
  const available = await call('/influencers?available=1&limit=60');
  assert.ok(available.data.every((p) => p.profile.availability === 'active'));
  assert.equal(available.meta.total, all.meta.available);
  const byName = await call('/influencers?sort=name&limit=60');
  // Compare with PostgreSQL's own collation (JS string order differs for Arabic).
  const expected = await pool.query("SELECT u.name FROM users u JOIN influencer_profiles p ON p.user_id = u.id WHERE u.role = 'influencer' AND u.status = 'approved' ORDER BY u.name ASC, u.id ASC LIMIT 60");
  assert.deepEqual(byName.data.map((p) => p.name), expected.rows.map((row) => row.name));
  assert.equal((await call('/influencers?sort=popular')).status, 200);

  const facets = await call('/influencers/facets');
  assert.equal(facets.data.total, all.meta.total);
  assert.ok(facets.data.governorates.some((g) => g.id === govId && g.count >= 1));
  assert.ok(facets.data.platforms.some((p) => p.platform === 'tiktok'));
  assert.ok(facets.data.categories.some((c) => c.id === tree[0].id), 'parent field counts included');
});

test('access control', async () => {
  assert.equal((await call('/me/account')).status, 401);
  assert.equal((await call('/admin/stats', { token: 'garbage' })).status, 401);
  const user = await call('/auth/register/user', { method: 'POST', body: { name: 'ثاني', email: `v${tag}@example.com`, password: 'secret123' } });
  made.push(user.data.user.id);
  assert.equal((await call('/admin/stats', { token: user.data.token })).status, 403);
  assert.equal((await call('/me/profile', { token: user.data.token })).status, 403);
  const minor = await call('/me/become-influencer', { method: 'POST', token: user.data.token, body: { ...creatorFields(), birthDate: '2015-01-01' } });
  assert.equal(minor.status, 400);
  assert.match(minor.message, /١٨/);
  assert.equal((await call('/nope')).status, 404);
});
