import type { Locale } from '@/lib/types';

const ar = {
  about: {
    eyebrow: 'من نحن',
    title: 'نبني المساحة اللي / يلتقي بيها [[الإبداع]] / بالسوق العراقي.',
    storyTitle: 'دار، مو سوق مفتوح.',
    statsEyebrow: 'بالأرقام',
    valuesEyebrow: 'قيمنا',
    valuesTitle: 'ثلاث قيم نشتغل بيها كل يوم.',
    values: [
      { title: 'الوضوح', text: 'ملف كامل لكل موهبة: نبذة، مكان، لغات، خبرة ومعرض أعمال. والسعر يُتّفق عليه بحوار واضح، بدون أرقام مخفية.' },
      { title: 'الثقة', text: 'كل ملف يمرّ بالمراجعة قبل ما يظهر، والحجز بس من حسابات علامات معتمدة. الرقم الشخصي للموهبة ما يظهر لأحد.' },
      { title: 'المحلي أولاً', text: 'منصّة مبنية للسوق العراقي وبلغته: مواهب من مدن العراق، وفريق يفهم العلامات المحلية ويرد عليها مباشرة.' },
    ],
    statementEyebrow: 'بيانُنا',
    ctaEyebrow: 'الخطوة الجاية',
    ctaTitle: 'تعرّف على الوجوه، أو صير واحد منهم.',
  },
  contact: {
    actions: 'تواصل مباشر',
    whatsappBtn: 'راسلنا على واتساب',
    emailBtn: 'أرسل بريد',
    callBtn: 'اتصل بينا',
    cardsEyebrow: 'قنوات التواصل',
    cardsTitle: 'اختر الطريقة اللي تريحك.',
    socials: 'تابعنا',
    website: 'الموقع',
    open: 'افتح',
    home: 'الرئيسية',
  },
  lost: {
    eyebrow: 'خطأ ٤٠٤',
    lead: 'الرابط ممكن يكون قديم أو منكتب غلط. ارجع للرئيسية أو تصفّح الوجوه.',
    directory: 'تصفّح الوجوه',
  },
};

const en: typeof ar = {
  about: {
    eyebrow: 'About us',
    title: 'We build the space where / [[creativity]] meets / the Iraqi market.',
    storyTitle: 'A house, not an open market.',
    statsEyebrow: 'In numbers',
    valuesEyebrow: 'Our values',
    valuesTitle: 'Three values we work by every day.',
    values: [
      { title: 'Clarity', text: 'A full profile for every talent: bio, location, languages, experience and portfolio. Pricing is agreed in an open conversation, with no hidden numbers.' },
      { title: 'Trust', text: 'Every profile is reviewed before it goes live, and only approved brand accounts can book. A talent’s personal number is never shown.' },
      { title: 'Local first', text: 'Built for the Iraqi market and in its language: talent from cities across Iraq, and a team that knows local brands and answers them directly.' },
    ],
    statementEyebrow: 'Our manifesto',
    ctaEyebrow: 'Next step',
    ctaTitle: 'Meet the faces, or become one of them.',
  },
  contact: {
    actions: 'Reach us directly',
    whatsappBtn: 'Message on WhatsApp',
    emailBtn: 'Send an email',
    callBtn: 'Call us',
    cardsEyebrow: 'Contact lines',
    cardsTitle: 'Pick whatever suits you.',
    socials: 'Follow us',
    website: 'Website',
    open: 'Open',
    home: 'Home',
  },
  lost: {
    eyebrow: 'Error 404',
    lead: 'The link may be old or mistyped. Head back home or browse the faces.',
    directory: 'Browse the faces',
  },
};

export function getAbout(locale: Locale | string) {
  return locale === 'en' ? en : ar;
}
