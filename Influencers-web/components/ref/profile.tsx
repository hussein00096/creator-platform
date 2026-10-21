'use client';

// 1:1 port of design/reference/profile.html. Markup, classes and inline style values are the
// reference's; data is the creator from /api/v1/influencers/:id, the save heart is the site's
// localStorage `bq-saved` list, share is the Web Share API / clipboard, and the booking card
// (profile-book.tsx) keeps the real service-request flow.
import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import { RefFooter, RefNav } from '@/components/ref/nav';
import { Shot } from '@/components/ref/parts';
import { ProfileBook } from '@/components/ref/profile-book';
import { ProfileWorks } from '@/components/ref/profile-works';
import { getCopy } from '@/lib/copy';
import { categoryLabel, languageLabel, placeLabel, socialHref } from '@/lib/names';
import { toCard, toneFor } from '@/lib/people';
import type { Influencer, Locale } from '@/lib/types';

const KEY = 'bq-saved';

const T = {
  ar: {
    save: 'حفظ المؤثر',
    unsave: 'إزالة من المحفوظين',
    share: 'مشاركة',
    copied: 'تم نسخ الرابط',
    copyFail: 'انسخ الرابط وشاركه',
    message: (f: boolean) => (f ? 'راسلها' : 'راسله'),
    book: 'احجز تعاون',
    state: (s: string, f: boolean) => (s === 'busy' ? (f ? 'مشغولة حالياً' : 'مشغول حالياً') : s === 'paused' ? 'في استراحة' : f ? 'متاحة للتعاون' : 'متاح للتعاون'),
    followers: '[المتابعين]',
    about: 'نبذة',
    tabs: 'أقسام الملف',
    works: 'الأعمال',
    details: 'التفاصيل',
    similar: 'مؤثرين مشابهين',
    all: 'عرض الكل',
    fields: 'المجالات',
    place: 'المدينة',
    years: 'الخبرة',
    languages: 'اللغات',
  },
  en: {
    save: 'Save creator',
    unsave: 'Remove from saved',
    share: 'Share',
    copied: 'Link copied',
    copyFail: 'Copy the link and share it',
    message: () => 'Message',
    book: 'Book a collab',
    state: (s: string) => (s === 'busy' ? 'Busy right now' : s === 'paused' ? 'On a break' : 'Open to collabs'),
    followers: '[Followers]',
    about: 'About',
    tabs: 'Profile sections',
    works: 'Work',
    details: 'Details',
    similar: 'Similar creators',
    all: 'View all',
    fields: 'Fields',
    place: 'City',
    years: 'Experience',
    languages: 'Languages',
  },
};

// Dot colours of the reference stat cards, per platform (facebook / x not in the reference).
const DOT: Record<string, string> = { instagram: '#FF4F9A', tiktok: '#46E3C8', snapchat: '#F5D33D', youtube: '#FF5A4A', facebook: '#4F8BFF', x: '#F5F2EA' };

function yearsLabel(locale: Locale, years: number) {
  if (!years) return '';
  if (locale === 'en') return `${years} ${years === 1 ? 'year' : 'years'}`;
  if (years === 1) return 'سنة واحدة';
  if (years === 2) return 'سنتان';
  if (years <= 10) return `${years} سنوات`;
  return `${years} سنة`;
}

function readSaved(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
  } catch {
    return [];
  }
}

/** Reference avatar silhouette (alpha .25, unlike the card silhouette). */
function Sil25() {
  return (
    <svg className="sil" viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><circle cx="100" cy="86" r="44" fill="rgba(255,255,255,.25)"></circle><path d="M14 230c4-62 42-100 86-100s82 38 86 100z" fill="rgba(255,255,255,.25)"></path></svg>
  );
}

const tabStyle = (on: boolean) => ({ position: 'relative' as const, minHeight: '56px', padding: '0 22px', background: 'transparent', border: '0', fontFamily: 'inherit', fontSize: '17px', fontWeight: '600', cursor: 'pointer', color: on ? '#F5F2EA' : '#8A859B' });
const barStyle = (on: boolean) => ({ position: 'absolute' as const, right: '0', left: '0', bottom: '-1px', height: '3px', borderRadius: '3px', background: 'var(--acc)', transform: `scaleX(${on ? 1 : 0})`, transition: 'transform .45s cubic-bezier(.2,.8,.2,1)' });

export function RefProfile({ locale, person, similar }: { locale: Locale; person: Influencer; similar: Influencer[] }) {
  const t = T[locale];
  const copy = getCopy(locale);
  const profile = person.profile!;
  const female = profile.gender === 'female';
  const tone = toneFor(person.id);
  const cover = profile.cover || null;
  const shot = profile.avatar || profile.portfolio[0]?.filePath || null;
  const state = profile.availability || 'active';
  const place = profile.locationScope === 'inside_iraq' ? placeLabel(locale, profile.governorate) : placeLabel(locale, profile.country);
  const label = (map: Record<string, string>, key: string) => map[key] || key;
  const years = yearsLabel(locale, profile.experienceYears);
  const languages = profile.languages.map((item) => languageLabel(locale, item)).join(' · ');
  const facts = [
    place ? [t.place, place] : null,
    years ? [t.years, years] : null,
    languages ? [t.languages, languages] : null,
    [copy.gender, label(copy.genderMap, profile.gender)],
    profile.heightCm ? [copy.height, `${profile.heightCm} ${copy.cm}`] : null,
    profile.weightKg ? [copy.weight, `${profile.weightKg} ${copy.kg}`] : null,
    profile.skinTone ? [copy.skin, label(copy.skinMap, profile.skinTone)] : null,
    profile.hairColor ? [copy.hair, label(copy.hairMap, profile.hairColor)] : null,
    profile.eyeColor ? [copy.eyes, label(copy.eyeMap, profile.eyeColor)] : null,
    female && profile.hijab && profile.hijab !== 'not_applicable' ? [copy.hijab, label(copy.hijabMap, profile.hijab)] : null,
  ].filter((item): item is [string, string] => Boolean(item));
  const cards = similar.map((item) => toCard(locale, item));

  const [tab, setTab] = useState<'works' | 'details'>('works');
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => setSaved(readSaved().includes(person.id)), [person.id]);

  function toggle() {
    const next = !saved;
    setSaved(next);
    try {
      const list = readSaved().filter((item) => item !== person.id);
      localStorage.setItem(KEY, JSON.stringify(next ? [...list, person.id] : list));
    } catch {
      /* storage blocked: the heart still toggles for this view */
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: person.name, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote(t.copied);
    } catch {
      setNote(t.copyFail);
    }
    window.setTimeout(() => setNote(''), 2400);
  }

  function toBook(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById('book');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="rf">
      <RefNav locale={locale} />

      {/* COVER */}
      <section style={{ padding: '24px 0 0' }}>
        <div className="wrap">
          <div className="fd" style={{ position: 'relative', height: '340px', borderRadius: '40px', overflow: 'hidden', background: tone, display: 'flex', alignItems: 'center', animationDelay: '.05s' }}>
            {cover ? <img src={cover} alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            <div aria-hidden="true" className="spin" style={{ position: 'absolute', left: '8%', top: '-140px', width: '460px', height: '460px', borderRadius: '50%', border: '2px dashed rgba(255,255,255,.22)' }}></div>
            <div aria-hidden="true" className="spin" style={{ position: 'absolute', left: '14%', top: '-60px', width: '300px', height: '300px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.12)', animationDirection: 'reverse' }}></div>
            <div aria-hidden="true" style={{ width: '100%', overflow: 'hidden', ...(cover ? { position: 'relative' as const } : null) }}>
              <div className="mq disp" style={{ gap: '60px', fontSize: '150px', fontWeight: '900', whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,.35)', animationDuration: '40s' }}>
                {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} dir="auto">{person.name}</span>)}
              </div>
            </div>
            {/* The reference's "[صورة الغلاف]" tag marks where the cover photo goes; the real cover (when uploaded) fills the frame instead. */}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginTop: '-80px', padding: '0 32px', position: 'relative' }} className="pf2-head">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '24px' }}>
              <div className="pop ph" style={{ width: '168px', height: '168px', borderRadius: '50%', background: '#4A3C94', border: '6px solid #0E0D12', animationDelay: '.2s' }}>
                {shot ? <Shot src={shot} /> : <Sil25 />}
              </div>
              <div className="fd" style={{ paddingBottom: '8px', animationDelay: '.3s', minWidth: 0 }}>
                <h1 className="disp pf2-name" style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '44px', fontWeight: '900' }}>
                  <span dir="auto">{person.name}</span>
                  <span className="vf" style={{ width: '30px', height: '30px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></span>
                </h1>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', color: '#B1ACBE', fontSize: '15px' }}>
                  {profile.categories.map((item) => <span key={item.id} className="tag-l">{categoryLabel(locale, item)}</span>)}
                  {place ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>{place}</span> : null}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{state === 'active' ? <span className="live"></span> : <span className="pf2-dot" data-state={state}></span>}{t.state(state, female)}</span>
                </div>
              </div>
            </div>
            <div className="fd pf2-act" style={{ display: 'flex', gap: '10px', paddingBottom: '8px', animationDelay: '.4s' }}>
              <button type="button" className="ibtn pf2-heart" aria-label={saved ? t.unsave : t.save} title={saved ? t.unsave : t.save} aria-pressed={saved} onClick={toggle} style={{ background: 'transparent', borderColor: '#2C2936', color: '#F5F2EA' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"></path></svg>
              </button>
              <button type="button" className="ibtn" aria-label={t.share} title={t.share} onClick={share}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg></button>
              {/* No direct messaging in the API: "message" leads to the booking card, which carries the request form and the team's contact lines. */}
              <a className="btn btn-ghost" href="#book" onClick={toBook}>{t.message(female)}</a>
              <a className="btn btn-acc mag" href="#book" onClick={toBook}>{t.book}</a>
              <span className="pf2-note" role="status" aria-live="polite">{note ? <span className="tag">{note}</span> : null}</span>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section style={{ padding: '56px 0 80px' }}>
        <div className="wrap split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '40px', alignItems: 'start' }}>
          <div>
            {profile.socialAccounts.length ? (
              <div className="g4 rv" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}>
                {profile.socialAccounts.map((item) => {
                  const name = copy.platforms[item.platform as keyof typeof copy.platforms] || item.platform;
                  const handle = /^https?:\/\//i.test(item.handle) ? item.handle : `@${item.handle.replace(/^@+/, '')}`;
                  return (
                    <a key={`${item.platform}-${item.handle}`} className="card lift" href={socialHref(item.platform, item.handle)} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '20px', borderRadius: '22px', color: '#F5F2EA', textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B1ACBE', fontSize: '14px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: DOT[item.platform] || '#B1ACBE' }}></span>{name}</div>
                      {/* TODO: follower counts are not in the API (socialAccounts has platform + handle only). */}
                      <div className="disp" style={{ marginTop: '10px', fontSize: '22px', fontWeight: '800' }}>{t.followers}</div>
                      <div dir="ltr" style={{ marginTop: '4px', fontSize: '13px', color: '#8A859B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: locale === 'ar' ? 'right' : 'left' }}>{handle}</div>
                    </a>
                  );
                })}
              </div>
            ) : null}

            {profile.bio ? (
              <div className="rv" style={{ marginTop: profile.socialAccounts.length ? '36px' : '0' }}>
                <h2 className="disp" style={{ margin: '0', fontSize: '26px', fontWeight: '800' }}>{t.about}</h2>
                <p className="lead" dir="auto" style={{ marginTop: '12px', fontSize: '17px', maxWidth: '720px', whiteSpace: 'pre-line' }}>{profile.bio}</p>
              </div>
            ) : null}

            {/* The reference's "الباقات" and "التقييمات" tabs are omitted: packages and reviews don't exist in the API. "التفاصيل" shows the real look facts. */}
            <div role="tablist" aria-label={t.tabs} className="rv" style={{ marginTop: '44px', display: 'flex', gap: '6px', borderBottom: '1px solid #2C2936' }}>
              <button type="button" role="tab" id="pf2-tab-works" aria-controls="pf2-panel" aria-selected={tab === 'works'} onClick={() => setTab('works')} style={tabStyle(tab === 'works')}>{t.works}<span style={barStyle(tab === 'works')}></span></button>
              <button type="button" role="tab" id="pf2-tab-details" aria-controls="pf2-panel" aria-selected={tab === 'details'} onClick={() => setTab('details')} style={tabStyle(tab === 'details')}>{t.details}<span style={barStyle(tab === 'details')}></span></button>
            </div>

            <div id="pf2-panel" role="tabpanel" aria-labelledby={`pf2-tab-${tab}`}>
              {tab === 'works' ? (
                <ProfileWorks locale={locale} images={profile.portfolio} />
              ) : (
                <div key="details" style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }} className="g3">
                  {facts.map(([title, value], i) => (
                    <div key={title} className="card pop" style={{ padding: '20px', borderRadius: '22px', animationDelay: `${(i * 0.05).toFixed(2)}s` }}>
                      <div style={{ color: '#B1ACBE', fontSize: '14px' }}>{title}</div>
                      <div className="disp" dir="auto" style={{ marginTop: '10px', fontSize: '20px', fontWeight: '800' }}>{value}</div>
                    </div>
                  ))}
                  {profile.categories.length ? (
                    <div className="card pop" style={{ gridColumn: '1 / -1', padding: '20px', borderRadius: '22px' }}>
                      <div style={{ color: '#B1ACBE', fontSize: '14px' }}>{t.fields}</div>
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{profile.categories.map((item) => <span key={item.id} className="tag-l">{categoryLabel(locale, item)}</span>)}</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* booking side card */}
          <ProfileBook locale={locale} talentId={person.id} talentName={person.name} availability={profile.availability} />
        </div>
      </section>

      {/* SIMILAR */}
      {cards.length ? (
        <section style={{ padding: '20px 0 96px' }}>
          <div className="wrap rv" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px' }}>
            <h2 className="disp h2" style={{ fontSize: 'clamp(30px, 3.4vw, 46px)' }}>{t.similar}</h2>
            <Link className="btn btn-ghost btn-sm" href={`/${locale}/directory${profile.categories[0] ? `?categoryId=${profile.categories[0].id}` : ''}`}>{t.all}</Link>
          </div>
          <div className="hsc" style={{ marginTop: '28px', maxWidth: '1328px', marginInline: 'auto' }}>
            {cards.map((card) => (
              <div key={card.id} style={{ width: '270px' }}>
                <Link className="ccard tilt" href={`/${locale}/talent/${card.id}`}>
                  <div className="ph" style={{ height: '300px', background: card.tone }}>
                    <div className="ring" aria-hidden="true"></div>
                    <Shot src={card.shot} />
                    {card.category ? <span className="tag" style={{ position: 'absolute', top: '14px', right: '14px' }}>{card.category}</span> : null}
                  </div>
                  <div style={{ padding: '16px 18px' }}><div dir="auto" style={{ fontWeight: '700', fontSize: '17px' }}>{card.name}</div><div style={{ marginTop: '4px', color: '#B1ACBE', fontSize: '14px' }}>{card.place || ' '}</div></div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <RefFooter locale={locale} />
    </div>
  );
}
