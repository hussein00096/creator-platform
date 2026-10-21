'use client';

// 1:1 port of design/reference/about.html (About + contact). Markup, classes and inline style values
// are the reference's; contact cards come from /api/v1/platform-contact, counts from the API.
// The /contact route reuses the same contact section under its own manifesto-style hero.
import Link from 'next/link';
import { Fragment, useState, type FormEvent, type ReactNode } from 'react';
import { RefNav } from '@/components/ref/nav';
import { Arr, STAR, Sil } from '@/components/ref/parts';
import { getCopy } from '@/lib/copy';
import type { Contact, Locale } from '@/lib/types';

const T = {
  ar: {
    eyebrow: 'من نحن',
    h1: [[['نبني'], ['المساحة'], ['اللي']], [['يلتقي'], ['بيها'], ['الإبداع', 'hl']], [['بالسوق'], ['العراقي.', 'ac']]] as string[][][],
    shotTag: '[صورة الفريق أو المكتب]',
    storyEyebrow: 'قصتنا',
    storyTitle: 'بدأت من سؤال بسيط',
    story1: 'ليش التعاون بين الشركات والمؤثرين بالعراق لازم يكون عبر رسائل مبعثرة وأرقام شخصية واتفاقات شفهية؟',
    // TODO: real founding story
    story2: '[اكتب هنا قصة تأسيس المنصة: متى بدأتوا، شنو المشكلة اللي شفتوها، وشلون تحلونها.]',
    // TODO: real founding year
    tags: ['تأسست في [السنة]', 'بغداد، العراق', 'فريق محلي'],
    creators: (n: string) => `${n} مؤثر معتمد`,
    specialties: (n: string) => `${n} تخصص`,
    valuesEyebrow: 'قيمنا',
    valuesTitle: 'شنو نؤمن بيه',
    values: [
      ['١', 'الوضوح', 'اتفاق مكتوب، سعر واضح، وموعد محدد — قبل ما يبدأ أي شغل.'],
      ['٢', 'الثقة', 'حسابات موثّقة ودفع محمي، حتى الطرفين يشتغلون براحة.'],
      ['٣', 'المحلي أولاً', 'منصة مبنية للسوق العراقي، بلغته وطريقة شغله.'],
    ],
    teamEyebrow: 'الفريق',
    teamTitle: 'الناس ورا بريق',
    joinTeam: 'انضم لفريقنا',
    // TODO: real team members (no team data in the backend)
    team: [['#3B2F7A', 'المؤسس والرئيس التنفيذي'], ['#7A2E3B', 'مديرة علاقات المؤثرين'], ['#1F5A4E', 'مدير الشراكات'], ['#2B4C7E', 'مسؤول المنتج']],
    name: '[الاسم]',
    contactEyebrow: 'تواصل معنا',
    contactTitle: 'خلّينا نحچي',
    contactHero: [[['خلّينا'], ['نحچي', 'hl']]] as string[][][],
    contactLead: 'سؤال، شراكة، أو فكرة حملة؟ اكتبلنا ونرد عليك بأسرع وقت.',
    phone: 'الهاتف',
    whatsapp: 'واتساب',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    openMap: 'افتح الموقع على الخريطة',
    website: 'الموقع',
    socials: 'تابعنا',
    fName: 'الاسم',
    fNamePh: 'اسمك',
    fReach: 'رقم الهاتف أو البريد',
    fReachPh: 'كيف نتواصل وياك؟',
    fAbout: 'بخصوص',
    topics: ['شركة', 'مؤثر', 'شراكة', 'أخرى'],
    fMsg: 'رسالتك',
    fMsgPh: 'اكتب رسالتك هنا…',
    send: 'إرسال',
    viaWa: 'يفتح واتساب برسالتك جاهزة',
    viaMail: 'يفتح بريدك برسالتك جاهزة',
    subject: 'رسالة من الموقع',
    from: 'من',
    footer: 'روابط التذييل',
    nav: ['المؤثرين', 'للشركات', 'انضم كمؤثر', 'من نحن'],
  },
  en: {
    eyebrow: 'About us',
    h1: [[['We'], ['build'], ['the space']], [['where'], ['creativity', 'hl']], [['meets'], ['Iraqi'], ['business.', 'ac']]] as string[][][],
    shotTag: '[Team or office photo]',
    storyEyebrow: 'Our story',
    storyTitle: 'It started with a simple question',
    story1: 'Why should collaboration between brands and creators in Iraq run on scattered messages, personal numbers and verbal agreements?',
    story2: '[Write the founding story here: when you started, the problem you saw, and how you solve it.]',
    tags: ['Founded in [year]', 'Baghdad, Iraq', 'Local team'],
    creators: (n: string) => `${n} approved creators`,
    specialties: (n: string) => `${n} specialties`,
    valuesEyebrow: 'Our values',
    valuesTitle: 'What we believe in',
    values: [
      ['01', 'Clarity', 'A written agreement, a clear price and a set date — before any work starts.'],
      ['02', 'Trust', 'Verified accounts and protected payment, so both sides work at ease.'],
      ['03', 'Local first', 'A platform built for the Iraqi market, in its language and its way of working.'],
    ],
    teamEyebrow: 'The team',
    teamTitle: 'The people behind Bareeq',
    joinTeam: 'Join our team',
    team: [['#3B2F7A', 'Founder & CEO'], ['#7A2E3B', 'Creator relations lead'], ['#1F5A4E', 'Partnerships lead'], ['#2B4C7E', 'Product lead']],
    name: '[Name]',
    contactEyebrow: 'Contact us',
    contactTitle: 'Let’s talk',
    contactHero: [[['Let’s'], ['talk', 'hl']]] as string[][][],
    contactLead: 'A question, a partnership or a campaign idea? Write to us and we’ll reply as soon as we can.',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    email: 'Email',
    address: 'Address',
    openMap: 'Open on the map',
    website: 'Website',
    socials: 'Follow us',
    fName: 'Name',
    fNamePh: 'Your name',
    fReach: 'Phone or email',
    fReachPh: 'How do we reach you?',
    fAbout: 'About',
    topics: ['Brand', 'Creator', 'Partnership', 'Other'],
    fMsg: 'Your message',
    fMsgPh: 'Write your message here…',
    send: 'Send',
    viaWa: 'Opens WhatsApp with your message ready',
    viaMail: 'Opens your email app with your message ready',
    subject: 'Message from the website',
    from: 'From',
    footer: 'Footer links',
    nav: ['Creators', 'For brands', 'Join as creator', 'About'],
  },
};

/** Plain number in the locale's digits (no padding). */
function digits(value: number, locale: Locale) {
  return locale === 'ar' ? String(value).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(value);
}

// Link helpers kept from the previous contact page.
function webLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes('.')) return `https://${value.replace(/^\/+/, '')}`;
  return value;
}

function hostOf(value: string) {
  try {
    return new URL(webLink(value)).host.replace(/^www\./, '');
  } catch {
    return value;
  }
}

function isMap(value: string) {
  return /maps\.app\.goo\.gl|google\.[^/]+\/maps|maps\.google/i.test(value);
}

function whatsapp(phone: string) {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = `964${d.slice(1)}`;
  return `https://wa.me/${d}`;
}

const ICONS: Record<string, ReactNode> = {
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path>,
  email: <path d="M4 4h16v16H4zM4 8l8 5 8-5"></path>,
  address: <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"></path>,
  whatsapp: <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"></path>,
  website: <><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path></>,
  socials: <><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></>,
};

type Line = { key: string; label: string; value: string; href: string; ltr?: boolean; external?: boolean };

/** Manifesto hero (`.ln > .w` word reveal) — about headline, or the contact heading on /contact. */
function Hero({ eyebrow, lines }: { eyebrow: string; lines: string[][][] }) {
  let i = 0;
  return (
    <section style={{ padding: '80px 0 100px' }}>
      <div className="wrap">
        <span className="eyebrow fd" style={{ animationDelay: '.05s' }}>{eyebrow}</span>
        <h1 className="disp" style={{ margin: '26px 0 0', fontSize: 'clamp(42px, 6.4vw, 96px)', lineHeight: '1.22', fontWeight: '900', letterSpacing: '-1px' }}>
          {lines.map((line, l) => (
            <Fragment key={l}>
              <span className="ln">
                {line.map(([word, kind], w) => {
                  i += 1;
                  const delay = { animationDelay: `.${i}s` };
                  return (
                    <Fragment key={w}>
                      {w ? ' ' : null}
                      {kind === 'hl' ? (
                        <span className="w" style={delay}><span className="hl" style={{ animationDelay: '1.2s' }}>{word}</span></span>
                      ) : (
                        <span className={`w${kind === 'ac' ? ' ac' : ''}`} style={delay}>{word}</span>
                      )}
                    </Fragment>
                  );
                })}
              </span>{' '}
            </Fragment>
          ))}
        </h1>
      </div>
    </section>
  );
}

/** The reference's contact section, filled from the platform contact. */
function ContactSection({ locale, contact, head }: { locale: Locale; contact: Contact | null; head: boolean }) {
  const t = T[locale];
  const copy = getCopy(locale);
  const [name, setName] = useState('');
  const [reach, setReach] = useState('');
  const [topic, setTopic] = useState(0);
  const [message, setMessage] = useState('');

  const map = contact?.website && isMap(contact.website) ? webLink(contact.website) : '';
  const site = contact?.website && !map ? webLink(contact.website) : '';
  const lines: Line[] = contact ? ([
    contact.phone ? { key: 'phone', label: t.phone, value: contact.phone, href: `tel:${contact.phone}`, ltr: true } : null,
    contact.whatsapp ? { key: 'whatsapp', label: t.whatsapp, value: contact.whatsapp, href: whatsapp(contact.whatsapp), ltr: true, external: true } : null,
    contact.email ? { key: 'email', label: t.email, value: contact.email, href: `mailto:${contact.email}`, ltr: true } : null,
    contact.address || map ? { key: 'address', label: t.address, value: contact.address || t.openMap, href: map, external: true } : null,
    site ? { key: 'website', label: t.website, value: hostOf(site), href: site, ltr: true, external: true } : null,
  ] as (Line | null)[]).filter((item): item is Line => Boolean(item)) : [];
  const socials = contact ? [
    contact.instagram ? { label: copy.platforms.instagram, href: webLink(contact.instagram) } : null,
    contact.tiktok ? { label: copy.platforms.tiktok, href: webLink(contact.tiktok) } : null,
    contact.facebook ? { label: copy.platforms.facebook, href: webLink(contact.facebook) } : null,
    contact.snapchat ? { label: copy.platforms.snapchat, href: webLink(contact.snapchat) } : null,
    contact.xAccount ? { label: copy.platforms.x, href: webLink(contact.xAccount) } : null,
  ].filter((item): item is { label: string; href: string } => Boolean(item)) : [];
  const quiet = Boolean(contact) && lines.length === 0 && socials.length === 0;
  const lead = !contact ? copy.offline : quiet ? copy.contactQuiet : t.contactLead;

  // No message endpoint in the backend: the form hands the typed message to WhatsApp, else to the mail client.
  const channel = contact?.whatsapp ? 'wa' : contact?.email ? 'mail' : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contact || !message.trim()) return;
    const body = [`${t.fAbout}: ${t.topics[topic]}`, '', message.trim(), '', [name.trim(), reach.trim()].filter(Boolean).length ? `${t.from}: ${[name.trim(), reach.trim()].filter(Boolean).join(' — ')}` : ''].join('\n').trim();
    if (channel === 'wa') window.open(`${whatsapp(contact.whatsapp)}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
    else if (channel === 'mail') window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(`${t.subject} — ${t.topics[topic]}`)}&body=${encodeURIComponent(body)}`;
  }

  const card = (item: Line) => {
    const inner = (
      <>
        <span style={{ width: '50px', height: '50px', borderRadius: '16px', background: '#24212D', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[item.key]}</svg></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', color: '#8A859B' }}>{item.label}</div>
          <div style={{ marginTop: '2px', fontWeight: '600', fontSize: '17px', overflowWrap: 'anywhere' }}>{item.ltr ? <span dir="ltr">{item.value}</span> : item.value}</div>
        </div>
      </>
    );
    const style = { padding: '20px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '16px' };
    if (!item.href) return <div key={item.key} className="card lift rv" style={style}>{inner}</div>;
    return <a key={item.key} className="card lift rv ab-ln" style={style} href={item.href} {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}>{inner}</a>;
  };

  return (
    <section id="contact" style={{ padding: head ? '40px 0 110px' : '0 0 110px' }}>
      <div className="wrap split" style={channel ? { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '48px', alignItems: 'start' } : { display: 'grid', gridTemplateColumns: '1fr', gap: '48px', alignItems: 'start', maxWidth: '720px', marginInline: 'auto' }}>
        <div>
          <div className="rv">
            {head ? (
              <>
                <span className="eyebrow">{t.contactEyebrow}</span>
                <h2 className="disp h2">{t.contactTitle}</h2>
              </>
            ) : null}
            <p className="lead" style={{ marginTop: head ? '16px' : '0', fontSize: '17px' }}>{lead}</p>
            {!contact || quiet ? (
              <div style={{ marginTop: '24px' }}><Link className="btn btn-ghost" href={`/${locale}`}>{copy.wordmark}<Arr /></Link></div>
            ) : null}
          </div>
          {lines.length || socials.length ? (
            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lines.map(card)}
              {socials.length ? (
                <div className="card lift rv" style={{ padding: '20px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '50px', height: '50px', borderRadius: '16px', background: '#24212D', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS.socials}</svg></span>
                  <div>
                    <div style={{ fontSize: '14px', color: '#8A859B' }}>{t.socials}</div>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {socials.map((item) => <a key={item.label} className="chip ab-chip" href={item.href} target="_blank" rel="noreferrer">{item.label}</a>)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {channel ? (
          <div className="card rv" style={{ padding: '34px', borderRadius: '34px' }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={submit}>
              <div className="g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                <label>
                  <span className="lbl">{t.fName}</span>
                  <input className="inp" placeholder={t.fNamePh} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </label>
                <label>
                  <span className="lbl">{t.fReach}</span>
                  <input className="inp" placeholder={t.fReachPh} value={reach} onChange={(e) => setReach(e.target.value)} />
                </label>
              </div>
              <div>
                <span className="lbl">{t.fAbout}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {t.topics.map((label, index) => (
                    <button key={label} type="button" className={`chip ${index === topic ? 'on' : ''}`} aria-pressed={index === topic} onClick={() => setTopic(index)}>{label}</button>
                  ))}
                </div>
              </div>
              <label>
                <span className="lbl">{t.fMsg}</span>
                <textarea className="inp" placeholder={t.fMsgPh} value={message} onChange={(e) => setMessage(e.target.value)} required></textarea>
              </label>
              <button type="submit" className="btn btn-acc mag" style={{ alignSelf: 'flex-start' }} title={channel === 'wa' ? t.viaWa : t.viaMail}>{t.send}<Arr /></button>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** about.html footer (single row + outlined wordmark). */
function Footer({ locale }: { locale: Locale }) {
  const t = T[locale];
  const copy = getCopy(locale);
  return (
    <footer style={{ borderTop: '1px solid #1F1D27', padding: '64px 0 40px', overflow: 'hidden' }}>
      <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <Link className="logo" href={`/${locale}`}><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg><span className="disp" style={{ fontSize: '24px', fontWeight: '900' }}>{copy.wordmark}</span></Link>
        <nav aria-label={t.footer} style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <Link className="nl" href={`/${locale}/directory`}>{t.nav[0]}</Link><Link className="nl" href={`/${locale}/request`}>{t.nav[1]}</Link><Link className="nl" href={`/${locale}/join`}>{t.nav[2]}</Link><Link className="nl" href={`/${locale}/about`}>{t.nav[3]}</Link>
        </nav>
        <span style={{ color: '#8A859B', fontSize: '14px' }}>© {new Date().getFullYear()} {copy.wordmark}</span>
      </div>
      <div className="disp skx" aria-hidden="true" style={{ marginTop: '40px', textAlign: 'center', fontSize: 'clamp(90px, 20vw, 300px)', fontWeight: '900', lineHeight: '.9', color: 'transparent', WebkitTextStroke: '1.5px #3A3646', userSelect: 'none' }}>{copy.wordmark}</div>
    </footer>
  );
}

export function RefAbout({ locale, total, specialties, contact }: { locale: Locale; total: number; specialties: number; contact: Contact | null }) {
  const t = T[locale];
  const tags = [
    ...t.tags,
    ...(total > 0 ? [t.creators(digits(total, locale))] : []),
    ...(specialties > 0 ? [t.specialties(digits(specialties, locale))] : []),
  ];
  return (
    <div className="rf">
      <RefNav locale={locale} />

      {/* MANIFESTO */}
      <Hero eyebrow={t.eyebrow} lines={t.h1} />

      {/* STORY */}
      <section style={{ padding: '20px 0 110px' }}>
        <div className="wrap split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <div className="clip" style={{ position: 'relative', height: '560px', borderRadius: '40px', overflow: 'hidden', background: '#24212D' }}>
            {/* TODO: real team/office photo */}
            <div className="pxs" aria-hidden="true" style={{ position: 'absolute', inset: '0', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: '10px', padding: '10px' }}> <span style={{ borderRadius: '24px', background: '#3B2F7A' }}></span><span style={{ borderRadius: '24px', background: '#1F5A4E', gridRow: 'span 2' }}></span><span style={{ borderRadius: '24px', background: '#7A2E3B' }}></span> <span style={{ borderRadius: '24px', background: '#2B4C7E' }}></span><span style={{ borderRadius: '24px', background: '#6B4A1F' }}></span> </div>
            <span className="tag" style={{ position: 'absolute', bottom: '20px', right: '20px' }}>{t.shotTag}</span>
          </div>
          <div>
            <div className="rv">
              <span className="eyebrow">{t.storyEyebrow}</span>
              <h2 className="disp h2" style={{ fontSize: 'clamp(32px, 3.6vw, 52px)' }}>{t.storyTitle}</h2>
            </div>
            <p className="lead rv" style={{ marginTop: '20px' }}>{t.story1}</p>
            <p className="lead rv" style={{ marginTop: '16px' }}>{t.story2}</p>
            <div className="rv" style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {tags.map((tag) => <span key={tag} className="tag-l">{tag}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="paper" style={{ padding: '100px 0', borderRadius: '48px' }}>
        <div className="wrap">
          <div className="rv">
            <span className="eyebrow" style={{ color: '#0E0D12' }}>{t.valuesEyebrow}</span>
            <h2 className="disp h2">{t.valuesTitle}</h2>
          </div>
          <div className="g3" style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
            {t.values.map(([n, title, text]) => (
              <div key={title} className="lift rv" style={{ background: '#FFFFFF', border: '1px solid #E2DCCD', borderRadius: '34px', padding: '34px', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span className="disp" style={{ fontSize: '72px', fontWeight: '900', lineHeight: '1', color: 'transparent', WebkitTextStroke: '2px #0E0D12' }}>{n}</span>
                <div>
                  <h3 className="disp" style={{ margin: '0', fontSize: '28px', fontWeight: '900' }}>{title}</h3>
                  <p style={{ margin: '12px 0 0', color: '#4E4A5C', fontSize: '16px', lineHeight: '1.85' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM — placeholders until team data exists */}
      <section style={{ padding: '110px 0 90px' }}>
        <div className="wrap">
          <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <span className="eyebrow">{t.teamEyebrow}</span>
              <h2 className="disp h2">{t.teamTitle}</h2>
            </div>
            <Link className="btn btn-ghost" href={`/${locale}/contact`}>{t.joinTeam}</Link>
          </div>
          <div className="g4" style={{ marginTop: '44px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }}>
            {t.team.map(([tone, role]) => (
              <div key={role} className="ccard tilt rv">
                <div className="ph" style={{ aspectRatio: '4 / 5', background: tone }}>
                  <div className="ring" aria-hidden="true"></div>
                  <Sil />
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: '700', fontSize: '17px' }}>{t.name}</div>
                  <div style={{ marginTop: '4px', color: '#B1ACBE', fontSize: '14px' }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <ContactSection locale={locale} contact={contact} head />

      <Footer locale={locale} />
    </div>
  );
}

/** /contact — the about page's contact section under its own manifesto-style heading. */
export function RefContact({ locale, contact }: { locale: Locale; contact: Contact | null }) {
  const t = T[locale];
  return (
    <div className="rf">
      <RefNav locale={locale} />
      <Hero eyebrow={contact?.companyName ? `${t.contactEyebrow} · ${contact.companyName}` : t.contactEyebrow} lines={t.contactHero} />
      <ContactSection locale={locale} contact={contact} head={false} />
      <Footer locale={locale} />
    </div>
  );
}
