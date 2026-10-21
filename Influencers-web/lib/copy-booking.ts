import type { Locale } from '@/lib/types';

const ar = {
  title: 'اطلب {محتوى} / لمشروعك',
  stepOf: (now: string, all: string) => `الخطوة ${now} من ${all}`,
  steps: [
    { label: 'الفكرة', head: 'شنو الفكرة؟', deck: 'سمِّ المشروع واحچِ لنا عن المنتج اللي تريد له محتوى.' },
    { label: 'التنفيذ', head: 'شلون نصوّرها؟', deck: 'رؤيتك للتنفيذ، ووين راح يُنشر المحتوى.' },
    { label: 'الوجوه', head: 'منو يطلع بالمحتوى؟', deck: 'حدّد عدد الوجوه، واختر من الدار إذا تحب.' },
    { label: 'المراجعة', head: 'راجع طلبك', deck: 'تأكّد من كل شي قبل الإرسال. تگدر ترجع وتعدّل أي خطوة.' },
  ],
  platforms: ['انستغرام', 'تيك توك', 'سناب شات', 'يوتيوب', 'فيسبوك', 'المتجر الإلكتروني'],
  platformsHint: 'اختر بسرعة، أو اكتب بنفسك.',
  tooShort: (min: number) => `اكتب ${min} أحرف على الأقل.`,
  summary: 'ملخّص الطلب',
  untitled: 'مشروع بلا اسم بعد',
  facesNone: 'نترك لكم الاختيار',
  guests: 'من خارج الدار',
  edit: 'تعديل',
  note: 'كل طلب يمرّ على فريقنا للمراجعة قبل التواصل مع أي وجه. الأرقام الشخصية تبقى محمية، وما نحدّد سعر أو موعد قبل ما نحچي وياك.',
  doneTitle: 'وصل طلبك!',
  browse: 'تصفّح الوجوه',
  missing: 'أكمل الحقول المطلوبة بالخطوات السابقة.',
};

const en: typeof ar = {
  title: 'Request {content} / for your project',
  stepOf: (now: string, all: string) => `Step ${now} of ${all}`,
  steps: [
    { label: 'Idea', head: 'What is the idea?', deck: 'Name the project and tell us about the product you want content for.' },
    { label: 'Direction', head: 'How should it look?', deck: 'Your creative direction, and where the content will run.' },
    { label: 'Faces', head: 'Who appears in it?', deck: 'Set the number of faces, and pick from the house if you like.' },
    { label: 'Review', head: 'Review your request', deck: 'Check everything before sending. You can go back and edit any step.' },
  ],
  platforms: ['Instagram', 'TikTok', 'Snapchat', 'YouTube', 'Facebook', 'Online store'],
  platformsHint: 'Pick quickly, or type your own.',
  tooShort: (min: number) => `Write at least ${min} characters.`,
  summary: 'Request summary',
  untitled: 'Untitled project',
  facesNone: 'Casting left to us',
  guests: 'From outside the house',
  edit: 'Edit',
  note: 'Every request is reviewed by our team before any face is contacted. Private numbers stay protected, and no rate or date is set before we talk.',
  doneTitle: 'Your request is in!',
  browse: 'Browse faces',
  missing: 'Complete the required fields in the earlier steps.',
};

export function getBooking(locale: Locale | string) {
  return locale === 'en' ? en : ar;
}
