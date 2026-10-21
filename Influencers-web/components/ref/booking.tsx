'use client';

// 1:1 port of design/reference/booking.html (its own minimal header, step bars, option cards,
// sticky summary card). Logic is the site's existing content-request wizard (components/request-form.tsx):
// auth gating, per-step validation, influencer search, quantity, outside names and the exact
// POST /api/v1/ugc-requests payload. The reference shows only step 1; the other steps reuse its parts.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { BookingGate, BookingHeader, BookingSent } from '@/components/ref/booking-states';
import { Arr, Shot, Sil, Vf } from '@/components/ref/parts';
import { api } from '@/lib/api';
import { canOrder } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { categoryLabel, placeLabel } from '@/lib/names';
import { toneFor } from '@/lib/people';
import { clearSession, readSession, type Session } from '@/lib/session';
import type { Influencer, Locale } from '@/lib/types';

const steps = ['type', 'details', 'faces', 'review'] as const;

const TYPES = [
  { icon: 'M3 11l18-8-8 18-2-8z' },
  { icon: 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { icon: 'M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z' },
  { icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
];

const T = {
  ar: {
    eyebrow: 'طلب تعاون',
    // Step 3 of the reference is "الموعد" (dates); the API has no dates, so that slot picks the faces instead.
    steps: ['النوع', 'التفاصيل', 'الوجوه', 'المراجعة'],
    heads: ['شنو نوع التعاون؟', 'شلون نصوّرها؟', 'منو يطلع بالمحتوى؟', 'راجع طلبك'],
    types: [
      { name: 'حملة إعلانية', text: 'ريلز أو ستوري للترويج لمنتجك أو خدمتك.' },
      { name: 'حجز موديل', text: 'جلسة تصوير لمنتجاتك أو إعلان أزياء.' },
      { name: 'تجربة ومراجعة', text: 'المؤثر يجرب المنتج ويشارك رأيه بصدق.' },
      { name: 'تغطية فعالية', text: 'حضور افتتاح أو فعالية وتغطيتها مباشرة.' },
    ],
    typeLabel: 'نوع التعاون',
    typeGroup: 'اختر نوع التعاون (اختياري)',
    back: 'رجوع',
    next: 'التالي',
    summary: 'ملخص الطلب',
    platforms: 'المنصات',
    total: 'الإجمالي',
    price: '[السعر]',
    none: '—',
    platformsHint: 'اختر بسرعة، أو اكتب بنفسك.',
    more: (n: number) => `+${n}`,
  },
  en: {
    eyebrow: 'Collaboration request',
    steps: ['Type', 'Details', 'Faces', 'Review'],
    heads: ['What kind of collaboration?', 'How should it look?', 'Who appears in it?', 'Review your request'],
    types: [
      { name: 'Ad campaign', text: 'Reels or stories promoting your product or service.' },
      { name: 'Book a model', text: 'A photo shoot for your products or a fashion ad.' },
      { name: 'Try & review', text: 'The creator tries the product and shares an honest take.' },
      { name: 'Event coverage', text: 'Attending an opening or event and covering it live.' },
    ],
    typeLabel: 'Collaboration type',
    typeGroup: 'Pick a collaboration type (optional)',
    back: 'Back',
    next: 'Next',
    summary: 'Request summary',
    platforms: 'Platforms',
    total: 'Total',
    price: '[Price]',
    none: '—',
    platformsHint: 'Pick quickly, or type your own.',
    more: (n: number) => `+${n}`,
  },
};

const PLATFORMS = {
  ar: ['انستغرام', 'تيك توك', 'سناب شات', 'يوتيوب', 'فيسبوك', 'المتجر الإلكتروني'],
  en: ['Instagram', 'TikTok', 'Snapchat', 'YouTube', 'Facebook', 'Online store'],
};

const BOOK = {
  ar: {
    tooShort: (min: number) => `اكتب ${min} أحرف على الأقل.`,
    untitled: 'مشروع بلا اسم بعد',
    facesNone: 'نترك لكم الاختيار',
    edit: 'تعديل',
    note: 'كل طلب يمرّ على فريقنا للمراجعة قبل التواصل مع أي وجه. الأرقام الشخصية تبقى محمية، وما نحدّد سعر أو موعد قبل ما نحچي وياك.',
    missing: 'أكمل الحقول المطلوبة بالخطوات السابقة.',
  },
  en: {
    tooShort: (min: number) => `Write at least ${min} characters.`,
    untitled: 'Untitled project',
    facesNone: 'Casting left to us',
    edit: 'Edit',
    note: 'Every request is reviewed by our team before any face is contacted. Private numbers stay protected, and no rate or date is set before we talk.',
    missing: 'Complete the required fields in the earlier steps.',
  },
};

const ICON = {
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  check: 'M20 6L9 17l-5-5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
};

function Ico({ d, size = 18, sw = '2.2' }: { d: string; size?: number; sw?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}></path></svg>;
}

/** Summary row exactly as the reference aside rows. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '14px 0', borderTop: '1px solid #2C2936', fontSize: '15px' }}>
      <span style={{ color: '#B1ACBE', flex: 'none' }}>{label}</span>
      <span className="bk-val" style={{ fontWeight: '600' }}>{children}</span>
    </div>
  );
}

export function RefBooking({ locale }: { locale: Locale }) {
  const t = T[locale];
  const book = BOOK[locale];
  const copy = getCopy(locale);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [at, setAt] = useState(0);
  const [tried, setTried] = useState(false);
  const [kind, setKind] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [product, setProduct] = useState('');
  const [execution, setExecution] = useState('');
  const [usage, setUsage] = useState('');
  const [quantity, setQuantity] = useState(6);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Influencer[]>([]);
  const [picked, setPicked] = useState<Influencer[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestNote, setGuestNote] = useState('');
  const [externals, setExternals] = useState<{ name: string; note: string }[]>([]);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      setSession(null);
      return;
    }
    api<{ id: number; name: string; role: string; status: string; phone?: string | null }>('/api/v1/auth/me', { token: saved.token })
      .then((result) => setSession({ token: saved.token, user: result.data }))
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams({ limit: '8' });
      if (query.trim()) params.set('search', query.trim());
      api<Influencer[]>(`/api/v1/influencers?${params}`)
        .then((result) => setFound(result.data))
        .catch(() => setFound([]));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (done) window.scrollTo(0, 0);
  }, [done]);

  const okTitle = title.trim().length >= 3;
  const okProduct = product.trim().length >= 10;
  const okExecution = execution.trim().length >= 10;
  const okUsage = usage.trim().length >= 3;
  const ready = okTitle && okProduct && okExecution && okUsage;
  const step = steps[at];
  const sep = locale === 'ar' ? '، ' : ', ';
  const tokens = usage.split(/[،,]/).map((item) => item.trim()).filter(Boolean);
  const kindName = kind === null ? '' : t.types[kind].name;

  function toggleTalent(person: Influencer) {
    setPicked((current) => (
      current.some((item) => item.id === person.id)
        ? current.filter((item) => item.id !== person.id)
        : [...current, person]
    ));
  }

  function togglePlatform(label: string) {
    const next = tokens.includes(label) ? tokens.filter((item) => item !== label) : [...tokens, label];
    setUsage(next.join(sep));
  }

  function addGuest() {
    const name = guestName.trim();
    if (name.length < 2) return;
    setExternals((current) => [...current, { name, note: guestNote.trim() }]);
    setGuestName('');
    setGuestNote('');
  }

  function go(index: number) {
    setTried(false);
    setAt(index);
    top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /** Same rules as `ready`, checked one step at a time. */
  function next() {
    if (form.current && !form.current.reportValidity()) return;
    const ok = step === 'type' ? okTitle && okProduct : step === 'details' ? okExecution && okUsage : true;
    if (!ok) {
      setTried(true);
      window.setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    go(Math.min(steps.length - 1, at + 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session || !ready) return;
    setError('');
    setSaving(true);
    try {
      await api('/api/v1/ugc-requests', {
        method: 'POST',
        token: session.token,
        body: {
          title: title.trim(),
          productDescription: product.trim(),
          // The API has no "collaboration type" field: the chosen type travels as the first line of the brief.
          executionDetails: kindName ? `${t.typeLabel}: ${kindName}\n${execution.trim()}` : execution.trim(),
          usagePlace: usage.trim(),
          quantity,
          influencerIds: picked.map((item) => item.id),
          externalNames: externals.filter((item) => item.name.trim()),
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent) {
    if (step !== 'review') {
      event.preventDefault();
      next();
      return;
    }
    void submit(event);
  }

  if (session === undefined) {
    return (
      <div className="rf">
        <BookingHeader locale={locale} />
        <section style={{ padding: '56px 0 96px' }}><div className="wrap"><p className="lead">{copy.loading}</p></div></section>
      </div>
    );
  }

  if (done) return <BookingSent locale={locale} />;

  if (!session || !canOrder(session.user)) {
    return <BookingGate locale={locale} session={session} onLeave={() => { clearSession(); setSession(null); }} />;
  }

  const bad = (ok: boolean) => (tried && !ok) || undefined;
  const lead = picked[0];
  const leadPlace = lead ? (lead.profile?.locationScope === 'inside_iraq' ? placeLabel(locale, lead.profile?.governorate) : placeLabel(locale, lead.profile?.country)) : '';
  const leadCat = lead?.profile?.categories?.[0] ? categoryLabel(locale, lead.profile.categories[0]) : '';
  const leadShot = lead ? lead.profile?.avatar || lead.profile?.portfolio?.[0]?.filePath || null : null;

  return (
    <div className="rf">
      <BookingHeader locale={locale} />

      <section style={{ padding: '56px 0 96px' }}>
        <div className="wrap" ref={top} style={{ scrollMarginTop: '100px' }}>
          <div>
            <div className="fd" style={{ animationDelay: '.05s' }}>
              <span className="eyebrow">{t.eyebrow}</span>
              <h1 className="disp h2" style={{ fontSize: 'clamp(38px, 5vw, 72px)' }}>{t.heads[at]}</h1>
            </div>

            {/* progress */}
            <div className="fd" style={{ marginTop: '36px', animationDelay: '.15s' }}>
              <div style={{ display: 'flex', gap: '8px' }} role="list" aria-label={t.eyebrow}>
                {t.steps.map((label, index) => (
                  <div key={label} style={{ flex: '1' }} role="listitem" aria-current={index === at ? 'step' : undefined}>
                    <div style={{ height: '6px', borderRadius: '6px', background: '#2C2936', overflow: 'hidden' }}><div style={{ height: '100%', background: 'var(--acc)', borderRadius: '6px', transformOrigin: 'right', transform: `scaleX(${index <= at ? 1 : 0})`, transition: 'transform .7s cubic-bezier(.7,0,.2,1)' }}></div></div>
                    <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: '600', color: index <= at ? '#F5F2EA' : '#8A859B' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="split" style={{ marginTop: '44px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '40px', alignItems: 'start' }}>
              <form id="ugc-form" ref={form} onSubmit={onSubmit}>

                {step === 'type' ? (
                  <div key="type">
                    <div className="g2" role="group" aria-label={t.typeGroup} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                      {TYPES.map((item, index) => {
                        const on = kind === index;
                        return (
                          <button key={item.icon} type="button" className={`opt pop ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setKind(on ? null : index)} style={{ animationDelay: `${(index * 0.07).toFixed(2)}s`, minHeight: '190px', justifyContent: 'space-between' }}>
                            <span style={{ width: '56px', height: '56px', borderRadius: '18px', background: on ? 'var(--acc)' : '#24212D', color: on ? '#0E0D12' : 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon}></path></svg>
                            </span>
                            <span>
                              <span className="disp" style={{ display: 'block', fontSize: '21px', fontWeight: '800' }}>{t.types[index].name}</span>
                              <span style={{ display: 'block', marginTop: '6px', color: '#B1ACBE', fontSize: '15px', lineHeight: '1.7' }}>{t.types[index].text}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="bk-fields fd" style={{ animationDelay: '.3s' }}>
                      <Field label={copy.workTitle} invalid={bad(okTitle)} hint={book.tooShort(3)}>
                        <input className="inp" value={title} onChange={(event) => setTitle(event.target.value)} dir="auto" required minLength={3} aria-invalid={bad(okTitle)} />
                      </Field>
                      <Area label={copy.product} value={product} onChange={setProduct} min={10} invalid={bad(okProduct)} hint={book.tooShort(10)} />
                    </div>
                  </div>
                ) : null}

                {step === 'details' ? (
                  <div key="details" className="bk-fields fd" style={{ marginTop: 0 }}>
                    <Area label={copy.execution} value={execution} onChange={setExecution} min={10} invalid={bad(okExecution)} hint={book.tooShort(10)} />
                    <div>
                      <span className="lbl">{copy.usage}</span>
                      <div role="group" aria-label={copy.usage} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        {PLATFORMS[locale].map((item) => {
                          const on = tokens.includes(item);
                          return <button key={item} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => togglePlatform(item)}>{item}</button>;
                        })}
                      </div>
                      <Field label={t.platformsHint} invalid={bad(okUsage)} hint={book.tooShort(3)} small>
                        <input className="inp" value={usage} onChange={(event) => setUsage(event.target.value)} dir="auto" required minLength={3} aria-invalid={bad(okUsage)} />
                      </Field>
                    </div>
                  </div>
                ) : null}

                {step === 'faces' ? (
                  <div key="faces" className="bk-fields fd" style={{ marginTop: 0 }}>
                    <div>
                      <span className="lbl">{copy.quantity}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <button type="button" className="ibtn" aria-label={copy.requestLess} disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Ico d={ICON.minus} /></button>
                        <b className="disp" dir="ltr" aria-live="polite" style={{ minWidth: '56px', textAlign: 'center', fontSize: '34px', fontWeight: '900' }}>{quantity}</b>
                        <button type="button" className="ibtn" aria-label={copy.requestMore} disabled={quantity >= 200} onClick={() => setQuantity(Math.min(200, quantity + 1))}><Ico d={ICON.plus} /></button>
                      </div>
                    </div>

                    <div>
                      <span className="lbl">{copy.pickTalent}</span>
                      <p className="bk-hint">{copy.requestCastHint}</p>
                      <label className="bk-search">
                        <Ico d={ICON.search} />
                        <input
                          className="inp"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}
                          dir="auto"
                          placeholder={copy.searchPlaceholder}
                          aria-label={copy.pickTalent}
                        />
                      </label>
                      <div className="g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginTop: '14px' }}>
                        {found.map((person, index) => {
                          const on = picked.some((item) => item.id === person.id);
                          const category = person.profile?.categories?.[0];
                          const shot = person.profile?.avatar || person.profile?.portfolio?.[0]?.filePath || null;
                          return (
                            <button type="button" key={person.id} className={`opt pop bk-pick ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleTalent(person)} style={{ animationDelay: `${(index * 0.05).toFixed(2)}s` }}>
                              <span className="ph" style={{ width: '52px', height: '52px', borderRadius: '16px', background: toneFor(person.id), flex: 'none' }}><Shot src={shot} /></span>
                              <span style={{ minWidth: 0, flex: '1' }}>
                                <span style={{ display: 'block', fontWeight: '700', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="auto">{person.name}</span>
                                {category ? <span style={{ display: 'block', color: '#B1ACBE', fontSize: '14px', marginTop: '2px' }}>{categoryLabel(locale, category)}</span> : null}
                              </span>
                              <span className="bk-tick" aria-hidden="true"><Ico d={ICON.check} size={14} sw="3" /></span>
                            </button>
                          );
                        })}
                      </div>
                      {!found.length ? <p className="bk-hint" style={{ marginTop: '14px' }}>{copy.requestEmptyCast}</p> : null}
                    </div>

                    <div>
                      <span className="lbl">{copy.external}</span>
                      <p className="bk-hint">{copy.requestGuestHint}</p>
                      <div className="bk-guest">
                        <input className="inp" value={guestName} onChange={(event) => setGuestName(event.target.value)} dir="auto" placeholder={copy.name} aria-label={copy.name} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addGuest(); } }} />
                        <input className="inp" value={guestNote} onChange={(event) => setGuestNote(event.target.value)} dir="auto" placeholder={copy.externalNote} aria-label={copy.externalNote} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addGuest(); } }} />
                        <button type="button" className="btn btn-ghost" onClick={addGuest} disabled={guestName.trim().length < 2}><Ico d={ICON.plus} />{copy.addName}</button>
                      </div>
                      {externals.length ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                          {externals.map((item, index) => (
                            <span key={`${item.name}-${index}`} className="chip" style={{ cursor: 'default', paddingInlineEnd: '8px' }}>
                              <b dir="auto">{item.name}</b>
                              {item.note ? <small dir="auto" style={{ color: '#B1ACBE' }}>{item.note}</small> : null}
                              <button type="button" className="bk-x" aria-label={`${copy.remove} ${item.name}`} onClick={() => setExternals((current) => current.filter((_, row) => row !== index))}><Ico d={ICON.x} size={14} /></button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {step === 'review' ? (
                  <div key="review" className="card fd" style={{ padding: '10px 26px', borderRadius: '30px' }}>
                    <Review label={t.typeLabel} edit={book.edit} onEdit={() => go(0)}>{kindName || t.none}</Review>
                    <Review label={copy.workTitle} edit={book.edit} onEdit={() => go(0)}><span dir="auto">{title.trim()}</span></Review>
                    <Review label={copy.product} edit={book.edit} onEdit={() => go(0)}><span dir="auto">{product.trim()}</span></Review>
                    <Review label={copy.execution} edit={book.edit} onEdit={() => go(1)}><span dir="auto">{execution.trim()}</span></Review>
                    <Review label={copy.usage} edit={book.edit} onEdit={() => go(1)}><span dir="auto">{usage.trim()}</span></Review>
                    <Review label={copy.quantity} edit={book.edit} onEdit={() => go(2)}><span dir="ltr">{quantity}</span></Review>
                    <Review label={copy.requestPicked} edit={book.edit} onEdit={() => go(2)}>{picked.length ? picked.map((item) => item.name).join(sep) : book.facesNone}</Review>
                    {externals.length ? (
                      <Review label={copy.external} edit={book.edit} onEdit={() => go(2)}><span dir="auto">{externals.map((item) => item.name).join(sep)}</span></Review>
                    ) : null}
                    {!ready ? <p className="bk-err" style={{ marginBottom: '16px' }}>{book.missing}</p> : null}
                  </div>
                ) : null}

                {error ? <p className="bk-err" role="alert" dir="auto" style={{ marginTop: '20px' }}>{error}</p> : null}

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <button type="button" className="btn btn-ghost" style={{ visibility: at > 0 ? 'visible' : 'hidden' }} onClick={() => go(Math.max(0, at - 1))} tabIndex={at > 0 ? undefined : -1} aria-hidden={at > 0 ? undefined : true}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>
                    {t.back}
                  </button>
                  {step !== 'review' ? (
                    <button key="next" type="button" className="btn btn-acc mag" onClick={next}>{t.next}<Arr /></button>
                  ) : (
                    <button key="send" type="submit" className="btn btn-acc mag" disabled={!ready || saving}>{saving ? copy.sending : copy.requestSend}<Arr /></button>
                  )}
                </div>
              </form>

              {/* summary */}
              <aside className="side card" aria-label={t.summary} style={{ position: 'sticky', top: '104px', padding: '26px', borderRadius: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="ph" style={{ width: '64px', height: '64px', borderRadius: '20px', background: lead ? toneFor(lead.id) : '#3B2F7A', flex: 'none' }}>
                    {lead ? <Shot src={leadShot} /> : <Sil />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {lead ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '18px' }}><span dir="auto">{lead.name}</span><Vf />{picked.length > 1 ? <span style={{ color: '#B1ACBE', fontSize: '14px', fontWeight: '600' }} dir="ltr">{t.more(picked.length - 1)}</span> : null}</div>
                        <div style={{ color: '#B1ACBE', fontSize: '14px', marginTop: '2px' }}>{[leadCat, leadPlace].filter(Boolean).join(' · ')}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: '700', fontSize: '18px', overflowWrap: 'anywhere' }} dir="auto">{title.trim() || book.untitled}</div>
                        <div style={{ color: '#B1ACBE', fontSize: '14px', marginTop: '2px' }}>{book.facesNone}</div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
                  <Row label={t.typeLabel}>{kindName || t.none}</Row>
                  <Row label={t.platforms}><span dir="auto">{usage.trim() || t.none}</span></Row>
                  {/* The reference's "التسليم" (delivery time) has no API field; the real quantity sits here. */}
                  <Row label={copy.quantity}><span dir="ltr">{quantity}</span></Row>
                  {/* TODO: no pricing in the API yet — the reference itself shows the bracketed placeholder. */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '16px 0 0', borderTop: '1px solid #2C2936' }}><span style={{ color: '#B1ACBE' }}>{t.total}</span><span className="disp" style={{ fontSize: '26px', fontWeight: '900' }}>{t.price}</span></div>
                </div>
                <div style={{ marginTop: '18px', padding: '14px 16px', borderRadius: '16px', background: '#1E1B26', display: 'flex', gap: '10px', fontSize: '14px', color: '#B1ACBE', lineHeight: '1.7' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: '3px' }}><path d={ICON.shield}></path></svg>
                  {book.note}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, invalid, hint, small, children }: { label: string; invalid?: boolean; hint: string; small?: boolean; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span className={small ? 'bk-hint' : 'lbl'} style={small ? { display: 'block' } : undefined}>{label}</span>
      {children}
      {invalid ? <span className="bk-err">{hint}</span> : null}
    </label>
  );
}

function Area({ label, value, onChange, min, invalid, hint }: { label: string; value: string; onChange: (value: string) => void; min: number; invalid?: boolean; hint: string }) {
  const size = value.trim().length;
  return (
    <label style={{ display: 'block' }}>
      <span className="lbl">{label}</span>
      <textarea className="inp" value={value} onChange={(event) => onChange(event.target.value)} dir="auto" required minLength={min} rows={5} aria-invalid={invalid} />
      <span className="bk-meter">
        {invalid ? <span className="bk-err" style={{ marginTop: 0 }}>{hint}</span> : <span />}
        <em data-ok={size >= min} dir="ltr">{size}/{min}</em>
      </span>
    </label>
  );
}

function Review({ label, edit, onEdit, children }: { label: string; edit: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="bk-rev">
      <span style={{ color: '#B1ACBE', fontSize: '15px' }}>{label}</span>
      <span style={{ fontWeight: '600', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{children}</span>
      <button type="button" className="bk-edit" onClick={onEdit}>{edit}</button>
    </div>
  );
}
