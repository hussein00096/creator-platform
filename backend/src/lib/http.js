// Response envelope used by the site: { success, data, meta? } / { success: false, message }.
// Messages are Arabic because the site shows them to visitors as-is.

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = 'سجّل الدخول أولاً.') => new HttpError(401, message);
export const forbidden = (message = 'ما عندك صلاحية لهذا الإجراء.') => new HttpError(403, message);
export const notFound = (message = 'غير موجود.') => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);

export function send(res, data, meta, status = 200) {
  res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}

/** Express 4 does not catch rejected promises; this forwards them to the error handler. */
export const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'حجم الصورة أكبر من المسموح.' });
  if (error?.code === 'LIMIT_UNEXPECTED_FILE' || error?.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, message: 'عدد الصور أكثر من المسموح.' });
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'صيغة الطلب غير صحيحة.' });
  console.error(error);
  return res.status(500).json({ success: false, message: 'صار خطأ بالخادم. حاول مرة ثانية.' });
}

/** Pagination from ?page&limit with sane bounds. */
export function paging(req, fallback = 18, max = 60) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(max, Math.max(1, Number.parseInt(req.query.limit, 10) || fallback));
  return { page, limit, offset: (page - 1) * limit };
}
