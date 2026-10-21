'use client';

// 1:1 port of design/reference/join-creator.html. Markup, classes and inline style values are the
// reference's. The reference's quick-signup fields (name/phone/platform) have no API behind them, so the
// card keeps its look (segmented choice + CTA) and routes to the real sign-up forms instead of collecting
// values that would be thrown away. Collaboration rows are the real top-level categories.
import Link from 'next/link';
import { useState } from 'react';
import { RefFooter, RefNav } from '@/components/ref/nav';
import { Arr, STAR, Vf, num } from '@/components/ref/parts';
import type { Locale } from '@/lib/types';

export type RefJoinField = { id: number; slug: string; name: string; kids: string[]; href: string };

type Seg = 'creator' | 'model';

const T = {
  ar: {
    marquee: ['صانع محتوى', 'موديل', 'صانع محتوى', 'موديل'],
    eyebrow: 'للمؤثرين والموديلز',
    h1: [['محتواك'], ['يستاهل', 'يوصل']] as string[][],
    lead: 'اعرض موهبتك أمام العلامات التجارية في العراق، واستقبل طلبات تعاون حقيقية عن طريق فريق بريق.',
    ticks: ['التسجيل مجاني', 'كل ملف يمر بالمراجعة', 'رقمك ما يظهر للزوار'],
    formLabel: 'تسجيل سريع',
    formTitle: 'ابدأ خلال دقيقة',
    segLabel: 'نوع الحساب',
    segs: { creator: 'صانع محتوى', model: 'موديل' },
    nextLabel: 'شنو راح نطلب منك',
    next: {
      creator: 'تختار مجالك وتخصصك، تحچي عن أسلوبك وحساباتك، وترسل الملف للمراجعة قبل ما يظهر للناس. دقيقتين تقريباً.',
      model: 'تختار تخصصك بالمودل والأزياء، تضيف قياساتك ومعلوماتك، وترسل الملف للمراجعة قبل ما يظهر للناس. دقيقتين تقريباً.',
    },
    adult: 'التسجيل للبالغين فقط: ١٨ سنة فأكثر.',
    cta: 'أنشئ ملفي',
    other: 'مو مبدع؟',
    user: 'حساب عادي',
    or: 'أو',
    brand: 'سجّل شركتك',
    have: 'عندك حساب؟',
    login: 'سجّل دخول',
    benefitsEyebrow: 'ليش بريق؟',
    benefitsTitle: 'ركّز على المحتوى، والباقي علينا',
    benefits: [
      { title: 'عروض توصلك', text: 'ما تحتاج تدوّر — الشركات تلكاك من خلال ملفك.' },
      { title: 'السعر بالاتفاق', text: 'ما نعرض أسعار على الصفحات. نفهم المشروع أول، ونتفق وياك على التفاصيل.' },
      { title: 'شركات معتمدة بس', text: 'الطلبات توصل بس من حسابات شركات اجتازت المراجعة.' },
      { title: 'ملف احترافي', text: 'صفحة خاصة بيك تعرض أعمالك وحساباتك بشكل مرتب.' },
    ],
    stepsEyebrow: 'الرحلة',
    stepsTitle: ['من التسجيل', 'لأول طلب'],
    stepsLead: 'أربع مراحل بسيطة، وكل مرحلة واضحة قدامك.',
    stage: (n: string) => `المرحلة ${n}`,
    steps: [
      { title: 'أنشئ ملفك', text: 'أضف صورك، روابط حساباتك، ونماذج من أفضل أعمالك.' },
      { title: 'التوثيق', text: 'فريقنا يراجع الملف ويتأكد من الحسابات، وتاخذ علامة التوثيق.' },
      { title: 'ملفك يظهر', text: 'بعد الاعتماد يظهر ملفك بدليل المؤثرين، وصورك تنعرض للشركات.' },
      { title: 'استقبل الطلبات', text: 'طلبات الشركات توصلك عن طريق فريقنا، ونتفق وياك على التفاصيل.' },
    ],
    collabEyebrow: 'أنواع التعاون',
    collabTitle: 'شنو ممكن توصلك عروض عليه؟',
    faqEyebrow: 'أسئلة المؤثرين',
    faqTitle: 'قبل ما تبدأ',
    faq: [
      // TODO: acceptance rules and commission are not defined by the platform yet — placeholders.
      ['أحتاج عدد متابعين معيّن حتى أسجّل؟', 'العمر لازم يكون ١٨ سنة فأكثر، وكل ملف يمر بمراجعة فريقنا قبل ما يظهر. [حدد هنا شروط القبول، مثل الحد الأدنى للمتابعين أو نسبة التفاعل.]'],
      ['شكد تاخذ المنصة عمولة؟', '[نسبة عمولة المنصة]'],
      ['شلون أستلم فلوسي؟', 'السعر والتفاصيل نتفق عليها وياك لكل طلب عن طريق فريق بريق. [تفاصيل طريقة الدفع]'],
      ['أكدر أرفض عرض ما يناسبني؟', 'إي. الطلبات توصلك عن طريق فريقنا، وما يتثبت أي تعاون قبل ما نتفق وياك على التفاصيل.'],
    ] as [string, string][],
    ctaTitle: 'دورك تلمع',
    ctaText: 'سجّل اليوم، وخلّي العلامات التجارية تلكاك.',
    ctaBtn: 'أنشئ ملفك المجاني',
  },
  en: {
    marquee: ['Creator', 'Model', 'Creator', 'Model'],
    eyebrow: 'For creators & models',
    h1: [['Your content'], ['deserves to', 'reach']] as string[][],
    lead: 'Show your talent to brands in Iraq and receive real collaboration requests through the Bareeq team.',
    ticks: ['Free to sign up', 'Every profile is reviewed', 'Your number stays private'],
    formLabel: 'Quick sign-up',
    formTitle: 'Start in a minute',
    segLabel: 'Account type',
    segs: { creator: 'Creator', model: 'Model' },
    nextLabel: 'What we will ask',
    next: {
      creator: 'Pick your field and craft, tell us about your style and accounts, then send your profile for review before it goes public. About two minutes.',
      model: 'Pick your modelling specialty, add your measurements and details, then send your profile for review before it goes public. About two minutes.',
    },
    adult: 'Adults only: 18 and over.',
    cta: 'Create my profile',
    other: 'Not a creator?',
    user: 'Normal account',
    or: 'or',
    brand: 'register your company',
    have: 'Have an account?',
    login: 'Sign in',
    benefitsEyebrow: 'Why Bareeq?',
    benefitsTitle: 'Focus on the content, we handle the rest',
    benefits: [
      { title: 'Offers come to you', text: 'No hunting around — brands find you through your profile.' },
      { title: 'Rates by agreement', text: 'No prices on the pages. We understand the project first, then agree the details with you.' },
      { title: 'Approved brands only', text: 'Requests only come from brand accounts that passed review.' },
      { title: 'A professional profile', text: 'Your own page showing your work and accounts, neatly.' },
    ],
    stepsEyebrow: 'The journey',
    stepsTitle: ['From sign-up', 'to your first request'],
    stepsLead: 'Four simple stages, each one clear in front of you.',
    stage: (n: string) => `Stage ${n}`,
    steps: [
      { title: 'Create your profile', text: 'Add your photos, your account links and samples of your best work.' },
      { title: 'Verification', text: 'Our team reviews the profile, checks the accounts, and you get the verified badge.' },
      { title: 'Your profile goes live', text: 'Once approved your profile appears in the creators directory and your photos are shown to brands.' },
      { title: 'Receive requests', text: 'Brand requests reach you through our team, and we agree the details with you.' },
    ],
    collabEyebrow: 'Types of collaboration',
    collabTitle: 'What could you get offers for?',
    faqEyebrow: 'Creator questions',
    faqTitle: 'Before you start',
    faq: [
      ['Do I need a minimum number of followers?', 'You must be 18 or older, and every profile is reviewed by our team before it goes live. [Set the acceptance rules here, e.g. minimum followers or engagement rate.]'],
      ['How much commission does the platform take?', '[Platform commission rate]'],
      ['How do I get paid?', 'The rate and details are agreed with you for each request through the Bareeq team. [Payment method details]'],
      ['Can I turn down an offer that doesn’t suit me?', 'Yes. Requests reach you through our team, and no collaboration is confirmed before we agree the details with you.'],
    ] as [string, string][],
    ctaTitle: 'Your turn to shine',
    ctaText: 'Sign up today and let brands find you.',
    ctaBtn: 'Create your free profile',
  },
};

const ICONS = [
  'M4 4h16v16H4zM4 8l8 5 8-5',
  'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
];

/** Single Eastern-Arabic digit (reference: ١ … ٤). */
const digit = (value: number, locale: string) => (locale === 'ar' ? String(value).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(value));

export function RefJoin({ locale, fields }: { locale: Locale; fields: RefJoinField[] }) {
  const t = T[locale];
  const [seg, setSeg] = useState<Seg>('creator');
  const [open, setOpen] = useState(0);
  const signup = `/${locale}/join/influencer${seg === 'model' ? '?as=model' : ''}`;

  return (
    <div className="rf">
      <RefNav locale={locale} />

      {/* HERO */}
      <section style={{ padding: '64px 0 96px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: '40px', right: '0', left: '0', overflow: 'hidden', opacity: '.5' }}>
          <div className="mq disp" style={{ gap: '60px', fontSize: '220px', fontWeight: '900', whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: '1.5px #2C2936', animationDuration: '60s' }}>
            {t.marquee.map((word, index) => <span key={index}>{word}</span>)}
          </div>
        </div>
        <div className="wrap hero" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '56px', alignItems: 'center' }}>
          <div>
            <span className="eyebrow fd" style={{ animationDelay: '.05s' }}>{t.eyebrow}</span>
            <h1 className="disp" style={{ margin: '22px 0 0', fontSize: 'clamp(50px, 7vw, 108px)', lineHeight: '1.08', fontWeight: '900', letterSpacing: '-1px' }}>
              {' '}<span className="ln"><span className="w" style={{ animationDelay: '.1s' }}>{t.h1[0][0]}</span></span>{' '}
              <span className="ln"><span className="w" style={{ animationDelay: '.2s' }}>{t.h1[1][0]}</span> <span className="w" style={{ animationDelay: '.3s' }}><span className="hl" style={{ animationDelay: '.9s' }}>{t.h1[1][1]}</span></span></span>{' '}
            </h1>
            <p className="lead fd" style={{ marginTop: '24px', maxWidth: '500px', animationDelay: '.5s' }}>{t.lead}</p>
            <div className="fd" style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', gap: '18px', color: '#B1ACBE', fontSize: '15px', animationDelay: '.6s' }}>
              {t.ticks.map((tick) => (
                <span key={tick} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Vf />{tick}</span>
              ))}
            </div>
          </div>

          {/* Quick sign-up card: same look; the choice + CTA route to the real sign-up forms (no quick-signup API). */}
          <div className="card fd" role="region" aria-label={t.formLabel} style={{ padding: '32px', borderRadius: '34px', animationDelay: '.4s', boxShadow: '0 40px 100px rgba(0,0,0,.45)' }}>
            <h2 className="disp" style={{ margin: '0', fontSize: '26px', fontWeight: '800' }}>{t.formTitle}</h2>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="seg-w" role="group" aria-label={t.segLabel} style={{ width: '100%' }}>
                {(['creator', 'model'] as Seg[]).map((value) => (
                  <button key={value} type="button" className={`seg ${seg === value ? 'on' : ''}`} aria-pressed={seg === value} onClick={() => setSeg(value)} style={{ flex: '1' }}>{t.segs[value]}</button>
                ))}
              </div>
              <div>
                <span className="lbl">{t.nextLabel}</span>
                <p key={seg} className="pop jr-next">{t.next[seg]}</p>
                <p className="jr-adult">{t.adult}</p>
              </div>
              <Link className="btn btn-acc mag" href={signup} style={{ width: '100%', marginTop: '6px' }}>{t.cta}<Arr /></Link>
            </div>
            <p style={{ margin: '14px 0 0', textAlign: 'center', color: '#8A859B', fontSize: '13px' }}>
              {t.other} <Link href={`/${locale}/join/user`}>{t.user}</Link> {t.or} <Link href={`/${locale}/join/client`}>{t.brand}</Link>
            </p>
            <p style={{ margin: '6px 0 0', textAlign: 'center', color: '#8A859B', fontSize: '13px' }}>{t.have} <Link href={`/${locale}/login`}>{t.login}</Link></p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ padding: '60px 0 100px' }}>
        <div className="wrap">
          <div className="rv">
            <span className="eyebrow">{t.benefitsEyebrow}</span>
            <h2 className="disp h2" style={{ maxWidth: '720px' }}>{t.benefitsTitle}</h2>
          </div>
          <div className="g4" style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px' }}>
            {t.benefits.map((item, index) => (
              <div key={item.title} className="card lift tilt rv" style={{ position: 'relative', padding: '30px', borderRadius: '30px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                <span className="disp" aria-hidden="true" style={{ position: 'absolute', top: '-18px', left: '12px', fontSize: '130px', fontWeight: '900', color: 'transparent', WebkitTextStroke: '1.5px #2C2936', lineHeight: '1' }}>{digit(index + 1, locale)}</span>
                <span style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '18px', background: 'var(--acc)', color: '#0E0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[index]}></path></svg>
                </span>
                <div style={{ position: 'relative' }}>
                  <h3 className="disp" style={{ margin: '0', fontSize: '22px', fontWeight: '800' }}>{item.title}</h3>
                  <p style={{ margin: '10px 0 0', color: '#B1ACBE', fontSize: '15px', lineHeight: '1.8' }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="paper" style={{ padding: '100px 0', borderRadius: '48px' }}>
        <div className="wrap split" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '64px', alignItems: 'start' }}>
          <div className="side" style={{ position: 'sticky', top: '120px' }}>
            <span className="eyebrow" style={{ color: '#0E0D12' }}>{t.stepsEyebrow}</span>
            <h2 className="disp h2">{t.stepsTitle[0]}<br />{t.stepsTitle[1]}</h2>
            <p style={{ margin: '18px 0 0', color: '#4E4A5C', fontSize: '17px', lineHeight: '1.85', maxWidth: '380px' }}>{t.stepsLead}</p>
          </div>
          <div style={{ position: 'relative', paddingRight: '48px' }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: '15px', top: '10px', bottom: '10px', width: '3px', background: '#E2DCCD', borderRadius: '3px' }}></div>
            <div className="lfill" aria-hidden="true" style={{ position: 'absolute', right: '15px', top: '10px', bottom: '10px', width: '3px', background: '#0E0D12', borderRadius: '3px' }}></div>
            {t.steps.map((step, index) => (
              <div key={step.title} className="rv" style={{ position: 'relative', padding: '0 0 56px' }}>
                <span style={{ position: 'absolute', right: '-48px', top: '4px', width: '34px', height: '34px', borderRadius: '50%', background: 'var(--acc)', border: '4px solid #F5F2EA', boxShadow: '0 0 0 1.5px #0E0D12' }}></span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#5A566A' }}>{t.stage(digit(index + 1, locale))}</div>
                <h3 className="disp" style={{ margin: '6px 0 0', fontSize: '30px', fontWeight: '900' }}>{step.title}</h3>
                <p style={{ margin: '10px 0 0', color: '#4E4A5C', fontSize: '17px', lineHeight: '1.85', maxWidth: '520px' }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLLAB TYPES — real top-level categories */}
      {fields.length ? (
        <section style={{ padding: '110px 0 80px' }}>
          <div className="wrap">
            <div className="rv" style={{ marginBottom: '36px' }}>
              <span className="eyebrow">{t.collabEyebrow}</span>
              <h2 className="disp h2">{t.collabTitle}</h2>
            </div>
            <div style={{ borderTop: '1px solid #2C2936' }}>
              {fields.map((field, index) => (
                <Link key={field.id} className="row" href={field.href}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '28px' }}><span className="rn">{num(index + 1, locale)}</span><span className="rt disp">{field.name}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {field.kids.length ? <span className="rn hide-m" style={{ maxWidth: '260px' }}>{field.kids.join(locale === 'ar' ? '، ' : ', ')}.</span> : null}
                    <svg className="ra" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section style={{ padding: '40px 0 100px' }}>
        <div className="wrap faqw" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '56px', alignItems: 'start' }}>
          <div className="rv">
            <span className="eyebrow">{t.faqEyebrow}</span>
            <h2 className="disp h2" style={{ fontSize: 'clamp(36px, 4.2vw, 56px)' }}>{t.faqTitle}</h2>
          </div>
          <div style={{ borderTop: '1px solid #2C2936' }}>
            {t.faq.map(([q, a], index) => (
              <div key={q} style={{ borderBottom: '1px solid #2C2936' }}>
                <button type="button" className="faq-q" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>
                  <span>{q}</span>
                  <span className={`pl ${open === index ? 'open' : ''}`} style={{ flex: 'none', width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid #2C2936', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg></span>
                </button>
                {open === index ? <p className="pop" style={{ margin: '0', padding: '0 0 24px', maxWidth: '640px', color: '#B1ACBE', fontSize: '16px', lineHeight: '1.9' }}>{a}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 0 96px' }}>
        <div className="wrap">
          <div className="zoom" style={{ position: 'relative', overflow: 'hidden', background: 'var(--acc)', color: '#0E0D12', borderRadius: '44px', padding: '80px 48px', textAlign: 'center' }}>
            <svg className="spin" aria-hidden="true" style={{ position: 'absolute', right: '-80px', top: '-80px', opacity: '.16' }} width="320" height="320" viewBox="0 0 24 24"><path d={STAR} fill="#0E0D12"></path></svg>
            <h2 className="disp" style={{ position: 'relative', margin: '0', fontSize: 'clamp(40px, 6vw, 88px)', fontWeight: '900', lineHeight: '1.1' }}>{t.ctaTitle}</h2>
            <p style={{ position: 'relative', margin: '16px auto 0', maxWidth: '520px', fontSize: '18px', color: '#2A2733' }}>{t.ctaText}</p>
            <Link className="btn btn-dark mag" href={`/${locale}/join/influencer`} style={{ position: 'relative', marginTop: '30px', minHeight: '60px', padding: '0 34px', fontSize: '18px' }}>{t.ctaBtn}</Link>
          </div>
        </div>
      </section>

      <RefFooter locale={locale} />
    </div>
  );
}
