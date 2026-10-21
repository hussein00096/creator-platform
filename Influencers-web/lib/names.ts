import type { Place } from './types';

const en: Record<string, string> = {
  'models-fashion': 'Models & fashion',
  'fashion-model': 'Fashion model',
  'commercial-model': 'Commercial model',
  'product-model': 'Product model',
  'medical-model': 'Medical model',
  'beauty-model': 'Beauty model',
  'fitness-model': 'Fitness model',
  'hand-model': 'Hand model',
  'senior-model': 'Senior model',
  'automotive-model': 'Automotive model',
  'jewelry-model': 'Jewelry model',
  'hijab-model': 'Hijab model',
  'photography-production': 'Photography',
  photography: 'Photographer',
  'video-shooting': 'Video',
  'product-photography': 'Product photography',
  'commercial-shooting': 'Commercial shooting',
  'events-photography': 'Events',
  'fashion-photography': 'Fashion photography',
  'real-estate-photography': 'Real estate',
  'drone-photography': 'Drone',
  'live-streaming': 'Live',
  'video-editing': 'Video editing',
  'photo-retouching': 'Retouching',
  'cinematic-production': 'Cinematic direction',
  design: 'Design',
  'brand-identity': 'Visual identity',
  'logo-design': 'Logos',
  'ads-design': 'Advertising design',
  'print-design': 'Print',
  'packaging-design': 'Packaging',
  'presentation-design': 'Presentations',
  'ui-ux-design': 'UI / UX',
  'motion-graphics': 'Motion',
  '3d-design': '3D',
  'social-media-design': 'Social design',
  'audio-production': 'Sound',
  'voice-over': 'Voice',
  'audio-recording': 'Recording',
  'sound-engineering': 'Sound engineering',
  'audio-editing': 'Audio editing',
  'mixing-mastering': 'Mix & master',
  'music-production': 'Music',
  'sound-effects': 'Sound effects',
  'podcast-production': 'Podcast',
  dubbing: 'Dubbing',
  marketing: 'Marketing',
  'digital-marketing': 'Digital marketing',
  'social-media-management': 'Social management',
  'social-ads': 'Social promotion',
  'influencer-marketing': 'Influencer marketing',
  copywriting: 'Copy',
  seo: 'Search',
  'marketing-strategy': 'Strategy',
  'marketing-analytics': 'Analytics',
  'campaign-management': 'Campaigns',
  'paid-ads': 'Paid ads',
  'production-services': 'Studio services',
  'studio-rental': 'Studio rental',
  'equipment-rental': 'Equipment',
  'events-management': 'Events',
  'set-design': 'Set design',
  'makeup-hair-styling': 'Makeup & hair',
  'fashion-design': 'Costume',
  'accessory-design': 'Accessories',
  'lighting-design': 'Lighting',
  'sound-design': 'Sound design',
  'visual-effects-design': 'Visual effects',
  'influencers-content': 'Influencers',
  'instagram-influencers': 'Instagram',
  'tiktok-influencers': 'TikTok',
  youtubers: 'YouTube',
  'ugc-content-creation': 'UGC',
  'influencer-ads': 'Influencer ads',
  'product-reviews': 'Reviews',
  'reels-creation': 'Reels',
  'influencer-management': 'Account care',
  'brand-campaigns': 'Brand campaigns',
};

const governorateEn: Record<string, string> = {
  baghdad: 'Baghdad',
  basra: 'Basra',
  nineveh: 'Nineveh',
  erbil: 'Erbil',
  najaf: 'Najaf',
  karbala: 'Karbala',
  sulaymaniyah: 'Sulaymaniyah',
  kirkuk: 'Kirkuk',
  babil: 'Babil',
  anbar: 'Anbar',
  'dhi-qar': 'Dhi Qar',
  maysan: 'Maysan',
  wasit: 'Wasit',
  'salah-al-din': 'Salah al-Din',
  duhok: 'Duhok',
  diyala: 'Diyala',
  muthanna: 'Muthanna',
  qadisiyyah: 'Qadisiyyah',
};

export const languageOptions = [
  { value: 'العربية', ar: 'العربية', en: 'Arabic' },
  { value: 'الكردية', ar: 'الكردية', en: 'Kurdish' },
  { value: 'الإنجليزية', ar: 'الإنجليزية', en: 'English' },
  { value: 'التركية', ar: 'التركية', en: 'Turkish' },
];

export function categoryLabel(locale: string, category: { slug: string; nameAr: string }) {
  if (locale !== 'en') return category.nameAr;
  return en[category.slug] || category.nameAr;
}

export function placeLabel(locale: string, place: Place | null | undefined) {
  if (!place) return '';
  if (locale === 'en') return place.nameEn || (place.slug ? governorateEn[place.slug] : '') || place.nameAr;
  return place.nameAr;
}

export function languageLabel(locale: string, value: string) {
  const row = languageOptions.find((item) => item.value === value);
  if (!row) return value;
  return locale === 'en' ? row.en : row.ar;
}

export function socialHref(platform: string, handle: string) {
  if (/^https?:\/\//i.test(handle)) return handle;
  const name = handle.replace(/^@+/, '');
  const map: Record<string, string> = {
    instagram: `https://instagram.com/${name}`,
    tiktok: `https://www.tiktok.com/@${name}`,
    youtube: `https://www.youtube.com/@${name}`,
    facebook: `https://facebook.com/${name}`,
    snapchat: `https://www.snapchat.com/add/${name}`,
    x: `https://x.com/${name}`,
  };
  return map[platform] || '#';
}
