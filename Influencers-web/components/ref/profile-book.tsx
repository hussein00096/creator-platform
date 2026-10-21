'use client';

// Booking side card of design/reference/profile.html with the site's real service-request flow
// (same logic as components/talent-ask.tsx: session check via /auth/me, guest / paused /
// pending-company / can't-order gates, POST /api/v1/service-requests, success state, team contacts).
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Arr } from '@/components/ref/parts';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { canOrder, getAccount } from '@/lib/copy-account';
import { getProfile } from '@/lib/copy-profile';
import { whatsappLink } from '@/lib/reach';
import { clearSession, readSession, type Session } from '@/lib/session';
import type { Availability, Contact, Locale } from '@/lib/types';

const T = {
  ar: {
    aria: 'الحجز',
    pkg: 'الباقة المختارة',
    pkgName: '[الباقة]',
    price: '[السعر]',
    priceNote: 'د.ع · شامل النشر',
    title: 'اسم المشروع',
    details: 'صِف المشروع',
    detailsPh: 'نوع العلامة، تاريخ النشر، ونوع المحتوى اللي تريده…',
    submit: 'متابعة الحجز',
    reply: 'يرد عادةً خلال [المدة]',
    login: 'سجّل الدخول للحجز',
    loading: 'جارٍ التحميل…',
    team: 'فريق بريق',
  },
  en: {
    aria: 'Booking',
    pkg: 'Selected package',
    pkgName: '[Package]',
    price: '[Price]',
    priceNote: 'IQD · posting included',
    title: 'Project name',
    details: 'Describe the project',
    detailsPh: 'Brand type, posting date and the content you want…',
    submit: 'Continue booking',
    reply: 'Usually replies within [time]',
    login: 'Log in to book',
    loading: 'Loading…',
    team: 'The Bareeq team',
  },
};

const row = { display: 'flex', alignItems: 'center', gap: '10px' } as const;

export function ProfileBook({ locale, talentId, talentName, availability }: { locale: Locale; talentId: number; talentName: string; availability?: Availability }) {
  const t = T[locale];
  const copy = getCopy(locale);
  const p = getProfile(locale);
  const acct = getAccount(locale);
  const here = encodeURIComponent(`/${locale}/talent/${talentId}`);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!session) return;
    api<Contact>('/api/v1/platform-contact')
      .then((result) => setContact(result.data))
      .catch(() => setContact(null));
  }, [session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await api('/api/v1/service-requests', {
        method: 'POST',
        token: session.token,
        body: {
          influencerUserId: talentId,
          title: String(form.get('title') || '').trim() || talentName,
          details: String(form.get('details') || '').trim(),
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  const verdict = (text: string) => (
    <p className="pf2-verdict" style={{ margin: '22px 0 0', padding: '16px', borderRadius: '16px', border: '1px solid #2C2936', background: '#1E1B26', color: '#B1ACBE', fontSize: '15px', lineHeight: '1.7' }}>{text}</p>
  );

  let body;
  if (session === undefined) {
    body = <p role="status" style={{ margin: '22px 0 0', color: '#8A859B', fontSize: '14px' }}>{t.loading}</p>;
  } else if (!session) {
    body = (
      <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: '0', color: '#B1ACBE', fontSize: '15px', lineHeight: '1.7' }}>{acct.guestOrder}</p>
        <Link className="btn btn-acc mag" href={`/${locale}/login?next=${here}`} style={{ marginTop: '10px', width: '100%' }}>{t.login}<Arr /></Link>
        <Link className="btn btn-ghost" href={`/${locale}/join/user?next=${here}`} style={{ width: '100%' }}>{acct.newUser}</Link>
      </div>
    );
  } else if (availability === 'paused') {
    body = verdict(copy.pausedAsk);
  } else if (session.user.role === 'client' && !canOrder(session.user)) {
    body = verdict(acct.companyPending);
  } else if (!canOrder(session.user)) {
    body = verdict(acct.noOrder);
  } else if (done) {
    body = (
      <div role="status" style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="pop" style={{ ...row, gap: '12px', fontWeight: '600', fontSize: '16px' }}>
          <span className="vf" style={{ width: '30px', height: '30px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></span>
          <span>{copy.pendingRequest}</span>
        </div>
        <Link className="btn btn-ghost" href={`/${locale}/orders`} style={{ width: '100%' }}>{p.ordersBtn}<Arr /></Link>
      </div>
    );
  } else {
    body = (
      <form onSubmit={submit}>
        {/* The reference's date + brand-type fields aren't in the service-request API; the real fields are title + details. */}
        <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label><span className="lbl">{t.title}</span><input className="inp" name="title" required dir="auto" defaultValue={talentName} /></label>
          <label><span className="lbl">{t.details}</span><textarea className="inp" name="details" required minLength={10} dir="auto" placeholder={t.detailsPh}></textarea></label>
        </div>
        {error ? <p role="alert" dir="auto" style={{ margin: '14px 0 0', color: '#FF7A6B', fontSize: '14px' }}>{error}</p> : null}
        <button type="submit" className="btn btn-acc mag" disabled={saving} style={{ marginTop: '22px', width: '100%', opacity: saving ? 0.7 : 1 }}>{saving ? copy.sending : t.submit}<Arr /></button>
      </form>
    );
  }

  const lines = contact ? [
    contact.phone ? { href: `tel:${contact.phone}`, label: copy.phone, value: contact.phone, ext: false } : null,
    contact.whatsapp ? { href: whatsappLink(contact.whatsapp), label: copy.whatsapp, value: contact.whatsapp, ext: true } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: copy.email, value: contact.email, ext: false } : null,
  ].filter((item): item is { href: string; label: string; value: string; ext: boolean } => Boolean(item)) : [];

  return (
    <aside id="book" className="side card fd" aria-label={t.aria} style={{ position: 'sticky', top: '104px', padding: '28px', borderRadius: '30px', animationDelay: '.5s', scrollMarginTop: '104px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#B1ACBE', fontSize: '14px' }}>{t.pkg}</span>
        {/* TODO: packages / prices are not in the API. */}
        <span className="tag-l" style={{ color: 'var(--acc)', borderColor: 'var(--acc)' }}>{t.pkgName}</span>
      </div>
      <div className="disp" style={{ marginTop: '14px', fontSize: '34px', fontWeight: '900' }}>{t.price}</div>
      <div style={{ color: '#8A859B', fontSize: '14px', marginTop: '2px' }}>{t.priceNote}</div>
      {body}
      <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #2C2936', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#B1ACBE' }}>
        {/* TODO: no response-time data in the API. */}
        <span style={row}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>{t.reply}</span>
        {/* The reference's escrow line ("المبلغ محفوظ لحد التسليم") has no backing payment flow; the site's real privacy note is shown instead. */}
        <span style={row}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>{p.noteTeam(copy.wordmark)}</span>
      </div>
      {lines.length ? (
        <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #2C2936', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
          <span style={{ color: '#8A859B', fontSize: '13px' }}>{t.team}</span>
          {lines.map((line) => (
            <a key={line.href} href={line.href} {...(line.ext ? { target: '_blank', rel: 'noreferrer' } : {})} style={{ ...row, justifyContent: 'space-between', textDecoration: 'none' }}>
              <span style={{ color: '#B1ACBE' }}>{line.label}</span><b dir="ltr" style={{ fontWeight: '600' }}>{line.value}</b>
            </a>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
