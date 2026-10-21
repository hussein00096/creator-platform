'use client';

// Gate (guest / role that can't order / pending company) and the sent screen of the booking wizard,
// built from the same reference parts as design/reference/booking.html (header, eyebrow + h2, card, buttons).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Arr, STAR } from '@/components/ref/parts';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import type { Session } from '@/lib/session';
import type { Locale } from '@/lib/types';

const T = {
  ar: { cancel: 'إلغاء', eyebrow: 'طلب تعاون', done: 'وصل طلبك!', browse: 'تصفّح المؤثرين', home: 'العودة للرئيسية' },
  en: { cancel: 'Cancel', eyebrow: 'Collaboration request', done: 'Your request is in!', browse: 'Browse creators', home: 'Back to home' },
};

/** Reference `<header class="nav">` of booking.html: logo + cancel (no site nav on this route). */
export function BookingHeader({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="logo" href={`/${locale}`}>
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
          <span className="disp" style={{ fontSize: '28px', fontWeight: '900' }}>{copy.wordmark}</span>
        </Link>
        <Link className="btn btn-ghost btn-sm" href={`/${locale}/directory`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
          {T[locale].cancel}
        </Link>
      </div>
    </header>
  );
}

function Shell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="rf">
      <BookingHeader locale={locale} />
      <section style={{ padding: '56px 0 96px' }}>
        <div className="wrap">
          <div className="card pop bk-state" style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(28px, 5vw, 56px)', borderRadius: '30px', textAlign: 'center' }}>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}

export function BookingGate({ locale, session, onLeave }: { locale: Locale; session: Session | null; onLeave: () => void }) {
  const t = T[locale];
  const copy = getCopy(locale);
  const acct = getAccount(locale);
  const company = session?.user.role === 'client';
  const title = !session ? copy.requestTitle : company ? copy.pendingAccount : acct.noOrderTitle;
  const deck = !session ? acct.guestOrder : company ? acct.companyPending : acct.noOrder;
  const next = encodeURIComponent(`/${locale}/request`);
  return (
    <Shell locale={locale}>
      <span className="eyebrow">{t.eyebrow}</span>
      <h1 className="disp h2" style={{ fontSize: 'clamp(30px, 4vw, 52px)' }}>{title}</h1>
      <p className="lead" style={{ marginTop: '16px' }}>{deck}</p>
      <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
        {!session ? <Link className="btn btn-acc mag" href={`/${locale}/login?next=${next}`}>{copy.enter}<Arr /></Link> : null}
        {!session ? <Link className="btn btn-ghost" href={`/${locale}/join/user?next=${next}`}>{acct.newUser}</Link> : null}
        {session && !company ? <button type="button" className="btn btn-acc mag" onClick={onLeave}>{copy.leave}</button> : null}
        {session ? <Link className="btn btn-ghost" href={`/${locale}`}>{t.home}</Link> : null}
      </div>
    </Shell>
  );
}

export function BookingSent({ locale }: { locale: Locale }) {
  const t = T[locale];
  const copy = getCopy(locale);
  return (
    <Shell locale={locale}>
      <span style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--acc)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg className="spin" width="40" height="40" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="#0E0D12"></path></svg>
      </span>
      <h1 className="disp h2" style={{ fontSize: 'clamp(38px, 5vw, 72px)' }}>{t.done}</h1>
      <p className="lead fd" style={{ marginTop: '16px', animationDelay: '.3s' }}>{copy.pendingRequest} {copy.ordersDeck}</p>
      <div className="fd" style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', animationDelay: '.45s' }}>
        <Link className="btn btn-acc mag" href={`/${locale}/orders`}>{copy.orders}<Arr /></Link>
        <Link className="btn btn-ghost" href={`/${locale}/directory`}>{t.browse}</Link>
      </div>
    </Shell>
  );
}
