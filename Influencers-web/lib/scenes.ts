const scenes: Record<string, string> = {
  'models-fashion': '/scenes/fashion.jpg',
  'photography-production': '/scenes/camera.jpg',
  design: '/scenes/design.jpg',
  'audio-production': '/scenes/audio.jpg',
  marketing: '/scenes/campaign.jpg',
  'production-services': '/scenes/set.jpg',
  'influencers-content': '/scenes/content.jpg',
};

export function sceneFor(slug: string | null) {
  if (!slug) return '/scenes/hero.jpg';
  return scenes[slug] || '/scenes/hero.jpg';
}

export function doorShot(item: { slug?: string | null; image?: string | null }) {
  if (item.image) return item.image;
  if (item.slug && scenes[item.slug]) return scenes[item.slug];
  return null;
}

export const parentCategories = [
  { slug: 'models-fashion', nameAr: 'المودل والأزياء' },
  { slug: 'photography-production', nameAr: 'التصوير والإنتاج' },
  { slug: 'design', nameAr: 'الجرافيك والتصميم' },
  { slug: 'audio-production', nameAr: 'الصوت والإنتاج' },
  { slug: 'marketing', nameAr: 'التسويق والإعلانات' },
  { slug: 'production-services', nameAr: 'الإنتاج والدعم الفني' },
  { slug: 'influencers-content', nameAr: 'المؤثرين وصناعة المحتوى' },
];
