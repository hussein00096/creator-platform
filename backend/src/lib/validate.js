import { z } from 'zod';
import { badRequest } from './http.js';

const labels = {
  name: 'الاسم', phone: 'رقم الهاتف', email: 'البريد الإلكتروني', password: 'كلمة المرور', brandName: 'اسم العلامة',
  whatsapp: 'واتساب', contactEmail: 'البريد الإلكتروني', locationScope: 'المكان', governorateId: 'المحافظة', countryId: 'الدولة',
  gender: 'الجنس', birthDate: 'تاريخ الميلاد', heightCm: 'الطول', weightKg: 'الوزن', skinTone: 'لون البشرة', hairColor: 'لون الشعر',
  eyeColor: 'لون العينين', hijab: 'الحجاب', experienceYears: 'سنوات الخبرة', languages: 'اللغات', bio: 'النبذة',
  categoryIds: 'التخصصات', socialAccounts: 'الحسابات', availability: 'الجاهزية', title: 'العنوان', details: 'التفاصيل',
  productDescription: 'وصف المنتج', executionDetails: 'رؤية التنفيذ', usagePlace: 'مكان النشر', quantity: 'العدد',
  influencerIds: 'الوجوه', externalNames: 'الأسماء', influencerUserId: 'الموهبة', status: 'الحالة', rejectionReason: 'السبب',
  nameAr: 'الاسم', slug: 'المعرّف', parentId: 'التصنيف الأب',
};

/** Parses `input` with `schema`; on failure throws a 400 with an Arabic message naming the first bad field. */
export function parse(schema, input) {
  const result = schema.safeParse(input ?? {});
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue.path.find((part) => typeof part === 'string');
  // Our own messages are Arabic; zod's built-in ones are English and get replaced by a field hint.
  const message = /[؀-ۿ]/.test(issue.message) ? issue.message : `تحقق من حقل: ${labels[field] || field || 'البيانات'}`;
  throw badRequest(message, result.error.issues.map((item) => ({ path: item.path.join('.'), message: item.message })));
}

const blankToNull = (value) => (value === '' || value === undefined ? null : value);

export const text = (min, max, message) => z.string().trim().min(min, message).max(max);
export const optText = (max) => z.preprocess(blankToNull, z.string().trim().max(max).nullable()).optional();
export const optId = z.preprocess((value) => (blankToNull(value) == null ? null : Number(value)), z.number().int().positive().nullable()).optional();
export const optInt = (min, max) => z.preprocess((value) => (blankToNull(value) == null ? null : Number(value)), z.number().int().min(min).max(max).nullable()).optional();

export const phone = z.string().trim().transform((value) => value.replace(/[\s\-()]/g, '')).pipe(z.string().regex(/^\+?\d{7,15}$/, 'رقم الهاتف غير صحيح.'));
export const optPhone = z.preprocess(blankToNull, phone.nullable()).optional();
export const email = z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح.').max(160);
export const optEmail = z.preprocess(blankToNull, email.nullable()).optional();
export const password = z.string().min(8, 'كلمة المرور لازم تكون ٨ أحرف على الأقل.').max(128);
export const optPassword = z.preprocess(blankToNull, password.nullable()).optional();

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الميلاد غير صحيح.');

export function isAdult(value) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return value <= date.toISOString().slice(0, 10);
}

const enumOrNull = (values) => z.preprocess(blankToNull, z.enum(values).nullable()).optional();

export const enums = {
  gender: z.enum(['male', 'female']),
  skinTone: enumOrNull(['fair', 'medium', 'olive', 'brown', 'dark']),
  hairColor: enumOrNull(['black', 'brown', 'blonde', 'red', 'gray', 'colored']),
  eyeColor: enumOrNull(['brown', 'black', 'hazel', 'green', 'blue', 'gray']),
  hijab: enumOrNull(['yes', 'no', 'not_applicable']),
  scope: z.enum(['inside_iraq', 'outside_iraq']),
  availability: z.enum(['active', 'busy', 'paused']),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat', 'x']),
  requestStatus: z.enum(['pending', 'reviewing', 'confirmed', 'closed', 'rejected']),
  accountStatus: z.enum(['pending', 'approved', 'rejected', 'suspended']),
};

const social = z.object({ platform: enums.platform, handle: z.string().trim().min(1).max(200) });

/** Creator profile fields shared by direct creator sign-up, the upgrade, and profile edits. */
export const influencerProfile = z.object({
  gender: enums.gender,
  birthDate: isoDate.refine(isAdult, 'التسجيل للبالغين فقط: ١٨ سنة فأكثر.'),
  heightCm: optInt(50, 250),
  weightKg: optInt(20, 300),
  skinTone: enums.skinTone,
  hairColor: enums.hairColor,
  eyeColor: enums.eyeColor,
  hijab: enums.hijab,
  experienceYears: optInt(0, 80),
  languages: z.array(z.string().trim().min(1).max(40)).min(1, 'اختر لغة وحدة على الأقل.').max(10),
  bio: text(20, 2000, 'النبذة لازم تكون ٢٠ حرف على الأقل.'),
  locationScope: enums.scope,
  governorateId: optId,
  countryId: optId,
  categoryIds: z.array(z.preprocess(Number, z.number().int().positive())).min(1, 'اختر تخصص واحد على الأقل.').max(20),
  socialAccounts: z.array(social).min(1, 'أضف حساب اجتماعي واحد على الأقل.').max(10),
}).superRefine((value, ctx) => {
  if (value.locationScope === 'inside_iraq' && !value.governorateId) ctx.addIssue({ code: 'custom', path: ['governorateId'], message: 'اختر المحافظة.' });
  if (value.locationScope === 'outside_iraq' && !value.countryId) ctx.addIssue({ code: 'custom', path: ['countryId'], message: 'اختر الدولة.' });
});

export { z };
