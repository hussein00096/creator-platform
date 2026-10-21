import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config.js';
import { badRequest } from './http.js';

const types = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination(req, file, done) {
    const dir = path.join(config.uploadDir, String(req.user.id));
    fs.mkdir(dir, { recursive: true }, (error) => done(error, dir));
  },
  filename(req, file, done) {
    done(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${types[file.mimetype]}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter(req, file, done) {
    if (!types[file.mimetype]) return done(badRequest('الصور المسموحة: JPG أو PNG أو WEBP.'));
    return done(null, true);
  },
});

/** Public URL for a stored file, served by the site through its /uploads rewrite. */
export function publicPath(file) {
  return `/uploads/${path.relative(config.uploadDir, file.path).split(path.sep).join('/')}`;
}

/** Deletes a previously stored upload; ignores paths outside the upload dir and missing files. */
export async function removeUpload(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  const target = path.resolve(config.uploadDir, publicUrl.slice('/uploads/'.length));
  if (!target.startsWith(config.uploadDir + path.sep)) return;
  await fsp.unlink(target).catch(() => undefined);
}
