'use client';

// 1:1 port of design/reference/creators.html. Markup, classes and inline style values are the
// reference's; data, filters (URL params), load-more and saved hearts are the site's existing logic.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState, useTransition, type CSSProperties, type FormEvent } from 'react';
import { useSaved } from '@/components/directory-cards';
import { RefFooter, RefNav } from '@/components/ref/nav';
import { Arr, STAR, Shot, Vf } from '@/components/ref/parts';
import type { Facets, Filters } from '@/components/talent-stage';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { categoryLabel, placeLabel } from '@/lib/names';
import { toCard, type CardPerson } from '@/lib/people';
import type { CategoryNode, Influencer, Locale, Place } from '@/lib/types';

type Patch = Partial<Filters>;
type View = 'grid' | 'list';

const T = {
  ar: {
    home: 'البداية',
    crumb: 'المؤثرين',
    h1: ['كل', 'النجوم', 'بمكان', 'واحد'],
    lead: 'مؤثرين، موديلز، مصوّرين ومبدعين اجتازوا المراجعة. فلتر حسب المجال والمدينة ووصل للوجه الصح.',
    verified: 'مبدع موثّق',
    fields: 'مجالات',
    availableNow: 'متاح الآن',
    available: 'متاح',
    weekBadge: 'مبدعين الأسبوع',
    bookBadge: '+ حجز خلال دقائق',
    railLabel: 'المجالات',
    railGroup: 'اختر المجال',
    allFields: 'كل المجالات',
    creatorsN: (n: number) => `${n} مبدع`,
    specialtiesN: (n: string) => `${n} تخصص`,
    kidsLabel: 'التخصصات',
    searchLabel: 'ابحث باسم المؤثر أو الموهبة',
    searchPh: 'ابحث باسم المؤثر أو الموهبة…',
    search: 'ابحث',
    place: 'الموقع',
    sortLabel: 'ترتيب',
    sorts: { popular: 'الأكثر طلباً', newest: 'الأحدث', name: 'الاسم' },
    viewLabel: 'طريقة العرض',
    grid: 'عرض شبكي',
    list: 'عرض قائمة',
    filters: 'الفلاتر',
    clearAll: 'مسح الكل',
    liveTitle: 'متاح الآن',
    liveHint: 'يقبل حجوزات جديدة',
    gender: 'الجنس',
    city: 'المدينة',
    moreCities: 'عرض كل المحافظات +',
    lessCities: 'عرض أقل −',
    platform: 'المنصة',
    budget: 'الميزانية (د.ع)',
    from: 'من',
    to: 'إلى',
    soon: '[قريباً]',
    results: 'نتيجة',
    remove: (label: string) => `إزالة الفلتر: ${label}`,
    weekPick: 'مختار الأسبوع',
    bio: '[نبذة قصيرة عن المبدع وأبرز أعماله]',
    bookCollab: 'احجز تعاون',
    viewProfile: 'شاهد الملف',
    save: 'حفظ',
    unsave: 'إلغاء الحفظ',
    profileOf: (name: string) => `ملف ${name}`,
    startsAt: 'يبدأ من',
    price: '[السعر]',
    book: 'احجز',
    promoKicker: 'للمبدعين',
    promoTitle: ['انت مبدع؟', 'مكانك هنا.'],
    promoText: 'أنشئ ملفك واستقبل عروض الشركات مباشرة.',
    promoBtn: 'انضم مجاناً',
    emptyTitle: 'ما لكينا أحد بهذي الفلاتر',
    emptyText: 'جرّب تغيّر المجال أو المدينة، أو خلّي فريقنا يرشّح لك.',
    emptyClear: 'مسح الفلاتر',
    emptyAsk: 'اطلب اقتراحات',
    offline: 'ما كدرنا نجيب المؤثرين هسه. حاول بعد لحظات.',
    shown: (a: number, b: number) => `عرضنا ${a} من ${b}`,
    more: 'عرض المزيد',
    moreError: 'ما كدرنا نجيب المزيد. حاول مرة ثانية.',
    ctaTitle: 'ما تعرف منو تختار؟',
    ctaText: 'احچيلنا عن حملتك ونرشّح لك أنسب المبدعين خلال ٢٤ ساعة.',
    ctaBtn: 'اطلب ترشيحات',
  },
  en: {
    home: 'Home',
    crumb: 'Creators',
    h1: ['All the', 'stars', 'in one', 'place'],
    lead: 'Creators, models, photographers and makers who passed review. Filter by field and city and find the right face.',
    verified: 'verified creators',
    fields: 'fields',
    availableNow: 'available now',
    available: 'Available',
    weekBadge: 'Creators of the week',
    bookBadge: '+ Book in minutes',
    railLabel: 'Fields',
    railGroup: 'Choose a field',
    allFields: 'All fields',
    creatorsN: (n: number) => `${n} creators`,
    specialtiesN: (n: string) => `${n} specialties`,
    kidsLabel: 'Specialties',
    searchLabel: 'Search by creator name or talent',
    searchPh: 'Search by creator name or talent…',
    search: 'Search',
    place: 'Location',
    sortLabel: 'Sort',
    sorts: { popular: 'Most requested', newest: 'Newest', name: 'Name' },
    viewLabel: 'View',
    grid: 'Grid view',
    list: 'List view',
    filters: 'Filters',
    clearAll: 'Clear all',
    liveTitle: 'Available now',
    liveHint: 'Accepting new bookings',
    gender: 'Gender',
    city: 'City',
    moreCities: 'Show all governorates +',
    lessCities: 'Show less −',
    platform: 'Platform',
    budget: 'Budget (IQD)',
    from: 'From',
    to: 'To',
    soon: '[Soon]',
    results: 'results',
    remove: (label: string) => `Remove filter: ${label}`,
    weekPick: 'Pick of the week',
    bio: '[Short bio and highlights]',
    bookCollab: 'Book a collab',
    viewProfile: 'View profile',
    save: 'Save',
    unsave: 'Unsave',
    profileOf: (name: string) => `${name}'s profile`,
    startsAt: 'From',
    price: '[Price]',
    book: 'Book',
    promoKicker: 'For creators',
    promoTitle: ['A creator?', 'Your place is here.'],
    promoText: 'Create your profile and get brand offers directly.',
    promoBtn: 'Join free',
    emptyTitle: 'No one matches these filters',
    emptyText: 'Try another field or city, or let our team recommend someone.',
    emptyClear: 'Clear filters',
    emptyAsk: 'Ask for suggestions',
    offline: 'We couldn’t load creators right now. Try again in a moment.',
    shown: (a: number, b: number) => `Showing ${a} of ${b}`,
    more: 'Show more',
    moreError: 'Couldn’t load more. Try again.',
    ctaTitle: 'Not sure who to pick?',
    ctaText: 'Tell us about your campaign and we’ll recommend the best creators within 24 hours.',
    ctaBtn: 'Get recommendations',
  },
};

// Field icons, in the reference's order of fields.
const FIELD_ICON: Record<string, string> = {
  'models-fashion': 'M12 6a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1l9 6v2H3v-2l9-6',
  'photography-production': 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  design: 'M12 19l7-7 3 3-7 7zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18zM2 2l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  'audio-production': 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  marketing: 'M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1zM17 8a5 5 0 0 1 0 8',
  'production-services': 'M2 8h20v14H2zM2 8l4-6M10 8l4-6M18 8l4-6',
  'influencers-content': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
};
const ALL_ICON = 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z';
const PLATFORM_DOT: Record<string, string> = { instagram: '#FF4F9A', tiktok: '#46E3C8', youtube: '#FF5A4A', snapchat: '#FFE14D', facebook: '#3D8BFF', x: '#F5F2EA' };
const PLATFORM_ORDER = ['instagram', 'tiktok', 'youtube', 'snapchat', 'facebook', 'x'];
const PIN = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>;
const HEART = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"></path></svg>;
const CHECK = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>;

const eastern = (value: number, locale: Locale) => (locale === 'ar' ? String(value).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(value));

type Row = { person: Influencer; card: CardPerson };

export function RefCreators({
  locale,
  people,
  offline,
  total,
  limit,
  listQuery,
  tree,
  governorates,
  facets,
  deck,
  top,
  filters,
  view: initialView,
}: {
  locale: Locale;
  people: Influencer[];
  offline: boolean;
  total: number;
  limit: number;
  listQuery: string;
  tree: CategoryNode[];
  governorates: Place[];
  facets: Facets | null;
  deck: Influencer[];
  top: Influencer | null;
  filters: Filters;
  view: View;
}) {
  const t = T[locale];
  const copy = getCopy(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [allCities, setAllCities] = useState(false);
  const [view, setView] = useState<View>(initialView);
  const [more, setMore] = useState<{ query: string; pages: Influencer[][] }>({ query: listQuery, pages: [] });
  const [loading, setLoading] = useState(false);
  const [moreError, setMoreError] = useState('');
  const { saved, toggle } = useSaved();
  const { search, categoryId, group, scope, gender, cities, platforms, available, sort } = filters;
  const profile = (id: number) => `/${locale}/talent/${id}`;

  const openParent = tree.find((parent) => parent.slug === group)
    || tree.find((parent) => String(parent.id) === categoryId)
    || tree.find((parent) => (parent.children || []).some((child) => String(child.id) === categoryId))
    || null;
  const openChild = openParent?.children?.find((child) => String(child.id) === categoryId) || null;
  const cityCounts = useMemo(() => new Map((facets?.governorates || []).map((item) => [item.id, item.count])), [facets]);

  // Appended pages belong to one filter set; a new query starts over.
  const extra = more.query === listQuery ? more.pages : [];
  const rows: Row[] = useMemo(() => {
    const seen = new Set<number>();
    return [people, ...extra].flat().filter((person) => (seen.has(person.id) ? false : (seen.add(person.id), true)))
      .map((person) => ({ person, card: toCard(locale, person) }));
  }, [people, extra, locale]);
  // No "featured" flag in the API: the wide card is the most requested creator among the matches.
  const featured: Row | null = view === 'grid' && top && total > 3 ? { person: top, card: toCard(locale, top) } : null;
  const gridRows = featured ? rows.filter((row) => row.person.id !== featured.person.id) : rows;
  const shown = rows.length + (featured && !rows.some((row) => row.person.id === featured.person.id) ? 1 : 0);
  const loadedPages = 1 + extra.length;
  const hasMore = !offline && loadedPages * limit < total;
  const deckCards = deck.length ? Array.from({ length: 3 }, (_, i) => toCard(locale, deck[i % deck.length])) : [];

  function href(patch: Patch, nextView: View = view) {
    const f = { ...filters, ...patch };
    const next = new URLSearchParams();
    if (f.search) next.set('search', f.search);
    if (f.categoryId) next.set('categoryId', f.categoryId);
    if (f.scope) next.set('locationScope', f.scope);
    if (f.group) next.set('group', f.group);
    if (f.gender) next.set('gender', f.gender);
    if (f.cities.length) next.set('governorateIds', f.cities.join(','));
    if (f.platforms.length) next.set('platform', f.platforms.join(','));
    if (f.available) next.set('available', '1');
    if (f.sort) next.set('sort', f.sort);
    if (nextView === 'list') next.set('view', 'list');
    if (limit !== 18) next.set('limit', String(limit));
    const text = next.toString();
    return text ? `/${locale}/directory?${text}` : `/${locale}/directory`;
  }
  const go = (patch: Patch) => startTransition(() => router.push(href(patch), { scroll: false }));
  const pickField = (parent: CategoryNode | null) => go(parent ? { group: parent.slug, categoryId: String(parent.id) } : { group: '', categoryId: '' });
  const pickScope = (value: string) => go({ scope: value, cities: value === 'outside_iraq' ? [] : cities });
  function toggleCity(id: string) {
    const on = cities.includes(id);
    go({ cities: on ? cities.filter((item) => item !== id) : [...cities, id], scope: on ? scope : 'inside_iraq' });
  }
  const togglePlatform = (value: string) => go({ platforms: platforms.includes(value) ? platforms.filter((item) => item !== value) : [...platforms, value] });
  function changeView(next: View) {
    setView(next);
    window.history.replaceState(null, '', href({}, next));
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go({ search: String(new FormData(event.currentTarget).get('search') || '').trim() });
  }
  const clearAll = () => go({ search: '', categoryId: '', group: '', scope: '', gender: '', cities: [], platforms: [], available: false });
  async function loadMore() {
    setLoading(true);
    setMoreError('');
    try {
      const next = await api<Influencer[]>(`/api/v1/influencers?${listQuery}&page=${loadedPages + 1}`);
      setMore({ query: listQuery, pages: [...extra, next.data] });
    } catch {
      setMoreError(t.moreError);
    } finally {
      setLoading(false);
    }
  }

  const byCount = [...governorates].sort((a, b) => (cityCounts.get(b.id) || 0) - (cityCounts.get(a.id) || 0) || a.id - b.id);
  const topCities = byCount.filter((item) => cityCounts.get(item.id)).slice(0, 6);
  const restCities = governorates.filter((item) => !topCities.includes(item));
  const visibleRest = allCities ? restCities : restCities.filter((item) => cities.includes(String(item.id)));
  const platformCounts = new Map((facets?.platforms || []).map((item) => [item.platform, item.count]));
  const platformList = PLATFORM_ORDER.filter((item) => platformCounts.has(item) || platforms.includes(item));

  const active: { key: string; label: string; patch: Patch }[] = [];
  if (search) active.push({ key: 'search', label: `“${search}”`, patch: { search: '' } });
  if (openParent) active.push({ key: 'group', label: categoryLabel(locale, openParent), patch: { group: '', categoryId: '' } });
  if (openParent && openChild) active.push({ key: 'child', label: categoryLabel(locale, openChild), patch: { categoryId: String(openParent.id) } });
  if (scope && !cities.length) active.push({ key: 'scope', label: scope === 'inside_iraq' ? copy.inside : copy.outside, patch: { scope: '' } });
  cities.forEach((id) => {
    const place = governorates.find((item) => String(item.id) === id);
    if (place) active.push({ key: `city-${id}`, label: placeLabel(locale, place), patch: { cities: cities.filter((item) => item !== id) } });
  });
  if (gender === 'male' || gender === 'female') active.push({ key: 'gender', label: copy.genderMap[gender], patch: { gender: '' } });
  platforms.forEach((item) => active.push({ key: `pf-${item}`, label: copy.platforms[item as keyof typeof copy.platforms] || item, patch: { platforms: platforms.filter((p) => p !== item) } }));
  if (available) active.push({ key: 'available', label: t.liveTitle, patch: { available: false } });

  // The promo card follows the fourth item, as in the reference (or ends a shorter grid).
  const promoAt = Math.min(4, gridRows.length);
  const delay = (index: number) => `${(index * 0.06).toFixed(2)}s`;
  const meta = (card: CardPerson) => [card.place, card.platform].filter(Boolean).join(' · ');
  const skills = (person: Influencer) => (person.profile?.categories || []).slice(0, 2).map((item) => categoryLabel(locale, item));
  const thumbs = (person: Influencer) => (person.profile?.portfolio || []).slice(0, 3);

  return (
    <div className="rf">
      <RefNav locale={locale} />

      {/* HERO: headline + live deck */}
      <section style={{ position: 'relative', padding: '48px 0 40px', overflow: 'hidden' }}>
        <div aria-hidden="true" className="spin" style={{ position: 'absolute', left: '6%', top: '40px', width: '520px', height: '520px', borderRadius: '50%', border: '1.5px dashed #2C2936' }}></div>
        <div className="wrap hero" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <div className="fd" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8A859B', fontSize: '14px', animationDelay: '.05s' }}>
              <Link href={`/${locale}`} style={{ color: '#8A859B', textDecoration: 'none' }}>{t.home}</Link>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>
              <span style={{ color: '#F5F2EA' }}>{t.crumb}</span>
            </div>
            <h1 className="disp" style={{ margin: '18px 0 0', fontSize: 'clamp(50px, 7vw, 112px)', lineHeight: '1.06', fontWeight: '900', letterSpacing: '-1px' }}> <span className="ln"><span className="w" style={{ animationDelay: '.1s' }}>{t.h1[0]}</span> <span className="w" style={{ animationDelay: '.2s' }}><span className="hl" style={{ animationDelay: '.8s' }}>{t.h1[1]}</span></span></span> <span className="ln"><span className="w" style={{ animationDelay: '.3s' }}>{t.h1[2]}</span> <span className="w" style={{ animationDelay: '.4s' }}>{t.h1[3]}</span></span> </h1>
            <p className="lead fd" style={{ marginTop: '20px', maxWidth: '520px', animationDelay: '.5s' }}>{t.lead}</p>
            <div className="fd" style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', gap: '28px', animationDelay: '.6s' }}>
              <div><div className="disp" style={{ fontSize: '34px', fontWeight: '900' }}>{facets ? facets.total : '—'}</div><div style={{ color: '#8A859B', fontSize: '14px', marginTop: '2px' }}>{t.verified}</div></div>
              <div style={{ width: '1px', background: '#2C2936' }}></div>
              <div><div className="disp" style={{ fontSize: '34px', fontWeight: '900' }}>{eastern(tree.length, locale)}</div><div style={{ color: '#8A859B', fontSize: '14px', marginTop: '2px' }}>{t.fields}</div></div>
              <div style={{ width: '1px', background: '#2C2936' }}></div>
              <div><div className="disp" style={{ fontSize: '34px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}><span className="live"></span>{facets ? facets.available : '—'}</div><div style={{ color: '#8A859B', fontSize: '14px', marginTop: '2px' }}>{t.availableNow}</div></div>
            </div>
          </div>

          <div className="deckw fd" aria-hidden="true" style={{ position: 'relative', height: '500px', animationDelay: '.3s' }}>
            {deckCards.map((card, index) => (
              <div key={index} className="deck" style={{ animationDelay: ['0s', '-3.5s', '-7s'][index] }}>
                <div style={{ borderRadius: '30px', overflow: 'hidden', background: '#17151E', border: '1px solid #2C2936', boxShadow: '0 40px 80px rgba(0,0,0,.55)' }}>
                  <div className="ph" style={{ height: '300px', background: card.tone }}>
                    <div className="ring" style={{ animation: 'spin 18s linear infinite' }}></div>
                    <Shot src={card.shot} />
                    {card.category ? <span className="tag" style={{ position: 'absolute', top: '14px', right: '14px' }}>{card.category}</span> : null}
                    {card.available ? <span className="tag" style={{ position: 'absolute', top: '14px', left: '14px' }}><span className="live"></span>{t.available}</span> : null}
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '17px' }}>{card.name}<Vf /></div><div style={{ color: '#B1ACBE', fontSize: '13px', marginTop: '3px' }}>{card.place}</div></div>
                    <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--acc)', color: '#0E0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7L7 17M7 8v9h9"></path></svg></span>
                  </div>
                </div>
              </div>
            ))}
            <div className="fl" style={{ '--r': '-4deg', position: 'absolute', bottom: '30px', right: '0', zIndex: '5', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '18px', background: '#F5F2EA', color: '#0E0D12', boxShadow: '0 20px 40px rgba(0,0,0,.45)', fontWeight: '700', fontSize: '14px' } as CSSProperties}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="#0E0D12"></path></svg>
              {t.weekBadge}
            </div>
            <div className="fl" style={{ '--r': '5deg', position: 'absolute', top: '10px', left: '0', zIndex: '5', padding: '12px 16px', borderRadius: '18px', background: 'var(--acc)', color: '#0E0D12', boxShadow: '0 20px 40px rgba(0,0,0,.45)', fontSize: '14px', fontWeight: '700', animationDelay: '-3s' } as CSSProperties}>{t.bookBadge}</div>
          </div>
        </div>
      </section>

      {/* CATEGORY RAIL */}
      <section aria-label={t.railLabel} style={{ padding: '10px 0 36px' }}>
        <div className="hsc" role="group" aria-label={t.railGroup} style={{ maxWidth: '1328px', marginInline: 'auto' }}>
          <button className={`cat ${openParent ? '' : 'on'}`} aria-pressed={!openParent} onClick={() => pickField(null)}>
            <span className="ci"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ALL_ICON}></path></svg></span>
            <span style={{ position: 'relative' }}>
              <span className="disp" style={{ display: 'block', fontSize: '18px', fontWeight: '800', lineHeight: '1.35' }}>{t.allFields}</span>
              <span className="cn" style={{ display: 'block', marginTop: '4px' }}>{t.creatorsN(facets?.total ?? 0)}</span>
            </span>
            <span className="cg disp" aria-hidden="true"></span>
          </button>
          {tree.map((parent, index) => {
            const on = openParent?.id === parent.id;
            return (
              <button key={parent.id} className={`cat ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => pickField(on ? null : parent)}>
                <span className="ci"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={FIELD_ICON[parent.slug] || ALL_ICON}></path></svg></span>
                <span style={{ position: 'relative' }}>
                  <span className="disp" style={{ display: 'block', fontSize: '18px', fontWeight: '800', lineHeight: '1.35' }}>{categoryLabel(locale, parent)}</span>
                  <span className="cn" style={{ display: 'block', marginTop: '4px' }}>{t.specialtiesN(eastern((parent.children || []).length, locale))}</span>
                </span>
                <span className="cg disp" aria-hidden="true">{eastern(index + 1, locale)}</span>
              </button>
            );
          })}
        </div>
        {/* Existing site behaviour kept: a chosen field shows its specialties to narrow further. */}
        {openParent && (openParent.children || []).length ? (
          <div className="wrap" role="group" aria-label={t.kidsLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {(openParent.children || []).map((child) => {
              const on = String(child.id) === categoryId;
              return <button key={child.id} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} style={{ minHeight: '40px', padding: '0 14px', fontSize: '14px' }} onClick={() => go({ group: openParent.slug, categoryId: on ? String(openParent.id) : String(child.id) })}>{categoryLabel(locale, child)}</button>;
            })}
          </div>
        ) : null}
      </section>

      {/* STICKY TOOLBAR */}
      <div className="tool">
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', paddingTop: '14px', paddingBottom: '14px' }}>
          <form role="search" onSubmit={submitSearch} style={{ flex: '1 1 340px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 6px 6px 18px', paddingRight: '18px', minHeight: '56px', borderRadius: '999px', background: '#17151E', border: '1px solid #2C2936', color: '#8A859B' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>
            <input key={search} name="search" defaultValue={search} aria-label={t.searchLabel} placeholder={t.searchPh} style={{ flex: '1', minWidth: '0', background: 'transparent', border: '0', color: '#F5F2EA', fontFamily: 'inherit', fontSize: '16px', outline: 'none', minHeight: '44px' }} />
            <button type="submit" className="btn btn-acc btn-sm" style={{ minHeight: '44px' }}>{t.search}</button>
          </form>
          <div className="seg-w" role="group" aria-label={t.place}>
            {[{ value: '', label: copy.scopeAll }, { value: 'inside_iraq', label: copy.inside }, { value: 'outside_iraq', label: copy.outside }].map((item) => (
              <button key={item.label} className={`seg ${scope === item.value ? 'on' : ''}`} aria-pressed={scope === item.value} onClick={() => pickScope(item.value)}>{item.label}</button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B1ACBE', fontSize: '14px' }}>
            <span className="hide-m">{t.sortLabel}</span>
            {/* TODO: "الأعلى تقييماً" from the reference needs ratings, which the API doesn't have; "الاسم" is offered instead. */}
            <select className="inp" value={sort || 'newest'} onChange={(event) => go({ sort: event.target.value === 'newest' ? '' : event.target.value })} style={{ width: '170px', minHeight: '52px', borderRadius: '999px' }}>
              <option value="popular">{t.sorts.popular}</option><option value="newest">{t.sorts.newest}</option><option value="name">{t.sorts.name}</option>
            </select>
          </label>
          <div className="seg-w" role="group" aria-label={t.viewLabel}>
            <button className={`seg ${view === 'grid' ? 'on' : ''}`} aria-label={t.grid} aria-pressed={view === 'grid'} style={{ padding: '0 14px' }} onClick={() => changeView('grid')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d={ALL_ICON}></path></svg></button>
            <button className={`seg ${view === 'list' ? 'on' : ''}`} aria-label={t.list} aria-pressed={view === 'list'} style={{ padding: '0 14px' }} onClick={() => changeView('list')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg></button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <section style={{ padding: '36px 0 90px' }}>
        <div className="wrap split" style={{ display: 'grid', gridTemplateColumns: '290px minmax(0, 1fr)', gap: '36px', alignItems: 'start' }}>
          <aside className="side" aria-label={t.filters} style={{ position: 'sticky', top: '176px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ padding: '22px', borderRadius: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="disp" style={{ margin: '0', fontSize: '20px', fontWeight: '800' }}>{t.filters}</h2>
                <button onClick={clearAll} style={{ background: 'transparent', border: '0', color: 'var(--acc)', fontFamily: 'inherit', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '44px' }}>{t.clearAll}</button>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* The reference's "موثّق فقط" switch is left out: every listed creator is already admin-approved. */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '48px' }}>
                  <span><span style={{ display: 'block', fontWeight: '600', fontSize: '15px' }}>{t.liveTitle}</span><span style={{ display: 'block', fontSize: '13px', color: '#8A859B' }}>{t.liveHint}</span></span>
                  <button className={`sw ${available ? 'on' : ''}`} role="switch" aria-checked={available} aria-label={t.liveTitle} onClick={() => go({ available: !available })}></button>
                </div>
                {/* Existing site filter kept: gender. */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '48px' }}>
                  <span style={{ display: 'block', fontWeight: '600', fontSize: '15px' }}>{t.gender}</span>
                  <div className="seg-w" role="group" aria-label={t.gender}>
                    {[{ value: '', label: copy.genderAll }, { value: 'female', label: copy.genderMap.female }, { value: 'male', label: copy.genderMap.male }].map((item) => (
                      <button key={item.label} className={`seg ${gender === item.value ? 'on' : ''}`} aria-pressed={gender === item.value} style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }} onClick={() => go({ gender: item.value })}>{item.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {scope !== 'outside_iraq' && governorates.length ? (
              <div className="card" style={{ padding: '22px', borderRadius: '26px' }}>
                <div className="lbl" style={{ margin: '0 0 6px' }}>{t.city}</div>
                {[...topCities, ...visibleRest].map((item) => {
                  const id = String(item.id);
                  const on = cities.includes(id);
                  return (
                    <button key={item.id} className={`ck ${on ? 'on' : ''}`} role="checkbox" aria-checked={on} onClick={() => toggleCity(id)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span className="bx">{CHECK}</span>{placeLabel(locale, item)}</span>
                      <span style={{ fontSize: '13px', color: '#8A859B' }}>{cityCounts.get(item.id) || 0}</span>
                    </button>
                  );
                })}
                {restCities.length ? <button onClick={() => setAllCities((v) => !v)} aria-expanded={allCities} style={{ marginTop: '6px', background: 'transparent', border: '0', color: 'var(--acc)', fontFamily: 'inherit', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '44px', padding: '0 4px' }}>{allCities ? t.lessCities : t.moreCities}</button> : null}
              </div>
            ) : null}

            <div className="card" style={{ padding: '22px', borderRadius: '26px' }}>
              {platformList.length ? (
                <>
                  <div className="lbl" style={{ margin: '0 0 12px' }}>{t.platform}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {platformList.map((item) => {
                      const on = platforms.includes(item);
                      return <button key={item} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} style={{ minHeight: '40px', padding: '0 14px', fontSize: '14px' }} onClick={() => togglePlatform(item)}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLATFORM_DOT[item] }}></span>{copy.platforms[item as keyof typeof copy.platforms] || item}</button>;
                    })}
                  </div>
                </>
              ) : null}
              {/* TODO: no price data in the API yet — budget stays disabled until creators publish prices. */}
              <div className="lbl" style={{ margin: '20px 0 10px' }}>{t.budget} <span style={{ color: '#8A859B', fontWeight: '500' }}>{t.soon}</span></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="inp" aria-label={t.from} placeholder={t.from} inputMode="numeric" disabled style={{ minHeight: '46px' }} />
                <input className="inp" aria-label={t.to} placeholder={t.to} inputMode="numeric" disabled style={{ minHeight: '46px' }} />
              </div>
            </div>
          </aside>

          <div aria-live="polite" aria-busy={pending || undefined} style={{ opacity: pending ? 0.6 : 1, transition: 'opacity .25s' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '22px' }}>
              <div>
                <div className="disp" style={{ fontSize: '26px', fontWeight: '900' }}>{offline ? '—' : total} <span style={{ color: '#8A859B', fontWeight: '700' }}>{t.results}</span></div>
                <div style={{ color: '#8A859B', fontSize: '14px', marginTop: '2px' }}>{openChild ? categoryLabel(locale, openChild) : openParent ? categoryLabel(locale, openParent) : t.allFields}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {active.map((item) => (
                  <button key={item.key} className="chip on" aria-label={t.remove(item.label)} style={{ minHeight: '40px', padding: '0 14px', fontSize: '14px' }} onClick={() => go(item.patch)}>{item.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                ))}
              </div>
            </div>

            {offline || (rows.length === 0 && !featured) ? (
              <div style={{ border: '1.5px dashed #2C2936', borderRadius: '28px', padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
                <div className="disp" style={{ fontSize: '24px', fontWeight: '800' }}>{offline ? t.offline : t.emptyTitle}</div>
                {offline ? null : <p className="lead" style={{ fontSize: '16px', maxWidth: '420px' }}>{t.emptyText}</p>}
                {offline ? null : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={clearAll}>{t.emptyClear}</button>
                    <Link className="btn btn-acc btn-sm" href={`/${locale}/request`}>{t.emptyAsk}</Link>
                  </div>
                )}
              </div>
            ) : view === 'list' ? (
              /* LIST VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rows.map(({ person, card }, index) => (
                  <Link key={person.id} className="lrow pop" href={profile(person.id)} style={{ animationDelay: delay(index % 12) }}>
                    <span className="ph" style={{ width: '84px', height: '84px', borderRadius: '20px', background: card.tone }}><Shot src={card.shot} /></span>
                    <span style={{ minWidth: '0' }}>
                      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700' }}>{card.name}<Vf />{card.category ? <span className="tag-l" style={{ fontSize: '12px', padding: '4px 10px' }}>{card.category}</span> : null}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#B1ACBE', fontSize: '14px' }}>{PIN}{[card.place, card.platform, skills(person)[0]].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="lend" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* TODO: no price data in the API yet */}
                      <span style={{ fontSize: '13px', color: '#8A859B' }}>{t.startsAt} <strong style={{ color: '#F5F2EA', fontSize: '15px' }}>{t.price}</strong></span>
                      <span className="ibtn" aria-hidden="true"><Arr size={18} /></span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              /* GRID VIEW */
              <div className="g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
                {featured ? (
                  <div className="ccard span2 pop" style={{ flexDirection: 'row', flexWrap: 'wrap', animationDelay: '0.00s' }}>
                    <Link className="ph" href={profile(featured.person.id)} aria-label={t.profileOf(featured.card.name)} style={{ flex: '1 1 260px', minHeight: '380px', background: featured.card.tone }}>
                      <div className="ring" aria-hidden="true"></div>
                      <Shot src={featured.card.shot} />
                      <span style={{ position: 'absolute', top: '16px', right: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--acc)', color: '#0E0D12', fontSize: '13px', fontWeight: '700', padding: '7px 12px', borderRadius: '999px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="#0E0D12"></path></svg>
                        {t.weekPick}</span>
                    </Link>
                    <div style={{ flex: '1 1 260px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{featured.card.category ? <span className="tag-l">{featured.card.category}</span> : null}{featured.card.place ? <span className="tag-l">{featured.card.place}</span> : null}</div>
                        <h3 className="disp" style={{ margin: '16px 0 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '34px', fontWeight: '900', lineHeight: '1.2' }}>{featured.card.name}<span className="vf" style={{ width: '26px', height: '26px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></span></h3>
                        <p style={{ margin: '10px 0 0', color: '#B1ACBE', fontSize: '15px', lineHeight: '1.8', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' } as CSSProperties}>{featured.person.profile?.bio || t.bio}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }} aria-hidden="true">
                        {[0, 1, 2].map((i) => {
                          const shot = thumbs(featured.person)[i];
                          return <span key={i} style={{ height: '76px', borderRadius: '14px', background: shot ? `center / cover no-repeat url("${shot.filePath}"), ${featured.card.tone}` : featured.card.tone, opacity: shot ? 1 : 0.5 }}></span>;
                        })}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <Link className="btn btn-acc mag" href={`${profile(featured.person.id)}#book`}>{t.bookCollab}</Link>
                        <Link className="btn btn-ghost" href={profile(featured.person.id)}>{t.viewProfile}</Link>
                      </div>
                    </div>
                  </div>
                ) : null}
                {gridRows.map(({ person, card }, index) => {
                  const isSaved = saved.includes(person.id);
                  const ts = thumbs(person);
                  return (
                    <Fragment key={person.id}>
                      <div className="ccard tilt pop" style={{ animationDelay: delay(((featured ? 1 : 0) + index) % 12) }}>
                        <button className="save" aria-label={isSaved ? t.unsave : t.save} aria-pressed={isSaved} onClick={() => toggle(person.id)} style={isSaved ? { background: 'var(--acc)', color: '#0E0D12' } : { background: 'rgba(14,13,18,.55)', color: '#F5F2EA' }}>{HEART}</button>
                        <Link className="ph" href={profile(person.id)} aria-label={t.profileOf(card.name)} style={{ aspectRatio: '4 / 4.4', background: card.tone }}>
                          <div className="ring" aria-hidden="true"></div>
                          <Shot src={card.shot} />
                          <span className="scrim" aria-hidden="true"></span>
                          {card.category ? <span className="tag" style={{ position: 'absolute', top: '16px', right: '16px' }}>{card.category}</span> : null}
                          {card.available ? <span className="tag" style={{ position: 'absolute', bottom: '16px', right: '16px' }}><span className="live"></span>{t.available}</span> : null}
                          {ts.length ? <span className="thumbs" aria-hidden="true">{ts.map((shot) => <span key={shot.id} style={{ background: `center / cover no-repeat url("${shot.filePath}")` }}></span>)}</span> : null}
                        </Link>
                        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <Link href={profile(person.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700', color: '#F5F2EA', textDecoration: 'none' }}>{card.name}<Vf /></Link>
                            {meta(card) ? <div style={{ marginTop: '4px', color: '#B1ACBE', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>{PIN}{meta(card)}</div> : null}
                          </div>
                          {skills(person).length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{skills(person).map((skill) => <span key={skill} className="tag-l" style={{ fontSize: '12px', padding: '4px 10px' }}>{skill}</span>)}</div> : null}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingTop: '12px', borderTop: '1px solid #2C2936' }}>
                            {/* TODO: no price data in the API yet */}
                            <span style={{ fontSize: '13px', color: '#8A859B' }}>{t.startsAt} <strong style={{ color: '#F5F2EA', fontSize: '15px' }}>{t.price}</strong></span>
                            <Link className="btn btn-ghost btn-sm" href={`${profile(person.id)}#book`} style={{ minHeight: '40px', padding: '0 14px', fontSize: '14px' }}>{t.book}</Link>
                          </div>
                        </div>
                      </div>
                      {index + 1 === promoAt ? <Promo locale={locale} t={t} /> : null}
                    </Fragment>
                  );
                })}
                {promoAt === 0 ? <Promo locale={locale} t={t} /> : null}
              </div>
            )}

            {!offline && total > 0 ? (
              <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '240px', height: '4px', borderRadius: '4px', background: '#2C2936', overflow: 'hidden' }}><div style={{ width: `${Math.round(Math.min(1, shown / Math.max(1, total)) * 100)}%`, height: '100%', background: 'var(--acc)' }}></div></div>
                <span style={{ color: '#8A859B', fontSize: '14px' }}>{t.shown(Math.min(shown, total), total)}</span>
                {hasMore ? (
                  <button className="btn btn-ghost mag" onClick={loadMore} disabled={loading} aria-busy={loading || undefined}>{t.more}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></button>
                ) : null}
                {moreError ? <p role="alert" style={{ margin: '0', color: '#FF8A8A', fontSize: '14px' }}>{moreError}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 0 96px' }}>
        <div className="wrap">
          <div className="zoom" style={{ position: 'relative', overflow: 'hidden', background: '#F5F2EA', color: '#0E0D12', borderRadius: '40px', padding: '56px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '28px' }}>
            <div aria-hidden="true" className="spin" style={{ position: 'absolute', left: '22%', top: '-120px', width: '300px', height: '300px', borderRadius: '50%', border: '2px dashed #C9C2B2' }}></div>
            <div style={{ position: 'relative' }}>
              <h2 className="disp" style={{ margin: '0', fontSize: 'clamp(30px, 3.6vw, 50px)', fontWeight: '900', lineHeight: '1.2' }}>{t.ctaTitle}</h2>
              <p style={{ margin: '10px 0 0', fontSize: '17px', color: '#4E4A5C' }}>{t.ctaText}</p>
            </div>
            <Link className="btn btn-dark mag" href={`/${locale}/request`} style={{ position: 'relative' }}>{t.ctaBtn}<Arr /></Link>
          </div>
        </div>
      </section>

      <RefFooter locale={locale} />
    </div>
  );
}

function Promo({ locale, t }: { locale: Locale; t: (typeof T)['ar'] }) {
  return (
    <Link className="pop" href={`/${locale}/join`} style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px', minHeight: '420px', padding: '28px', borderRadius: '28px', background: 'var(--acc)', color: '#0E0D12', textDecoration: 'none', animationDelay: '0.3s' }}>
      <svg className="spin" aria-hidden="true" style={{ position: 'absolute', left: '-70px', bottom: '-70px', opacity: '.2' }} width="260" height="260" viewBox="0 0 24 24"><path d={STAR} fill="#0E0D12"></path></svg>
      <span style={{ position: 'relative', fontWeight: '700', fontSize: '14px' }}>{t.promoKicker}</span>
      <span style={{ position: 'relative' }}>
        <span className="disp" style={{ display: 'block', fontSize: '34px', fontWeight: '900', lineHeight: '1.2' }}>{t.promoTitle[0]}<br />{t.promoTitle[1]}</span>
        <span style={{ display: 'block', marginTop: '10px', fontSize: '15px', color: '#2A2733', lineHeight: '1.7' }}>{t.promoText}</span>
      </span>
      <span className="btn btn-dark" style={{ position: 'relative', alignSelf: 'flex-start' }}>{t.promoBtn}<Arr size={18} /></span>
    </Link>
  );
}
