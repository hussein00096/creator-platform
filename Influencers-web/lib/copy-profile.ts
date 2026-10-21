// Copy for the creator profile (/talent/[id]) in the Bareeq redesign.

const ar = {
  book: 'احجز تعاون',
  save: 'احفظ في المفضلة',
  unsave: 'إزالة من المفضلة',
  share: 'شارك الملف',
  copied: 'انسخ الرابط وشاركه',
  linkCopied: 'تم نسخ الرابط',
  platforms: 'المنصات',
  open: 'افتح الحساب على',
  about: 'نبذة',
  tabs: 'ملف المؤثر',
  work: 'الأعمال',
  details: 'التفاصيل',
  workEmpty: 'ما رفع أعمال لحد الآن. ارجع للملف قريباً.',
  place: 'المدينة',
  years: 'الخبرة',
  languages: 'اللغات',
  fields: 'المجالات',
  similarEyebrow: 'مؤثرين مشابهين',
  similarTitle: 'وجوه من نفس',
  similarAccent: 'المجال',
  loginTitle: 'تريد تشتغل ويا هذا الملف؟',
  loginBtn: 'سجّل الدخول للحجز',
  ordersBtn: 'تابع طلباتك',
  noteTeam: (brand: string) => `كل تواصل يمر عن طريق فريق ${brand}، والرقم الشخصي ما يظهر لأحد.`,
  notePrice: 'السعر والموعد نتفق عليهم وياك مباشرة، وما اكو التزام قبل ما نحچي.',
};

const en: typeof ar = {
  book: 'Book a collab',
  save: 'Save to favourites',
  unsave: 'Remove from favourites',
  share: 'Share profile',
  copied: 'Copy the link and share it',
  linkCopied: 'Link copied',
  platforms: 'Platforms',
  open: 'Open account on',
  about: 'About',
  tabs: 'Creator profile',
  work: 'Work',
  details: 'Details',
  workEmpty: 'No work uploaded yet. Check back soon.',
  place: 'City',
  years: 'Experience',
  languages: 'Languages',
  fields: 'Fields',
  similarEyebrow: 'Similar creators',
  similarTitle: 'Faces from the same',
  similarAccent: 'field',
  loginTitle: 'Want to work with this creator?',
  loginBtn: 'Log in to book',
  ordersBtn: 'Track your requests',
  noteTeam: (brand: string) => `All contact goes through the ${brand} team. Personal numbers are never shown.`,
  notePrice: 'Rate and date are agreed with you directly, with no commitment before we talk.',
};

export type ProfileCopy = typeof ar;

export function getProfile(locale: string): ProfileCopy {
  return locale === 'en' ? en : ar;
}
