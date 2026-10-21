'use client';

// 1:1 port of design/reference/auth.html (split screen: form side + scrolling creator wall).
// Markup, classes and inline style values are the reference's; the forms keep the site's
// existing auth logic (login-form.tsx, user-form.tsx, client-form.tsx). The reference's Google /
// SMS buttons, "remember me" and "forgot password" have no backend and are omitted.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { Pick } from '@/components/pick';
import { Arr, STAR, Shot, num } from '@/components/ref/parts';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getAuth } from '@/lib/copy-auth';
import { getCopy } from '@/lib/copy';
import { placeLabel } from '@/lib/names';
import { toCard, type CardPerson } from '@/lib/people';
import { safeNext } from '@/lib/reach';
import { saveSession } from '@/lib/session';
import type { Account, Influencer, Locale, Place } from '@/lib/types';

export type RefAuthMode = 'login' | 'user' | 'client' | 'influencer' | 'model';

export const T = {
  ar: {
    loginH1: 'هلا بيك من جديد',
    loginLead: 'سجّل دخولك وكمّل من وين ما وكفت.',
    signupH1: 'أهلاً بيك في بريق',
    tabs: 'الدخول أو التسجيل',
    login: 'تسجيل الدخول',
    signup: 'حساب جديد',
    enter: 'دخول',
    terms: ['بالمتابعة، انت توافق على ', 'الشروط', ' و', 'سياسة الخصوصية', '.'],
    capTitle: ['نجوم المحتوى العراقي،', 'بانتظار علامتك.'],
    capNote: 'مؤثرين وموديلز من كل المحافظات.',
  },
  en: {
    loginH1: 'Good to see you again',
    loginLead: 'Sign in and pick up where you left off.',
    signupH1: 'Welcome to Bareeq',
    tabs: 'Sign in or sign up',
    login: 'Sign in',
    signup: 'New account',
    enter: 'Sign in',
    terms: ['By continuing, you agree to the ', 'Terms', ' and ', 'Privacy Policy', '.'],
    capTitle: ['Iraq’s content stars,', 'waiting for your brand.'],
    capNote: 'Creators and models from every governorate.',
  },
};

/** Removes the legacy Split markup (" / " line breaks, {accent}) from existing copy strings. */
export const plainText = (text: string) => text.replace(/\s*\/\s*/g, ' ').replace(/[{}]/g, '');

let crowd: Promise<Influencer[]> | null = null;

/** Approved creators for the visual side; fetched once per visit, empty on failure. */
function loadCrowd() {
  if (!crowd) {
    crowd = api<Influencer[]>('/api/v1/influencers?limit=12')
      .then((result) => result.data || [])
      .catch(() => {
        crowd = null;
        return [];
      });
  }
  return crowd;
}

const tileTones = [
  ['#3B2F7A', '#1F5A4E', '#7A2E3B', '#2B4C7E'],
  ['#2B4C7E', '#6B4A1F', '#5E2B66', '#24525E'],
  ['#5E2B66', '#24525E', '#7A4A2E', '#3B2F7A'],
];
const colHeights = ['260px', '300px', '240px'];

/** The reference VISUAL side: three tilted columns of `.ph` cards (real creators) + the caption box. */
function Wall({ locale, caption }: { locale: Locale; caption?: ReactNode }) {
  const t = T[locale];
  const [people, setPeople] = useState<CardPerson[]>([]);
  useEffect(() => {
    let live = true;
    loadCrowd().then((list) => {
      if (live) setPeople(list.map((item) => toCard(locale, item)));
    });
    return () => {
      live = false;
    };
  }, [locale]);

  // Each column: four cards, rendered twice so translateY(-50%) loops seamlessly (as in the reference).
  const columns = [0, 1, 2].map((col) => {
    const four = [0, 1, 2, 3].map((row) => {
      const person = people.length ? people[(col * 4 + row) % people.length] : null;
      return { tone: person?.tone || tileTones[col][row], person };
    });
    return [...four, ...four];
  });

  return (
    <div className="hide-m" aria-hidden="true" style={{ position: 'relative', margin: '16px', borderRadius: '40px', overflow: 'hidden', background: 'var(--acc)' }}>
      <div style={{ position: 'absolute', inset: '-40px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', transform: 'rotate(-8deg) scale(1.15)', padding: '0 16px' }}>
        {columns.map((items, col) => (
          <div key={col} style={{ overflow: 'hidden' }}>
            <div className={`mqv${col === 1 ? ' mqv-r' : ''}`} style={col === 2 ? { animationDuration: '26s' } : undefined}>
              {items.map((item, index) => (
                <div key={index} className="ph" style={{ height: colHeights[col], borderRadius: '24px', background: item.tone, flex: 'none' }}>
                  <Shot src={item.person?.shot || null} />
                  {item.person?.category ? <span className="tag" style={{ position: 'absolute', bottom: '12px', right: '12px' }}>{item.person.category}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', right: '32px', left: '32px', bottom: '32px', padding: '28px', borderRadius: '28px', background: 'rgba(14,13,18,.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', color: '#F5F2EA' }}>
        {caption ?? (
          <>
            <div className="disp" style={{ fontSize: '30px', fontWeight: '900', lineHeight: '1.3' }}>{t.capTitle[0]}<br />{t.capTitle[1]}</div>
            <div style={{ marginTop: '10px', color: '#B1ACBE', fontSize: '15px' }}>{t.capNote}</div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Reference split screen. Tabs (login / new account) link to the routes; on sign-up the
 * site's account-type cards (normal / company / creator) follow the tabs. `plain` hides both
 * (signed-in upgrade and the pending/done states).
 */
export function RefAuth({
  locale,
  mode,
  title,
  lead,
  plain = false,
  caption,
  children,
}: {
  locale: Locale;
  mode: RefAuthMode;
  title?: string;
  lead?: string;
  plain?: boolean;
  caption?: ReactNode;
  children: ReactNode;
}) {
  const t = T[locale];
  const auth = getAuth(locale);
  const copy = getCopy(locale);
  const login = mode === 'login';
  const roles: { id: 'user' | 'client' | 'influencer'; href: string; icon: IconName }[] = [
    { id: 'user', href: `/${locale}/join/user`, icon: 'user' },
    { id: 'client', href: `/${locale}/join/client`, icon: 'briefcase' },
    { id: 'influencer', href: `/${locale}/join/influencer`, icon: 'megaphone' },
  ];

  return (
    <div className="rf">
      <div className="split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', minHeight: '1100px' }}>

        {/* FORM */}
        <div className="ra-form" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column' }}>
          <Link className="logo" href={`/${locale}`} style={{ alignSelf: 'flex-start', marginInlineStart: 'max(0px, calc((100% - 480px) / 2))' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
            <span className="disp" style={{ fontSize: '28px', fontWeight: '900' }}>{copy.wordmark}</span>
          </Link>
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
              <h1 className="disp" style={{ margin: '0', fontSize: 'clamp(38px, 4vw, 56px)', fontWeight: '900', lineHeight: '1.15' }}>
                <span className="ln"><span className="w" style={{ animationDelay: '.1s' }}>{title ?? (login ? t.loginH1 : t.signupH1)}</span></span>
              </h1>
              <p className="lead fd" style={{ marginTop: '10px', fontSize: '17px', animationDelay: '.25s' }}>{lead ?? (login ? t.loginLead : auth.signupDeck)}</p>

              {plain ? null : (
                <div className="seg-w fd" role="tablist" aria-label={t.tabs} style={{ marginTop: '28px', width: '100%', animationDelay: '.35s' }}>
                  <Link role="tab" aria-selected={login} className={`seg ${login ? 'on' : ''}`} href={`/${locale}/login`} style={{ flex: '1' }}>{t.login}</Link>
                  <Link role="tab" aria-selected={!login} className={`seg ${login ? '' : 'on'}`} href={`/${locale}/join/user`} style={{ flex: '1' }}>{t.signup}</Link>
                </div>
              )}

              {login || plain ? null : (
                <nav className="fd" aria-label={auth.roleLegend} style={{ marginTop: '24px', animationDelay: '.4s' }}>
                  <span className="lbl">{auth.roleLegend}</span>
                  <div className="ra-roles">
                    {roles.map((role) => {
                      const on = role.id === mode || (role.id === 'influencer' && mode === 'model');
                      return (
                        <Link key={role.id} href={role.href} className={`opt ra-role ${on ? 'on' : ''}`} aria-current={on ? 'page' : undefined}>
                          <span className="ra-ri"><Icon name={role.icon} size={20} /></span>
                          <b>{auth.roles[role.id].title}</b>
                          <small>{auth.roles[role.id].deck}</small>
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              )}

              {children}
            </div>
          </div>
        </div>

        {/* VISUAL */}
        <Wall locale={locale} caption={caption} />
      </div>
    </div>
  );
}

/** The reference `<form>` wrapper (fade-in, 16px column). */
export function RefForm({ onSubmit, children, noValidate }: { onSubmit: (event: FormEvent) => void; children: ReactNode; noValidate?: boolean }) {
  return (
    <form className="fd" onSubmit={onSubmit} noValidate={noValidate} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', animationDelay: '.45s' }}>
      {children}
    </form>
  );
}

/** Reference field: `<label><span class="lbl">…</span><input class="inp"></label>`. LTR values keep the reference alignment. */
export function In({ label, ltr, locale, extra, style, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; ltr?: boolean; locale: Locale; extra?: ReactNode }) {
  const align: CSSProperties = ltr ? { direction: 'ltr', textAlign: locale === 'ar' ? 'right' : 'left' } : {};
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span className="lbl">{label}</span>
      <input className="inp" style={{ ...align, ...style }} {...props} />
      {extra}
    </label>
  );
}

/** Reference segmented control (`.seg-w` / `.seg.on`), full width. */
export function RefSeg<V extends string>({ value, onChange, options, label }: { value: V | ''; onChange: (value: V) => void; options: { value: V; label: string }[]; label?: string }) {
  return (
    <div className="seg-w" role="radiogroup" aria-label={label} style={{ width: '100%' }}>
      {options.map((item) => (
        <button key={item.value} type="button" role="radio" aria-checked={item.value === value} className={`seg ${item.value === value ? 'on' : ''}`} style={{ flex: '1' }} onClick={() => onChange(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Numbered group of fields (sign-up forms). */
export function RefSec({ n, locale, title, deck, children }: { n: number; locale: Locale; title: string; deck?: string; children: ReactNode }) {
  return (
    <section className="ra-sec">
      <header className="ra-sec-h">
        <span className="disp" aria-hidden="true" style={{ color: 'var(--acc)', fontSize: '22px', fontWeight: '900' }}>{num(n, locale)}</span>
        <div style={{ minWidth: 0 }}>
          <h2>{title}</h2>
          {deck ? <p>{deck}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Strength({ password }: { password: string }) {
  const n = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length ? 1 : 0;
  return <span className="ra-str" data-n={n} aria-hidden="true"><s /><s /><s /></span>;
}

export function Err({ children }: { children: ReactNode }) {
  return children ? <p className="ra-err" role="alert" dir="auto">{children}</p> : null;
}

/** Primary submit, reference `.btn.btn-acc` 56px full width with the arrow. */
export function Submit({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button className="btn btn-acc mag" type="submit" disabled={disabled} style={{ width: '100%', minHeight: '56px', marginTop: '4px' }}>
      {children}<Arr />
    </button>
  );
}

export function Terms({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <p className="ra-terms" style={{ margin: '6px 0 0', color: '#8A859B', fontSize: '13px', textAlign: 'center', lineHeight: '1.7' }}>
      {t.terms[0]}<Link href={`/${locale}/about`}>{t.terms[1]}</Link>{t.terms[2]}<Link href={`/${locale}/about`}>{t.terms[3]}</Link>{t.terms[4]}
    </p>
  );
}

/* ------------------------------------------------------------------ login */

export function RefLogin({ locale, next = '' }: { locale: Locale; next?: string }) {
  const copy = getCopy(locale);
  const auth = getAuth(locale);
  const t = T[locale];
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await api<{ token: string; user: Account }>('/api/v1/auth/login', {
        method: 'POST',
        body: { phone, password },
      });
      saveSession(result.data.token, result.data.user);
      const target = safeNext(next, locale);
      const role = result.data.user.role;
      if (target) router.push(target);
      else if (role === 'admin') router.push(`/${locale}/admin`);
      else if (role === 'influencer') router.push(`/${locale}/studio`);
      else router.push(`/${locale}/account`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RefAuth locale={locale} mode="login">
      <RefForm onSubmit={submit}>
        <In
          locale={locale}
          ltr
          label={auth.loginId}
          name="username"
          placeholder="name@example.com"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="ra-login-hint"
          extra={<p className="ra-hint" id="ra-login-hint">{auth.phoneHint}</p>}
        />
        <In locale={locale} ltr label={copy.password} type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        <Err>{error}</Err>
        <Submit disabled={saving}>{saving ? copy.sending : t.enter}</Submit>
        <Terms locale={locale} />
      </RefForm>
    </RefAuth>
  );
}

/* ------------------------------------------------------------ normal sign-up */

/** Normal account sign-up: name, phone and/or e-mail, password. Signs in and redirects on success. */
export function RefUserJoin({ locale, next = '' }: { locale: Locale; next?: string }) {
  const copy = getCopy(locale);
  const a = getAccount(locale);
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function check() {
    if (name.trim().length < 2) return a.needName;
    const tel = phone.replace(/[\s\-()]/g, '');
    const mail = email.trim();
    if (!tel && !mail) return a.needId;
    if (tel && !/^\+?\d{7,15}$/.test(tel)) return a.badPhone;
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return a.badEmail;
    if (password.length < 8) return a.needPassword;
    return '';
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = check();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const result = await api<{ token: string; user: Account }>('/api/v1/auth/register/user', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          password,
        },
      });
      saveSession(result.data.token, result.data.user);
      router.push(safeNext(next, locale) || `/${locale}/account`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
      setSaving(false);
    }
  }

  return (
    <RefAuth locale={locale} mode="user">
      <RefForm onSubmit={submit} noValidate>
        <RefSec n={1} locale={locale} title={a.userTitle} deck={a.userDeck}>
          <In locale={locale} label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
        </RefSec>
        <RefSec n={2} locale={locale} title={a.idTitle} deck={a.idDeck}>
          <div className="ra-two">
            <In locale={locale} ltr label={copy.phone} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" />
            <In locale={locale} ltr label={copy.email} type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoCapitalize="none" />
          </div>
          <In
            locale={locale}
            ltr
            label={copy.password}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="ra-pass-hint"
            extra={<><Strength password={password} /><p className="ra-hint" id="ra-pass-hint">{copy.joinPasswordHint}</p></>}
          />
          <p className="ra-hint" style={{ margin: 0 }}>{a.privacy}</p>
        </RefSec>
        <Err>{error}</Err>
        <Submit disabled={saving}>{saving ? copy.sending : a.create}</Submit>
        <Terms locale={locale} />
      </RefForm>
    </RefAuth>
  );
}

/* ----------------------------------------------------------- company sign-up */

export function RefClientJoin({ locale, governorates, countries }: { locale: Locale; governorates: Place[]; countries: Place[] }) {
  const copy = getCopy(locale);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState<'inside_iraq' | 'outside_iraq'>('inside_iraq');
  const [govId, setGovId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [brand, setBrand] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (scope === 'inside_iraq' && !govId) {
      setError(copy.governorate);
      return;
    }
    if (scope === 'outside_iraq' && !countryId) {
      setError(copy.country);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api('/api/v1/auth/register/client', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone,
          password,
          brandName: brand.trim(),
          whatsapp,
          contactEmail: email,
          locationScope: scope,
          governorateId: scope === 'inside_iraq' ? govId : null,
          countryId: scope === 'outside_iraq' ? countryId : null,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <RefAuth locale={locale} mode="client" plain title={copy.pendingAccount} lead={copy.joinAsClientDeck}>
        <div className="fd" style={{ marginTop: '28px', animationDelay: '.35s' }}>
          <Link className="btn btn-acc mag" href={`/${locale}`} style={{ width: '100%', minHeight: '56px' }}>{copy.back}<Arr /></Link>
        </div>
      </RefAuth>
    );
  }

  return (
    <RefAuth locale={locale} mode="client">
      <RefForm onSubmit={submit}>
        <RefSec n={1} locale={locale} title={copy.joinYouTitle} deck={copy.joinPhoneHint}>
          <In locale={locale} label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
          <div className="ra-two">
            <In locale={locale} ltr label={copy.phone} value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" autoComplete="tel" />
            <In locale={locale} ltr label={copy.password} type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <In locale={locale} label={copy.brand} value={brand} onChange={(event) => setBrand(event.target.value)} dir="auto" />
        </RefSec>
        <RefSec n={2} locale={locale} title={copy.sectionReach} deck={copy.secondContact}>
          <div className="ra-two">
            <In locale={locale} ltr label={copy.whatsapp} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} inputMode="tel" />
            <In locale={locale} ltr label={copy.email} type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </div>
        </RefSec>
        <RefSec n={3} locale={locale} title={copy.joinPlaceTitle}>
          <RefPlace locale={locale} scope={scope} setScope={setScope} governorates={governorates} countries={countries} govId={govId} setGovId={setGovId} countryId={countryId} setCountryId={setCountryId} />
        </RefSec>
        <Err>{error}</Err>
        <Submit disabled={saving}>{saving ? copy.sending : copy.joinSend}</Submit>
        <Terms locale={locale} />
      </RefForm>
    </RefAuth>
  );
}

/** Inside / outside Iraq + governorate or country picker (shared by company and creator sign-up). */
export function RefPlace({
  locale,
  scope,
  setScope,
  governorates,
  countries,
  govId,
  setGovId,
  countryId,
  setCountryId,
}: {
  locale: Locale;
  scope: 'inside_iraq' | 'outside_iraq';
  setScope: (value: 'inside_iraq' | 'outside_iraq') => void;
  governorates: Place[];
  countries: Place[];
  govId: string;
  setGovId: (value: string) => void;
  countryId: string;
  setCountryId: (value: string) => void;
}) {
  const copy = getCopy(locale);
  return (
    <>
      <RefSeg value={scope} onChange={setScope} label={copy.joinPlaceTitle} options={[{ value: 'inside_iraq', label: copy.inside }, { value: 'outside_iraq', label: copy.outside }]} />
      {scope === 'inside_iraq' ? (
        <Pick value={govId} onChange={setGovId} placeholder={copy.governorate} required options={governorates.map((item) => ({ value: String(item.id), label: placeLabel(locale, item) }))} />
      ) : (
        <Pick value={countryId} onChange={setCountryId} placeholder={copy.country} required options={countries.filter((item) => item.code !== 'IQ').map((item) => ({ value: String(item.id), label: placeLabel(locale, item) }))} />
      )}
    </>
  );
}
