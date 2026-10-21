// Reference data seeded on first setup. Slugs match the site's lib/names.ts and lib/scenes.ts.

export const categories = [
  {
    slug: 'models-fashion', nameAr: 'المودل والأزياء',
    children: [
      ['fashion-model', 'عارض أزياء'], ['commercial-model', 'موديل إعلانات'], ['product-model', 'موديل منتجات'],
      ['medical-model', 'موديل طبي'], ['beauty-model', 'موديل جمال'], ['fitness-model', 'موديل لياقة'],
      ['hand-model', 'موديل أيدي'], ['senior-model', 'موديل كبار السن'], ['automotive-model', 'موديل سيارات'],
      ['jewelry-model', 'موديل مجوهرات'], ['hijab-model', 'موديل محجبات'],
    ],
  },
  {
    slug: 'photography-production', nameAr: 'التصوير والإنتاج',
    children: [
      ['photography', 'مصوّر'], ['video-shooting', 'تصوير فيديو'], ['product-photography', 'تصوير منتجات'],
      ['commercial-shooting', 'تصوير إعلاني'], ['events-photography', 'تصوير مناسبات'], ['fashion-photography', 'تصوير أزياء'],
      ['real-estate-photography', 'تصوير عقارات'], ['drone-photography', 'تصوير درون'], ['live-streaming', 'بث مباشر'],
      ['video-editing', 'مونتاج'], ['photo-retouching', 'تعديل صور'], ['cinematic-production', 'إخراج سينمائي'],
    ],
  },
  {
    slug: 'design', nameAr: 'الجرافيك والتصميم',
    children: [
      ['brand-identity', 'هوية بصرية'], ['logo-design', 'تصميم شعارات'], ['ads-design', 'تصميم إعلانات'],
      ['print-design', 'تصميم مطبوعات'], ['packaging-design', 'تصميم تغليف'], ['presentation-design', 'تصميم عروض'],
      ['ui-ux-design', 'تصميم واجهات'], ['motion-graphics', 'موشن جرافيك'], ['3d-design', 'تصميم ثلاثي الأبعاد'],
      ['social-media-design', 'تصاميم سوشيال ميديا'],
    ],
  },
  {
    slug: 'audio-production', nameAr: 'الصوت والإنتاج',
    children: [
      ['voice-over', 'تعليق صوتي'], ['audio-recording', 'تسجيل صوتي'], ['sound-engineering', 'هندسة صوت'],
      ['audio-editing', 'مونتاج صوتي'], ['mixing-mastering', 'ميكس وماسترينغ'], ['music-production', 'إنتاج موسيقي'],
      ['sound-effects', 'مؤثرات صوتية'], ['podcast-production', 'إنتاج بودكاست'], ['dubbing', 'دبلجة'],
    ],
  },
  {
    slug: 'marketing', nameAr: 'التسويق والإعلانات',
    children: [
      ['digital-marketing', 'تسويق رقمي'], ['social-media-management', 'إدارة حسابات'], ['social-ads', 'إعلانات ممولة'],
      ['influencer-marketing', 'تسويق بالمؤثرين'], ['copywriting', 'كتابة إعلانية'], ['seo', 'تحسين محركات البحث'],
      ['marketing-strategy', 'استراتيجية تسويق'], ['marketing-analytics', 'تحليلات تسويقية'], ['campaign-management', 'إدارة حملات'],
      ['paid-ads', 'إعلانات مدفوعة'],
    ],
  },
  {
    slug: 'production-services', nameAr: 'الإنتاج والدعم الفني',
    children: [
      ['studio-rental', 'تأجير استوديو'], ['equipment-rental', 'تأجير معدات'], ['events-management', 'إدارة فعاليات'],
      ['set-design', 'تصميم ديكور'], ['makeup-hair-styling', 'مكياج وتصفيف'], ['fashion-design', 'تصميم أزياء'],
      ['accessory-design', 'تصميم إكسسوارات'], ['lighting-design', 'تصميم إضاءة'], ['sound-design', 'تصميم صوت'],
      ['visual-effects-design', 'مؤثرات بصرية'],
    ],
  },
  {
    slug: 'influencers-content', nameAr: 'المؤثرين وصناعة المحتوى',
    children: [
      ['instagram-influencers', 'مؤثر انستغرام'], ['tiktok-influencers', 'مؤثر تيك توك'], ['youtubers', 'يوتيوبر'],
      ['ugc-content-creation', 'محتوى UGC'], ['influencer-ads', 'إعلانات مؤثرين'], ['product-reviews', 'مراجعة منتجات'],
      ['reels-creation', 'صناعة ريلز'], ['influencer-management', 'إدارة مؤثرين'], ['brand-campaigns', 'حملات علامات تجارية'],
    ],
  },
];

export const governorates = [
  ['baghdad', 'بغداد', 'Baghdad'], ['basra', 'البصرة', 'Basra'], ['nineveh', 'نينوى', 'Nineveh'],
  ['erbil', 'أربيل', 'Erbil'], ['najaf', 'النجف', 'Najaf'], ['karbala', 'كربلاء', 'Karbala'],
  ['sulaymaniyah', 'السليمانية', 'Sulaymaniyah'], ['kirkuk', 'كركوك', 'Kirkuk'], ['babil', 'بابل', 'Babil'],
  ['anbar', 'الأنبار', 'Anbar'], ['dhi-qar', 'ذي قار', 'Dhi Qar'], ['maysan', 'ميسان', 'Maysan'],
  ['wasit', 'واسط', 'Wasit'], ['salah-al-din', 'صلاح الدين', 'Salah al-Din'], ['duhok', 'دهوك', 'Duhok'],
  ['diyala', 'ديالى', 'Diyala'], ['muthanna', 'المثنى', 'Muthanna'], ['qadisiyyah', 'القادسية', 'Qadisiyyah'],
];

export const countries = [
  ['IQ', 'العراق', 'Iraq'], ['AE', 'الإمارات', 'United Arab Emirates'], ['SA', 'السعودية', 'Saudi Arabia'],
  ['KW', 'الكويت', 'Kuwait'], ['QA', 'قطر', 'Qatar'], ['BH', 'البحرين', 'Bahrain'], ['OM', 'عُمان', 'Oman'],
  ['JO', 'الأردن', 'Jordan'], ['LB', 'لبنان', 'Lebanon'], ['SY', 'سوريا', 'Syria'], ['EG', 'مصر', 'Egypt'],
  ['TR', 'تركيا', 'Turkey'], ['IR', 'إيران', 'Iran'], ['GB', 'المملكة المتحدة', 'United Kingdom'],
  ['DE', 'ألمانيا', 'Germany'], ['FR', 'فرنسا', 'France'], ['NL', 'هولندا', 'Netherlands'], ['SE', 'السويد', 'Sweden'],
  ['US', 'الولايات المتحدة', 'United States'], ['CA', 'كندا', 'Canada'], ['AU', 'أستراليا', 'Australia'],
];
