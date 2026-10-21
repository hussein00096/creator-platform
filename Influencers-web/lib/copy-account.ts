// Copy for normal accounts: sign-up, ordering gates, upgrade to creator, account menu.
import type { Locale } from './types';

const ar = {
  userTitle: 'حسابك',
  userDeck: 'اسمك، ورقم هاتفك أو بريدك الإلكتروني، وكلمة مرور. الحساب يتفعّل فوراً.',
  idTitle: 'كيف تدخل؟',
  idDeck: 'اكتب رقم الهاتف أو البريد الإلكتروني، واحد منهم على الأقل. تكدر تكتب الاثنين.',
  needName: 'اكتب اسمك (حرفين على الأقل).',
  needId: 'اكتب رقم الهاتف أو البريد الإلكتروني، واحد منهم على الأقل.',
  badEmail: 'البريد الإلكتروني غير صحيح.',
  badPhone: 'رقم الهاتف غير صحيح.',
  needPassword: 'كلمة المرور لازم تكون ٨ أحرف على الأقل.',
  create: 'سوّي الحساب',
  optional: 'اختياري',
  privacy: 'رقمك وبريدك للدخول بس، وما يشوفهم أي زائر.',
  // Ordering gates
  guestOrder: 'سجّل دخول أو سوّي حساب عادي خلال دقيقة، وبعدها تكدر تطلب فوراً.',
  newUser: 'سوّي حساب عادي',
  noOrder: 'الطلب والحجز متاحين للحسابات العادية وحسابات الشركات المعتمدة. حسابات صنّاع المحتوى والإدارة ما تطلب.',
  noOrderTitle: 'هذا الحساب ما يطلب خدمات',
  companyPending: 'حساب شركتك قيد المراجعة. أول ما ينعتمد تكدر تطلب وتحجز.',
  // Upgrade
  upTitle: 'صير / {صانع محتوى}',
  upDeck: 'نفس حسابك ونفس دخولك. كمّل ملفك، وفريقنا يراجعه قبل ما يظهر للناس.',
  upNameDeck: 'الاسم اللي يظهر على ملفك. رقمك وكلمة مرورك تبقى نفسها.',
  upSend: 'أرسل الملف للمراجعة',
  upDoneTitle: 'وصل ملفك. حسابك صار صانع محتوى، وهو هسه قيد المراجعة.',
  upDoneDeck: 'ارفع صورتك الشخصية والغلاف ولقطات أعمالك من غرفة الصور، حتى يكون ملفك جاهز أول ما ينعتمد.',
  upPhotos: 'ارفع صورك',
  upAccount: 'حسابي',
  upGateTitle: 'هذه الخطوة للحسابات العادية',
  upGateTalent: 'حسابك صانع محتوى أصلاً. تكدر تدير ملفك وصورك من حسابك.',
  upGateOther: 'التحويل لصانع محتوى متاح للحسابات العادية بس. حسابات الشركات والإدارة تبقى مثل ما هي.',
  signInFirst: 'سجّل الدخول أولاً حتى تشوف حسابك وطلباتك.',
  // Menus
  becomeCreator: 'صير صانع محتوى',
  adminPanel: 'لوحة الإدارة',
};

const en: typeof ar = {
  userTitle: 'Your account',
  userDeck: 'Your name, a phone number or e-mail, and a password. The account is active right away.',
  idTitle: 'How you sign in',
  idDeck: 'Enter a phone number or an e-mail, at least one of them. You can add both.',
  needName: 'Enter your name (at least 2 characters).',
  needId: 'Enter a phone number or an e-mail, at least one of them.',
  badEmail: 'That e-mail address doesn’t look right.',
  badPhone: 'That phone number doesn’t look right.',
  needPassword: 'The password needs at least 8 characters.',
  create: 'Create account',
  optional: 'optional',
  privacy: 'Your number and e-mail are only for signing in; no visitor sees them.',
  guestOrder: 'Sign in, or create a normal account in a minute, and you can order right away.',
  newUser: 'Create a normal account',
  noOrder: 'Ordering and booking are open to normal accounts and approved company accounts. Creator and admin accounts can’t order.',
  noOrderTitle: 'This account can’t order services',
  companyPending: 'Your company account is under review. Once approved you can order and book.',
  upTitle: 'Become / a {creator}',
  upDeck: 'Same account, same sign-in. Complete your profile and our team reviews it before it goes public.',
  upNameDeck: 'The name shown on your profile. Your phone and password stay the same.',
  upSend: 'Send profile for review',
  upDoneTitle: 'Profile received. Your account is now a creator account, under review.',
  upDoneDeck: 'Upload your portrait, cover and work shots in the photo room so your profile is ready the moment it is approved.',
  upPhotos: 'Upload photos',
  upAccount: 'My account',
  upGateTitle: 'This step is for normal accounts',
  upGateTalent: 'Your account is already a creator account. Manage your profile and photos from your account.',
  upGateOther: 'Becoming a creator is only for normal accounts. Company and admin accounts stay as they are.',
  signInFirst: 'Sign in first to see your account and requests.',
  becomeCreator: 'Become a creator',
  adminPanel: 'Admin panel',
};

export function getAccount(locale: Locale | string) {
  return locale === 'en' ? en : ar;
}

/** Who may send UGC / service requests: any normal account that isn't suspended, or an approved company. */
export function canOrder(user: { role: string; status: string } | null | undefined) {
  if (!user) return false;
  if (user.role === 'user') return user.status !== 'suspended';
  return user.role === 'client' && user.status === 'approved';
}
