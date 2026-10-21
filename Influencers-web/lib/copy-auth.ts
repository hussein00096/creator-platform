import type { Locale } from './types';

const ar = {
  loginTitle: 'هلا بيك / {من جديد}',
  signupTitle: 'أهلاً بيك / في {%w}',
  loginDeck: 'ادخل برقم هاتفك أو بريدك الإلكتروني. تابع طلباتك، أو أدِر ملفك إذا كنت صانع محتوى.',
  signupDeck: 'اختار نوع حسابك. الحساب العادي يتفعّل فوراً، وحسابات الشركات وصنّاع المحتوى تمر بمراجعة.',
  tabs: 'نوع الدخول',
  login: 'تسجيل الدخول',
  signup: 'حساب جديد',
  roleLegend: 'شنو نوع حسابك؟',
  roles: {
    user: { title: 'حساب عادي', deck: 'تطلب خدمات وتحجز مؤثرين فوراً، وتكدر تصير صانع محتوى بعدين' },
    client: { title: 'شركة', deck: 'حساب لعلامتك، يمر بمراجعة قبل ما تكدر تطلب' },
    influencer: { title: 'صانع محتوى / موديل', deck: 'ملفك يمر بمراجعة قبل ما يظهر للناس' },
    model: { title: 'موديل', deck: 'تصوير وعروض وحملات أزياء' },
  },
  loginId: 'رقم الهاتف أو البريد الإلكتروني',
  noAccount: 'ما عندك حساب؟',
  haveAccount: 'عندك حساب؟',
  leave: 'إلغاء',
  phoneHint: 'رقمك أو بريدك هو مفتاح دخولك، وما يشوفه أي زائر.',
  captionTitle: 'مؤثرين وموديلات من كل العراق، بمكان واحد.',
  captionNote: 'كل ملف يمر بمراجعة قبل ما يظهر للشركات.',
  step: 'الخطوة',
};

const en: typeof ar = {
  loginTitle: 'Good to see / you {again}',
  signupTitle: 'Welcome / to {%w}',
  loginDeck: 'Sign in with your phone number or e-mail. Follow your requests, or manage your profile if you are a creator.',
  signupDeck: 'Pick your account type. A normal account is active right away; company and creator accounts are reviewed.',
  tabs: 'Account access',
  login: 'Sign in',
  signup: 'New account',
  roleLegend: 'What kind of account?',
  roles: {
    user: { title: 'Normal account', deck: 'Order services and book creators right away; become a creator later if you like' },
    client: { title: 'Company', deck: 'An account for your brand, reviewed before you can order' },
    influencer: { title: 'Creator / model', deck: 'Your profile is reviewed before it goes public' },
    model: { title: 'Model', deck: 'Shoots, shows and fashion campaigns' },
  },
  loginId: 'Phone or e-mail',
  noAccount: 'No account yet?',
  haveAccount: 'Already have an account?',
  leave: 'Cancel',
  phoneHint: 'Your number or e-mail is your key to sign in, and no visitor will ever see it.',
  captionTitle: 'Creators and models from all over Iraq, in one place.',
  captionNote: 'Every profile is reviewed before brands can see it.',
  step: 'Step',
};

export function getAuth(locale: Locale | string) {
  return locale === 'en' ? en : ar;
}
