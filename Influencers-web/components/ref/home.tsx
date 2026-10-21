'use client';

// 1:1 port of design/reference/index.html. Markup, classes and inline style values are the
// reference's; sample cards/rows/chips are replaced by loops over real data.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState, type FormEvent } from 'react';
import { RefNav } from '@/components/ref/nav';
import { Arr, STAR, Shot, Vf, num } from '@/components/ref/parts';
import { getCopy } from '@/lib/copy';
import type { CardPerson } from '@/lib/people';
import type { Contact, Locale } from '@/lib/types';

export type RefField = { id: number; name: string; href: string; people: number[]; minis: { shot: string | null; tone: string }[] };
export type RefChip = { name: string; href: string };

const T = {
  ar: {
    live: 'متاح الآن',
    pill: 'أول منصة عراقية تجمع المؤثرين والموديلز والشركات',
    h1: [['اكتشف', 'نجوم'], ['المحتوى', 'في', 'العراق']],
    lead: 'تصفّح المؤثرين والموديلز، شاهد أعمالهم، واحجز تعاونك القادم خلال دقائق.',
    searchLabel: 'ابحث عن مؤثر',
    searchPh: 'ابحث باسم المؤثر، المجال أو المدينة…',
    search: 'ابحث',
    popular: 'الأكثر بحثاً:',
    trendEyebrow: 'ترند هذا الأسبوع',
    trendTitle: ['الأكثر طلباً', 'من الشركات'],
    prev: 'السابق',
    next: 'التالي',
    catsEyebrow: 'تصفّح حسب المجال',
    catsTitle: 'كل مجال، له نجومه',
    allFields: 'كل المجالات',
    modelsEyebrow: 'موديلز للحجز',
    modelsTitle: ['متاحين هذا الأسبوع', 'لجلسات التصوير'],
    modelsLead: 'اختر الموديل، حدد اليوم ونوع الجلسة، ويوصلك التأكيد مباشرة.',
    available: 'متاح الآن',
    bookNow: 'احجز الآن',
    gridEyebrow: 'المؤثرين والموديلز',
    gridTitle: ['اختر الوجه المناسب', 'لعلامتك التجارية'],
    gridLead: 'فلتر حسب المجال، شاهد الأعمال السابقة، وأرسل عرض التعاون مباشرة.',
    filterLabel: 'تصفية حسب المجال',
    all: 'الكل',
    viewProfile: 'شاهد الملف',
    seeAll: 'عرض كل المؤثرين',
    bandsLabel: 'مجالات المحتوى',
    services: ['حملات إعلانية', 'حجز موديلز', 'تصوير منتجات', 'ريلز وستوري', 'تغطية فعاليات', 'افتتاحات'],
    howTitle: 'ثلاث خطوات لحملتك الجاية',
    howLabel: 'اختر نوع الحساب',
    forBrands: 'للشركات',
    forCreators: 'للمؤثرين',
    brandSteps: [
      ['انشر حملتك', 'اكتب فكرة الحملة، الميزانية، ونوع المحتوى اللي تحتاجه.'],
      ['اختر المؤثر', 'استقبل طلبات المؤثرين، قارن أعمالهم، واختر الأنسب لجمهورك.'],
      ['تابع النتائج', 'راقب التنفيذ خطوة بخطوة واستلم تقرير الأداء بعد النشر.'],
    ],
    creatorSteps: [
      ['أنشئ ملفك', 'سجّل كمؤثر أو موديل، عرّف بنفسك وارفع أفضل أعمالك.'],
      ['استقبل العروض', 'بعد اعتماد ملفك، توصلك طلبات الشركات عن طريق فريقنا.'],
      ['استلم أرباحك', 'نتفق على التفاصيل وياك بوضوح، وتشتغل وأنت مرتاح.'],
    ],
    servicesEyebrow: 'الخدمات',
    servicesTitle: 'كل ما تحتاجه حملتك، من الفكرة إلى النتيجة',
    camp: ['حملات تسويقية متكاملة', 'انشر تفاصيل حملتك، استقبل طلبات المؤثرين المناسبين، وتابع كل مرحلة من لوحة تحكم واحدة.'],
    campRows: [['ن', 'ريلز إطلاق المنتج', 'منشور'], ['ع', 'مراجعة المطعم', 'قيد التنفيذ'], ['ز', 'جلسة تصوير أزياء', 'مسودة']],
    models: ['حجز موديلز', 'احجز موديل لجلسة تصوير أو فعالية بالتاريخ والوقت اللي يناسبك.'],
    reports: ['تقارير أداء واضحة', 'مشاهدات، تفاعل، ونتائج كل منشور في تقرير واحد.'],
    contracts: ['عقود ودفع آمن', 'اتفاق واضح قبل البدء، والمبلغ يُحوَّل بعد التسليم.'],
    production: ['تصوير وإنتاج محتوى', 'فريق إنتاج يجهّز الفكرة والسكربت والتصوير والمونتاج.'],
    statement: [['المحتوى العراقي', ''], ['صار يحرّك', ''], ['السوق.', ''], ['بريق', 'ac'], ['يوصلك', ''], ['بالناس الصح،', ''], ['بالوقت الصح.', '']],
    faqEyebrow: 'الأسئلة الشائعة',
    faqTitle: 'عندك سؤال؟',
    faqLead: ['ما لكيت جوابك؟ ', 'تواصل ويانا', ' ونرد عليك بأسرع وقت.'],
    faq: [
      ['كيف أسجّل كمؤثر أو موديل؟', 'أنشئ حسابك، أضف روابط حساباتك على مواقع التواصل وأمثلة من أعمالك، وبعد مراجعة الملف يصير ظاهر للشركات.'],
      ['كيف تختار الشركة المؤثر المناسب؟', 'تصفّح الملفات المعتمدة حسب المجال والمدينة، شوف الأعمال، وأرسل طلبك. فريقنا يراجع الطلب ويرتّب التعاون وياك.'],
      // TODO: real payment answer
      ['كيف يتم الدفع؟', '[طريقة الدفع والعمولة]'],
      ['هل أكدر أحجز موديل لجلسة تصوير؟', 'إي. اختر الموديل من صفحة المؤثرين وأرسل طلب حجز من ملفه، وفريقنا يرجعلك بالتفاصيل.'],
      // TODO: real pricing answer
      ['هل المنصة مجانية؟', '[سياسة الأسعار والاشتراك]'],
    ],
    ctaBrandKicker: 'للشركات والعلامات التجارية',
    ctaBrandTitle: 'أطلق حملتك الجاية ويا أفضل المؤثرين',
    ctaBrandBtn: 'سجّل شركتك',
    ctaCreatorKicker: 'للمؤثرين والموديلز',
    ctaCreatorTitle: 'حوّل محتواك إلى دخل ثابت',
    ctaCreatorBtn: 'أنشئ ملفك',
    footBlurb: 'منصة عراقية تربط المؤثرين والموديلز بالشركات للتعاون في الحملات والحجوزات.',
    platform: 'المنصة',
    company: 'الشركة',
    reach: 'تواصل',
    creators: 'المؤثرين',
    brands: 'للشركات',
    joinCreator: 'انضم كمؤثر',
    about: 'من نحن',
    contact: 'تواصل معنا',
    login: 'تسجيل الدخول',
    phone: '[رقم الهاتف]',
    email: '[البريد الإلكتروني]',
    address: '[العنوان]',
    rights: 'جميع الحقوق محفوظة.',
    legal: 'الشروط · الخصوصية',
  },
  en: {
    live: 'Live now',
    pill: 'The first Iraqi platform for creators, models and brands',
    h1: [['Discover', 'the stars'], ['of content', 'in', 'Iraq']],
    lead: 'Browse creators and models, see their work, and book your next collaboration in minutes.',
    searchLabel: 'Search creators',
    searchPh: 'Search by creator name, field or city…',
    search: 'Search',
    popular: 'Popular:',
    trendEyebrow: 'Trending this week',
    trendTitle: ['Most requested', 'by brands'],
    prev: 'Previous',
    next: 'Next',
    catsEyebrow: 'Browse by field',
    catsTitle: 'Every field has its stars',
    allFields: 'All fields',
    modelsEyebrow: 'Models to book',
    modelsTitle: ['Available this week', 'for shoots'],
    modelsLead: 'Pick the model, choose the day and the shoot type, and get confirmation directly.',
    available: 'Available now',
    bookNow: 'Book now',
    gridEyebrow: 'Creators & models',
    gridTitle: ['Pick the right face', 'for your brand'],
    gridLead: 'Filter by field, see past work, and send your collaboration request directly.',
    filterLabel: 'Filter by field',
    all: 'All',
    viewProfile: 'View profile',
    seeAll: 'See all creators',
    bandsLabel: 'Content fields',
    services: ['Ad campaigns', 'Model booking', 'Product shoots', 'Reels & stories', 'Event coverage', 'Openings'],
    howTitle: 'Three steps to your next campaign',
    howLabel: 'Choose account type',
    forBrands: 'For brands',
    forCreators: 'For creators',
    brandSteps: [
      ['Post your campaign', 'Write the campaign idea, budget and the content you need.'],
      ['Pick the creator', 'Receive creator requests, compare their work, and pick the best fit for your audience.'],
      ['Track the results', 'Follow delivery step by step and get the performance report after posting.'],
    ],
    creatorSteps: [
      ['Build your profile', 'Sign up as a creator or model, introduce yourself and upload your best work.'],
      ['Receive offers', 'Once approved, brand requests reach you through our team.'],
      ['Get paid', 'We agree the details with you clearly, so you can focus on the work.'],
    ],
    servicesEyebrow: 'Services',
    servicesTitle: 'Everything your campaign needs, from idea to result',
    camp: ['End-to-end campaigns', 'Post your campaign details, receive requests from the right creators, and follow every stage from one dashboard.'],
    campRows: [['N', 'Product launch reels', 'Published'], ['A', 'Restaurant review', 'In progress'], ['Z', 'Fashion shoot', 'Draft']],
    models: ['Model booking', 'Book a model for a shoot or event on the date and time that suit you.'],
    reports: ['Clear performance reports', 'Views, engagement and results for every post in one report.'],
    contracts: ['Contracts & safe payment', 'A clear agreement before starting; payment is released after delivery.'],
    production: ['Shooting & production', 'A production team prepares the idea, script, shoot and edit.'],
    statement: [['Iraqi content', ''], ['now moves', ''], ['the market.', ''], ['Bareeq', 'ac'], ['connects you', ''], ['with the right people,', ''], ['at the right time.', '']],
    faqEyebrow: 'FAQ',
    faqTitle: 'Got a question?',
    faqLead: ['Didn’t find your answer? ', 'Contact us', ' and we’ll reply as soon as we can.'],
    faq: [
      ['How do I sign up as a creator or model?', 'Create your account, add your social links and examples of your work; once reviewed, your profile is visible to brands.'],
      ['How does a brand pick the right creator?', 'Browse approved profiles by field and city, see their work, and send your request. Our team reviews it and arranges the collaboration.'],
      ['How does payment work?', '[Payment method & commission]'],
      ['Can I book a model for a shoot?', 'Yes. Pick the model from the creators page and send a booking request from their profile; our team gets back to you with the details.'],
      ['Is the platform free?', '[Pricing & subscription policy]'],
    ],
    ctaBrandKicker: 'For brands',
    ctaBrandTitle: 'Launch your next campaign with the best creators',
    ctaBrandBtn: 'Register your company',
    ctaCreatorKicker: 'For creators & models',
    ctaCreatorTitle: 'Turn your content into steady income',
    ctaCreatorBtn: 'Create your profile',
    footBlurb: 'An Iraqi platform connecting creators and models with brands for campaigns and bookings.',
    platform: 'Platform',
    company: 'Company',
    reach: 'Contact',
    creators: 'Creators',
    brands: 'For brands',
    joinCreator: 'Join as creator',
    about: 'About',
    contact: 'Contact us',
    login: 'Log in',
    phone: '[Phone number]',
    email: '[Email]',
    address: '[Address]',
    rights: 'All rights reserved.',
    legal: 'Terms · Privacy',
  },
};

const STEP_ICONS = ['M12 5v14M5 12h14', 'M20 6L9 17l-5-5', 'M4 20V10M10 20V4M16 20v-7M22 20H2'];

/** Repeat a list until it has at least `min` items (marquees need enough cards to loop). */
function fill<T>(list: T[], min: number) {
  if (!list.length) return list;
  const out: T[] = [];
  while (out.length < min) out.push(...list);
  return out;
}

export function RefHome({
  locale,
  people,
  trending,
  models,
  fields,
  chips,
  contact,
}: {
  locale: Locale;
  people: CardPerson[];
  trending: CardPerson[];
  models: CardPerson[];
  fields: RefField[];
  chips: RefChip[];
  contact: Contact | null;
}) {
  const t = T[locale];
  const copy = getCopy(locale);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [field, setField] = useState<number | 'all'>('all');
  const [mode, setMode] = useState<'brands' | 'creators'>('brands');
  const [open, setOpen] = useState(0);
  const href = (person: CardPerson) => `/${locale}/talent/${person.id}`;
  const track = useRef<HTMLDivElement>(null);
  // Same as motion.js slider buttons (±380px), mirrored for left-to-right pages.
  const slide = (step: 1 | -1) => track.current?.scrollBy({ left: step * (locale === 'ar' ? -380 : 380), behavior: 'smooth' });

  function search(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    router.push(`/${locale}/directory${params.toString() ? `?${params}` : ''}`);
  }

  // Each wall row is one sample set rendered twice (seamless loop), like the reference.
  const half = Math.ceil(people.length / 2);
  const rowA = fill(people.slice(0, half), 6).slice(0, Math.max(6, half));
  const rowB = fill(people.slice(half).length ? people.slice(half) : people, 6).slice(0, Math.max(6, people.length - half));
  const shown = (field === 'all' ? people : people.filter((person) => fields.find((item) => item.id === field)?.people.includes(person.id))).slice(0, 8);
  const steps = mode === 'brands' ? t.brandSteps : t.creatorSteps;
  const fieldsWithPeople = fields.filter((item) => item.people.length);
  const bandA = fields.length ? fields.map((item) => item.name) : t.services;

  return (
    <div className="rf">
      <div className="pre" aria-hidden="true">
        <div className="disp pw" style={{ fontSize: '120px', fontWeight: '900', display: 'flex', gap: '4px' }}>
          {locale === 'ar' ? (
            <><span>ب</span><span style={{ animationDelay: '.08s' }}>ر</span><span style={{ animationDelay: '.16s' }}>ي</span><span style={{ animationDelay: '.24s' }}>ق</span></>
          ) : (
            copy.wordmark.split('').map((letter, index) => <span key={index} style={{ animationDelay: `${index * 0.08}s` }}>{letter}</span>)
          )}
        </div>
        <div className="pbar"></div>
      </div>

      <RefNav locale={locale} />

      {/* HERO — creators first */}
      <section id="top" style={{ padding: '72px 0 0', position: 'relative' }}>
        <div className="wrap" style={{ textAlign: 'center', position: 'relative', zIndex: '2' }}>
          <div className="fd" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 18px 8px 8px', border: '1px solid #2C2936', borderRadius: '999px', fontSize: '14px', color: '#B1ACBE', animationDelay: '1.7s' }}> <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#17151E', borderRadius: '999px', padding: '4px 12px', color: '#F5F2EA', fontWeight: '600' }}><span className="live"></span>{t.live}</span> {t.pill} </div>
          <h1 className="disp" style={{ margin: '28px 0 0', fontSize: 'clamp(54px, 8.6vw, 136px)', lineHeight: '1.06', fontWeight: '900', letterSpacing: '-1.5px' }}> <span className="ln"><span className="w" style={{ animationDelay: '1.75s' }}>{t.h1[0][0]}</span> <span className="w" style={{ animationDelay: '1.85s' }}><span className="hl" style={{ animationDelay: '2.5s' }}>{t.h1[0][1]}</span></span></span> <span className="ln"><span className="w" style={{ animationDelay: '1.95s' }}>{t.h1[1][0]}</span> <span className="w" style={{ animationDelay: '2.05s' }}>{t.h1[1][1]}</span> <span className="w ac" style={{ animationDelay: '2.15s' }}>{t.h1[1][2]}</span></span> </h1>
          <p className="lead fd" style={{ maxWidth: '620px', margin: '26px auto 0', animationDelay: '2.3s' }}>{t.lead}</p>
          <form className="fd" role="search" onSubmit={search} style={{ margin: '34px auto 0', maxWidth: '760px', display: 'flex', gap: '8px', padding: '8px', borderRadius: '999px', background: '#17151E', border: '1px solid #2C2936', animationDelay: '2.4s' }}>
            <label style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', color: '#8A859B' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>
              <input aria-label={t.searchLabel} placeholder={t.searchPh} value={query} onChange={(event) => setQuery(event.target.value)} style={{ flex: '1', minWidth: '0', background: 'transparent', border: '0', color: '#F5F2EA', fontFamily: 'inherit', fontSize: '16px', outline: 'none', minHeight: '52px' }} />
            </label>
            <button type="submit" className="btn btn-acc mag">{t.search}</button>
          </form>
          {chips.length ? (
            <div className="fd" style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', animationDelay: '2.5s' }}> <span style={{ color: '#8A859B', fontSize: '14px', alignSelf: 'center' }}>{t.popular}</span> {chips.map((chip) => <Link key={chip.href} className="chip" href={chip.href}>{chip.name}</Link>)} </div>
          ) : null}
        </div>

        {/* 3D creator wall */}
        {people.length ? (
          <div className="wall fd" style={{ marginTop: '40px', animationDelay: '2.2s' }}>
            <div className="wall-in">
              <div className="mq-hold" style={{ overflow: 'visible' }}>
                <div className="mq" style={{ gap: '18px' }}>
                  {[...rowA, ...rowA].map((person, index) => (
                    <Link key={`a${index}`} className="wcard ph" href={href(person)} style={{ background: person.tone }} tabIndex={index < rowA.length ? undefined : -1} aria-hidden={index < rowA.length ? undefined : true}>
                      <Shot src={person.shot} />
                      {person.category ? <span className="tag" style={{ position: 'absolute', top: '12px', right: '12px' }}>{person.category}</span> : null}
                      <span className="wn"><span>{person.name}</span><Vf /></span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mq-hold" style={{ overflow: 'visible' }}>
                <div className="mq mq-rev" style={{ gap: '18px', animationDuration: '42s' }}>
                  {[...rowB, ...rowB].map((person, index) => (
                    <Link key={`b${index}`} className="wcard ph" href={href(person)} style={{ background: person.tone }} tabIndex={-1} aria-hidden={index < rowB.length ? undefined : true}>
                      <Shot src={person.shot} />
                      {person.category ? <span className="tag" style={{ position: 'absolute', top: '12px', right: '12px' }}>{person.category}</span> : null}
                      <span className="wn"><span>{person.name}</span>{person.place ? <span style={{ fontSize: '13px', fontWeight: '500', opacity: '.8' }}>{person.place}</span> : null}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* TRENDING creators — TODO: the API has no "trending"; this is sort=popular (most requests). */}
      {trending.length ? (
        <section style={{ padding: '110px 0 60px' }}>
          <div className="wrap rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <span className="eyebrow">{t.trendEyebrow}</span>
              <h2 className="disp h2">{t.trendTitle[0]}<br />{t.trendTitle[1]}</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="ibtn" aria-label={t.prev} data-self="" onClick={() => slide(-1)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg></button>
              <button className="ibtn" aria-label={t.next} data-self="" onClick={() => slide(1)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg></button>
            </div>
          </div>
          <div className="hsc" ref={track} style={{ marginTop: '40px', maxWidth: '1328px', marginInline: 'auto' }}>
            {trending.map((person, index) => (
              <div key={person.id} style={{ width: '340px' }}>
                <Link className="ccard tcard tilt" href={href(person)}>
                  <div className="ph" style={{ height: '420px', background: person.tone }}>
                    <div className="ring" aria-hidden="true"></div>
                    <Shot src={person.shot} />
                    <span className="disp" aria-hidden="true" style={{ position: 'absolute', top: '14px', left: '20px', fontSize: '64px', fontWeight: '900', color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,.5)' }}>{num(index + 1, locale)}</span>
                    {person.category ? <span className="tag" style={{ position: 'absolute', top: '18px', right: '18px' }}>{person.category}</span> : null}
                    <span className="ply" style={{ position: 'absolute', bottom: '18px', left: '18px' }} aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"></path></svg></span>
                  </div>
                  <div style={{ padding: '20px 22px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '19px', fontWeight: '700' }}>{person.name}<Vf /></div>
                      <div style={{ marginTop: '4px', color: '#B1ACBE', fontSize: '14px' }}>{[person.place, person.platform].filter(Boolean).join(' · ')}</div>
                    </div>
                    <svg className="arr" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 7L7 17M7 8v9h9"></path></svg>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* CATEGORY INDEX */}
      {fields.length ? (
        <section style={{ padding: '60px 0 100px' }}>
          <div className="wrap">
            <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginBottom: '36px' }}>
              <div>
                <span className="eyebrow">{t.catsEyebrow}</span>
                <h2 className="disp h2">{t.catsTitle}</h2>
              </div>
              <Link className="btn btn-ghost" href={`/${locale}/directory`}>{t.allFields}<Arr size={18} /></Link>
            </div>
            <div style={{ borderTop: '1px solid #2C2936' }}>
              {fields.map((item, index) => (
                <Link key={item.id} className="row" href={item.href}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    <span className="rn">{num(index + 1, locale)}</span>
                    <span className="rt disp">{item.name}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    <span className="rp" aria-hidden="true">{(item.minis.length ? item.minis : [{ shot: null, tone: '#3B2F7A' }, { shot: null, tone: '#6A2F4A' }, { shot: null, tone: '#4A2F5E' }]).map((mini, mi) => <span key={mi} style={{ background: mini.shot ? `center / cover no-repeat url("${mini.shot}") , ${mini.tone}` : mini.tone }}></span>)}</span>
                    <svg className="ra" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* MODELS */}
      {models.length ? (
        <section className="paper" style={{ padding: '100px 0', borderRadius: '48px' }}>
          <div className="wrap">
            <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
              <div>
                <span className="eyebrow" style={{ color: '#0E0D12' }}>{t.modelsEyebrow}</span>
                <h2 className="disp h2">{t.modelsTitle[0]}<br />{t.modelsTitle[1]}</h2>
              </div>
              <p style={{ margin: '0', maxWidth: '380px', color: '#4E4A5C', fontSize: '17px', lineHeight: '1.8' }}>{t.modelsLead}</p>
            </div>
            <div className="g4" style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }}>
              {models.map((person) => (
                <Link key={person.id} className="ccard tilt clip" href={`${href(person)}#book`} style={{ background: '#FFFFFF', borderColor: '#E2DCCD', color: '#0E0D12' }}>
                  <div className="ph" style={{ aspectRatio: '3 / 4', background: person.tone }}>
                    <div className="ring" aria-hidden="true"></div>
                    <Shot src={person.shot} />
                    <span className="tag" style={{ position: 'absolute', top: '14px', right: '14px' }}><span className="live"></span>{t.available}</span>
                    <span className="view"><span className="btn btn-acc btn-sm">{t.bookNow}</span></span>
                  </div>
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{person.name}</div>
                    <div style={{ marginTop: '4px', color: '#5A566A', fontSize: '14px' }}>{[person.place, person.category].filter(Boolean).join(' · ')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ALL CREATORS GRID */}
      {people.length ? (
        <section id="creators" style={{ padding: '110px 0 96px' }}>
          <div className="wrap">
            <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
              <div>
                <span className="eyebrow">{t.gridEyebrow}</span>
                <h2 className="disp h2">{t.gridTitle[0]}<br />{t.gridTitle[1]}</h2>
              </div>
              <p className="lead" style={{ maxWidth: '380px', fontSize: '17px' }}>{t.gridLead}</p>
            </div>
            <div className="rv" role="group" aria-label={t.filterLabel} style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button className={`chip ${field === 'all' ? 'on' : ''}`} aria-pressed={field === 'all'} onClick={() => setField('all')}>{t.all}</button>
              {fieldsWithPeople.map((item) => (
                <button key={item.id} className={`chip ${field === item.id ? 'on' : ''}`} aria-pressed={field === item.id} onClick={() => setField(item.id)}>{item.name}</button>
              ))}
            </div>
            <div key={String(field)} style={{ marginTop: '36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '22px' }}>
              {shown.map((person, index) => (
                <Link key={person.id} className="ccard tilt pop" href={href(person)} style={{ animationDelay: `${(index * 0.07).toFixed(2)}s` }}>
                  <div className="ph" style={{ aspectRatio: '4 / 4.5', background: person.tone }}>
                    <div className="ring" aria-hidden="true"></div>
                    <Shot src={person.shot} />
                    <span className="ini" aria-hidden="true">{person.initial}</span>
                    {person.category ? <span className="tag" style={{ position: 'absolute', top: '16px', right: '16px' }}>{person.category}</span> : null}
                    <span className="view"><span className="btn btn-acc btn-sm">{t.viewProfile}</span></span>
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700' }}>{person.name}<Vf /></div>
                    <div style={{ marginTop: '4px', color: '#B1ACBE', fontSize: '14px' }}>{[person.place, person.platform].filter(Boolean).join(' · ')}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: '44px', display: 'flex', justifyContent: 'center' }}>
              <Link className="btn btn-acc mag" href={`/${locale}/directory`}>{t.seeAll}<Arr /></Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* MARQUEE BANDS */}
      <section aria-label={t.bandsLabel} style={{ padding: '20px 0 50px', overflow: 'hidden' }}>
        <div style={{ transform: 'rotate(-2deg)', background: 'var(--acc)', color: '#0E0D12', padding: '18px 0', overflow: 'hidden', width: '104%', marginRight: '-2%' }}>
          <div className="mq disp" style={{ gap: '40px', fontSize: '34px', fontWeight: '800', whiteSpace: 'nowrap', alignItems: 'center' }}>
            {[...fill(bandA, 8), ...fill(bandA, 8)].map((name, index) => (
              <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '40px' }}>{name}<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="#0E0D12"></path></svg></span>
            ))}
          </div>
        </div>
        <div style={{ transform: 'rotate(1.2deg)', marginTop: '-6px', background: '#17151E', borderTop: '1px solid #2C2936', borderBottom: '1px solid #2C2936', padding: '16px 0', overflow: 'hidden', width: '104%', marginRight: '-2%' }}>
          <div className="mq mq-rev disp" style={{ gap: '40px', fontSize: '26px', fontWeight: '700', whiteSpace: 'nowrap', color: '#B1ACBE', alignItems: 'center', animationDuration: '44s' }}>
            {[...t.services, ...t.services].map((name, index) => (
              <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '40px' }}>{name}<span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--acc)' }}></span></span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="paper zoom" style={{ padding: '100px 0', borderRadius: '48px' }}>
        <div className="wrap">
          <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <h2 className="disp h2" style={{ margin: '0' }}>{t.howTitle}</h2>
            <div role="group" aria-label={t.howLabel} style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '999px', background: '#E7E2D6' }}>
              <button className={`seg ${mode === 'brands' ? 'on' : ''}`} aria-pressed={mode === 'brands'} style={{ color: '#3A3646' }} onClick={() => setMode('brands')}>{t.forBrands}</button>
              <button className={`seg ${mode === 'creators' ? 'on' : ''}`} aria-pressed={mode === 'creators'} style={{ color: '#3A3646' }} onClick={() => setMode('creators')}>{t.forCreators}</button>
            </div>
          </div>
          <div className="steps" key={mode} style={{ marginTop: '56px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }}>
            {steps.map(([title, text], index) => (
              <div key={title} className="pop lift" style={{ position: 'relative', background: '#FFFFFF', border: '1px solid #E2DCCD', borderRadius: '32px', padding: '32px', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', animationDelay: `${(index * 0.12).toFixed(2)}s` }}>
                <span className="disp" aria-hidden="true" style={{ position: 'absolute', top: '-20px', left: '16px', fontSize: '170px', fontWeight: '900', lineHeight: '1', color: 'transparent', WebkitTextStroke: '2px #E2DCCD' }}>{num(index + 1, locale)}</span>
                <span style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '20px', background: '#0E0D12', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={STEP_ICONS[index]}></path></svg>
                </span>
                <div style={{ position: 'relative' }}>
                  <h3 className="disp" style={{ margin: '0', fontSize: '26px', fontWeight: '800' }}>{title}</h3>
                  <p style={{ margin: '12px 0 0', fontSize: '16px', lineHeight: '1.8', color: '#4E4A5C' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES BENTO */}
      <section id="services" style={{ padding: '112px 0 96px' }}>
        <div className="wrap">
          <div className="rv">
            <span className="eyebrow">{t.servicesEyebrow}</span>
            <h2 className="disp h2" style={{ maxWidth: '780px' }}>{t.servicesTitle}</h2>
          </div>
          <div className="bento" style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '20px' }}>
            <div className="card lift rv" style={{ gridColumn: 'span 4', gridRow: 'span 2', borderRadius: '32px', padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '32px', minHeight: '420px' }}>
              <div>
                <h3 className="disp" style={{ margin: '0', fontSize: '32px', fontWeight: '800' }}>{t.camp[0]}</h3>
                <p style={{ margin: '14px 0 0', maxWidth: '460px', color: '#B1ACBE', fontSize: '17px', lineHeight: '1.8' }}>{t.camp[1]}</p>
              </div>
              <div aria-hidden="true" style={{ background: '#0E0D12', border: '1px solid #2C2936', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', background: '#17151E', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3B2F7A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{t.campRows[0][0]}</span><span style={{ fontWeight: '600' }}>{t.campRows[0][1]}</span></div>
                  <span style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '999px', background: 'var(--acc)', color: '#0E0D12', fontWeight: '600' }}>{t.campRows[0][2]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', background: '#17151E', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1F5A4E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{t.campRows[1][0]}</span><span style={{ fontWeight: '600' }}>{t.campRows[1][1]}</span></div>
                  <span style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '999px', border: '1px solid #5A566A', color: '#F5F2EA', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span className="dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F5B53D' }}></span>{t.campRows[1][2]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', background: '#17151E', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#7A2E3B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{t.campRows[2][0]}</span><span style={{ fontWeight: '600' }}>{t.campRows[2][1]}</span></div>
                  <span style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '999px', border: '1px solid #5A566A', color: '#B1ACBE' }}>{t.campRows[2][2]}</span>
                </div>
              </div>
            </div>
            <div className="lift rv" style={{ gridColumn: 'span 2', background: 'var(--acc)', color: '#0E0D12', border: '1px solid transparent', borderRadius: '32px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px', minHeight: '200px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0E0D12" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
              <div>
                <h3 className="disp" style={{ margin: '0', fontSize: '24px', fontWeight: '800' }}>{t.models[0]}</h3>
                <p style={{ margin: '8px 0 0', fontSize: '15px', lineHeight: '1.7', color: '#2A2733' }}>{t.models[1]}</p>
              </div>
            </div>
            <div className="card lift rv" style={{ gridColumn: 'span 2', borderRadius: '32px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px', minHeight: '200px' }}>
              <div aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '56px' }}> <span className="bar" style={{ width: '14px', height: '30%', background: '#3A3646', borderRadius: '4px', animationDelay: '-.2s' }}></span> <span className="bar" style={{ width: '14px', height: '55%', background: '#3A3646', borderRadius: '4px', animationDelay: '-.6s' }}></span> <span className="bar" style={{ width: '14px', height: '42%', background: '#3A3646', borderRadius: '4px', animationDelay: '-1s' }}></span> <span className="bar" style={{ width: '14px', height: '75%', background: '#5A566A', borderRadius: '4px', animationDelay: '-1.3s' }}></span> <span className="bar" style={{ width: '14px', height: '100%', background: 'var(--acc)', borderRadius: '4px', animationDelay: '-.4s' }}></span> </div>
              <div>
                <h3 className="disp" style={{ margin: '0', fontSize: '24px', fontWeight: '800' }}>{t.reports[0]}</h3>
                <p style={{ margin: '8px 0 0', fontSize: '15px', lineHeight: '1.7', color: '#B1ACBE' }}>{t.reports[1]}</p>
              </div>
            </div>
            <div className="card lift rv" style={{ gridColumn: 'span 3', borderRadius: '32px', padding: '30px', display: 'flex', alignItems: 'center', gap: '22px', minHeight: '160px' }}>
              <span style={{ flex: 'none', width: '64px', height: '64px', borderRadius: '20px', background: '#24212D', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg> </span>
              <div>
                <h3 className="disp" style={{ margin: '0', fontSize: '22px', fontWeight: '800' }}>{t.contracts[0]}</h3>
                <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: '1.7', color: '#B1ACBE' }}>{t.contracts[1]}</p>
              </div>
            </div>
            <div className="card lift rv" style={{ gridColumn: 'span 3', borderRadius: '32px', padding: '30px', display: 'flex', alignItems: 'center', gap: '22px', minHeight: '160px' }}>
              <span style={{ flex: 'none', width: '64px', height: '64px', borderRadius: '20px', background: '#24212D', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h18v11H8l-5 4z"></path><path d="M8 10h8"></path></svg> </span>
              <div>
                <h3 className="disp" style={{ margin: '0', fontSize: '22px', fontWeight: '800' }}>{t.production[0]}</h3>
                <p style={{ margin: '6px 0 0', fontSize: '15px', lineHeight: '1.7', color: '#B1ACBE' }}>{t.production[1]}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATEMENT */}
      <section style={{ padding: '80px 0 120px' }}>
        <div className="wrap">
          <p className="disp" style={{ margin: '0', fontSize: 'clamp(34px, 5.4vw, 80px)', lineHeight: '1.35', fontWeight: '800', letterSpacing: '-.5px' }}>
            {t.statement.map(([phrase, extra], index) => <Fragment key={index}><span className={extra ? `hlv ${extra}` : 'hlv'}>{phrase}</span>{' '}</Fragment>)}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '40px 0 112px' }}>
        <div className="wrap faqw" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '56px', alignItems: 'start' }}>
          <div className="rv">
            <span className="eyebrow">{t.faqEyebrow}</span>
            <h2 className="disp h2" style={{ fontSize: 'clamp(36px, 4.2vw, 56px)' }}>{t.faqTitle}</h2>
            <p className="lead" style={{ marginTop: '16px', fontSize: '17px' }}>{t.faqLead[0]}<Link href={`/${locale}/contact`}>{t.faqLead[1]}</Link>{t.faqLead[2]}</p>
          </div>
          <div style={{ borderTop: '1px solid #2C2936' }}>
            {t.faq.map(([q, a], index) => (
              <div key={q} style={{ borderBottom: '1px solid #2C2936' }}>
                <button className="faq-q" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}> <span>{q}</span> <span className={`pl ${open === index ? 'open' : ''}`} style={{ flex: 'none', width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid #2C2936', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg> </span> </button>
                {open === index ? <p className="pop" style={{ margin: '0', padding: '0 0 24px', maxWidth: '640px', color: '#B1ACBE', fontSize: '16px', lineHeight: '1.9' }}>{a}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="join" style={{ padding: '0 0 96px' }}>
        <div className="wrap cta2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
          <div className="rv lift" style={{ position: 'relative', overflow: 'hidden', background: 'var(--acc)', color: '#0E0D12', border: '1px solid transparent', borderRadius: '40px', padding: '48px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '32px' }}>
            <svg className="spin" aria-hidden="true" style={{ position: 'absolute', left: '-60px', bottom: '-60px', opacity: '.18' }} width="260" height="260" viewBox="0 0 24 24"><path d={STAR} fill="#0E0D12"></path></svg>
            <div style={{ position: 'relative' }}>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.ctaBrandKicker}</div>
              <h2 className="disp" style={{ margin: '12px 0 0', fontSize: 'clamp(32px, 3.6vw, 48px)', lineHeight: '1.2', fontWeight: '900' }}>{t.ctaBrandTitle}</h2>
            </div>
            <div style={{ position: 'relative' }}><Link className="btn btn-dark mag" href={`/${locale}/join/client`}>{t.ctaBrandBtn}<Arr /></Link></div>
          </div>
          <div className="rv lift card" style={{ position: 'relative', overflow: 'hidden', borderRadius: '40px', padding: '48px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '32px' }}>
            <div aria-hidden="true" className="spin" style={{ position: 'absolute', left: '-80px', bottom: '-80px', width: '280px', height: '280px', borderRadius: '50%', border: '2px dashed #3A3646' }}></div>
            <div style={{ position: 'relative' }}>
              <div className="ac" style={{ fontWeight: '700', fontSize: '15px' }}>{t.ctaCreatorKicker}</div>
              <h2 className="disp" style={{ margin: '12px 0 0', fontSize: 'clamp(32px, 3.6vw, 48px)', lineHeight: '1.2', fontWeight: '900' }}>{t.ctaCreatorTitle}</h2>
            </div>
            <div style={{ position: 'relative' }}><Link className="btn btn-acc mag" href={`/${locale}/join`}>{t.ctaCreatorBtn}<Arr /></Link></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1F1D27', padding: '64px 0 40px', overflow: 'hidden' }}>
        <div className="wrap foot" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: '40px' }}>
          <div>
            <Link className="logo" href={`/${locale}`}><svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg><span className="disp" style={{ fontSize: '28px', fontWeight: '900' }}>{copy.wordmark}</span></Link>
            <p style={{ margin: '16px 0 0', maxWidth: '320px', color: '#B1ACBE', fontSize: '15px', lineHeight: '1.8' }}>{t.footBlurb}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: '700', marginBottom: '8px' }}>{t.platform}</div>
            <Link className="nl" href={`/${locale}/directory`}>{t.creators}</Link>
            <Link className="nl" href={`/${locale}/request`}>{t.brands}</Link>
            <Link className="nl" href={`/${locale}/join`}>{t.joinCreator}</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: '700', marginBottom: '8px' }}>{t.company}</div>
            <Link className="nl" href={`/${locale}/about`}>{t.about}</Link>
            <Link className="nl" href={`/${locale}/contact`}>{t.contact}</Link>
            <Link className="nl" href={`/${locale}/login`}>{t.login}</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#B1ACBE', fontSize: '15px' }}>
            <div style={{ fontWeight: '700', marginBottom: '4px', color: '#F5F2EA' }}>{t.reach}</div>
            <span dir={contact?.phone ? 'ltr' : undefined}>{contact?.phone || t.phone}</span>
            <span dir={contact?.email ? 'ltr' : undefined}>{contact?.email || t.email}</span>
            <span>{contact?.address || t.address}</span>
          </div>
        </div>
        <div className="disp skx" aria-hidden="true" style={{ marginTop: '56px', textAlign: 'center', fontSize: 'clamp(90px, 20vw, 300px)', fontWeight: '900', lineHeight: '.9', color: 'transparent', WebkitTextStroke: '1.5px #3A3646', userSelect: 'none' }}>{copy.wordmark}</div>
        <div className="wrap" style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', color: '#8A859B', fontSize: '14px' }}> <span>© {new Date().getFullYear()} {copy.wordmark}. {t.rights}</span> <span>{t.legal}</span> </div>
      </footer>
    </div>
  );
}

