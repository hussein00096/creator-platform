'use client';

// 1:1 port of the chrome of design/reference/dashboard.html (sidebar, top bar). Markup, classes and
// inline style values are the reference's; session, role-based nav, sign-out and the mobile drawer
// are the site's existing DashShell logic (components/dash-shell.tsx).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { lockScroll } from '@/components/motion';
import { STAR } from '@/components/ref/parts';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { clearSession } from '@/lib/session';
import type { Locale } from '@/lib/types';

export type DashPage = 'orders' | 'account' | 'studio';
export type DashUser = { id: number; name: string; role: string };

export const T = {
  ar: {
    side: 'القائمة الجانبية',
    sections: 'أقسام اللوحة',
    home: 'الرئيسية',
    creators: 'المؤثرين',
    photos: 'الصور',
    settings: 'الإعدادات',
    admin: 'لوحة الإدارة',
    back: 'العودة للموقع',
    search: 'بحث',
    searchPh: 'بحث…',
    newCampaign: 'حملة جديدة',
    hello: 'هلا،',
    menu: 'القائمة',
    close: 'إغلاق القائمة',
    days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    months: ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'],
  },
  en: {
    side: 'Sidebar',
    sections: 'Dashboard sections',
    home: 'Home',
    creators: 'Creators',
    photos: 'Photos',
    settings: 'Settings',
    admin: 'Admin panel',
    back: 'Back to site',
    search: 'Search',
    searchPh: 'Search…',
    newCampaign: 'New campaign',
    hello: 'Hi,',
    menu: 'Menu',
    close: 'Close menu',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

/** Eastern-Arabic digits in ar (no padding), as the reference writes dates and counts. */
export function digits(value: number | string, locale: Locale) {
  const text = String(value);
  return locale === 'ar' ? text.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : text;
}

/** "22 تشرين الأول" (year added when it is not the current one). */
export function dayMonth(locale: Locale, value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const t = T[locale];
  const year = date.getFullYear() === new Date().getFullYear() ? '' : ` ${digits(date.getFullYear(), locale)}`;
  return locale === 'ar'
    ? `${digits(date.getDate(), locale)} ${t.months[date.getMonth()]}${year}`
    : `${t.months[date.getMonth()]} ${date.getDate()}${year ? `,${year}` : ''}`;
}

const ICON = {
  home: 'M3 11l9-8 9 8v10H3zM9 21v-6h6v6',
  creators: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  photos: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  admin: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  back: 'M19 12H5M11 6l-6 6 6 6',
  out: 'M15 4h4v16h-4M10 17l-5-5 5-5M5 12h11',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
};

function SbIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}></path></svg>
  );
}

/** Signed-in dashboard chrome ported from design/reference/dashboard.html. */
export function RefDashShell({
  locale,
  user,
  page,
  onLeave,
  search,
  children,
}: {
  locale: Locale;
  user: DashUser;
  page: DashPage;
  onLeave?: () => void;
  /** Top-bar search (orders page only — it filters the requests table). */
  search?: { value: string; onChange: (value: string) => void };
  children: ReactNode;
}) {
  const t = T[locale];
  const copy = getCopy(locale);
  const d = getDashboard(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const talent = user.role === 'influencer';
  const admin = user.role === 'admin';
  const plainUser = user.role === 'user';
  const roleLabel = talent ? d.roleTalent : admin ? d.roleAdmin : plainUser ? d.roleUser : d.roleClient;
  const card = talent
    ? { title: d.cardTalentTitle, body: d.cardTalentBody, href: `/${locale}/studio`, cta: d.navStudio }
    : admin
      ? { title: d.cardAdminTitle, body: d.cardAdminBody, href: `/${locale}/admin`, cta: d.adminBtn }
      : plainUser
        ? { title: d.cardUserTitle, body: d.cardUserBody, href: `/${locale}/join/influencer`, cta: d.cardUserTitle }
        : { title: d.cardClientTitle, body: d.cardClientBody, href: `/${locale}/request`, cta: d.newRequest };

  useEffect(() => {
    const now = new Date();
    setDate(locale === 'ar'
      ? `${t.days[now.getDay()]}، ${digits(now.getDate(), locale)} ${t.months[now.getMonth()]}`
      : `${t.days[now.getDay()]}, ${t.months[now.getMonth()]} ${now.getDate()}`);
  }, [locale, t]);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', key);
    return () => {
      lockScroll(false);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  function leave() {
    setOpen(false);
    if (onLeave) {
      onLeave();
      return;
    }
    clearSession();
    router.push(`/${locale}`);
  }

  const links: { href: string; label: string; icon: string; on: boolean }[] = [
    { href: `/${locale}/orders`, label: t.home, icon: ICON.home, on: page === 'orders' },
    { href: `/${locale}/directory`, label: t.creators, icon: ICON.creators, on: false },
    ...(talent ? [{ href: `/${locale}/studio`, label: t.photos, icon: ICON.photos, on: page === 'studio' }] : []),
    ...(admin ? [{ href: `/${locale}/admin`, label: t.admin, icon: ICON.admin, on: false }] : []),
    { href: `/${locale}/account`, label: t.settings, icon: ICON.settings, on: page === 'account' },
  ];
  const close = () => setOpen(false);

  return (
    <div className="rf dsr" style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh' }}>
      {/* mobile bar (site logic: the sidebar becomes a drawer under 960px) */}
      <div className="dsr-mbar">
        <Link className="logo" href={`/${locale}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
          <span className="disp" style={{ fontSize: '24px', fontWeight: '900' }}>{copy.wordmark}</span>
        </Link>
        <button type="button" className="ibtn" style={{ width: '46px', height: '46px' }} aria-label={t.menu} aria-expanded={open} aria-controls="dsr-side" onClick={() => setOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
        </button>
      </div>
      {open ? <button type="button" className="dsr-scrim" aria-label={t.close} tabIndex={-1} onClick={close} /> : null}

      {/* SIDEBAR */}
      <aside id="dsr-side" className="side dsr-side" data-open={open || undefined} aria-label={t.side} style={{ flex: '0 0 264px', width: '264px', [locale === 'ar' ? 'borderLeft' : 'borderRight']: '1px solid #1F1D27', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: '28px', background: '#121117' }}>
        <Link className="logo" href={`/${locale}`} style={{ padding: '0 8px' }} onClick={close}>
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
          <span className="disp" style={{ fontSize: '26px', fontWeight: '900' }}>{copy.wordmark}</span>
        </Link>
        <button type="button" className="ibtn dsr-x" aria-label={t.close} onClick={close}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
        </button>
        <nav aria-label={t.sections} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map((item) => (
            <Link key={item.href} className={`sb-l ${item.on ? 'on' : ''}`} href={item.href} aria-current={item.on ? 'page' : undefined} onClick={close}>
              <SbIcon d={item.icon} />
              <span style={{ flex: '1' }}>{item.label}</span>
            </Link>
          ))}
          <span className="dsr-rule" aria-hidden="true" />
          <Link className="sb-l " href={`/${locale}`} onClick={close}>
            <SbIcon d={ICON.back} />
            <span style={{ flex: '1' }}>{t.back}</span>
          </Link>
          <button type="button" className="sb-l dsr-out" onClick={leave}>
            <SbIcon d={ICON.out} />
            <span style={{ flex: '1' }}>{copy.signOut}</span>
          </button>
        </nav>
        {/* Reference "upgrade" card; there are no paid plans, so it carries the role's next step (existing DashShell card). */}
        <div style={{ marginTop: 'auto', padding: '22px', borderRadius: '24px', background: 'var(--acc)', color: '#0E0D12', position: 'relative', overflow: 'hidden' }}>
          <svg className="spin" aria-hidden="true" style={{ position: 'absolute', left: '-30px', bottom: '-30px', opacity: '.2' }} width="120" height="120" viewBox="0 0 24 24"><path d={STAR} fill="#0E0D12"></path></svg>
          <div className="disp" style={{ position: 'relative', fontSize: '19px', fontWeight: '800' }}>{card.title}</div>
          <div style={{ position: 'relative', marginTop: '6px', fontSize: '14px', color: '#2A2733' }}>{card.body}</div>
          <Link className="btn btn-dark btn-sm" href={card.href} style={{ position: 'relative', marginTop: '14px' }} onClick={close}>{card.cta}</Link>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: '999 1 560px', minWidth: '0', padding: '28px clamp(16px, 3vw, 40px) 60px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div className="fd" style={{ animationDelay: '.05s', minWidth: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#8A859B', fontSize: '14px' }}>{date || ' '} <span className="tag-l" style={{ fontSize: '12px', padding: '3px 10px' }}>{roleLabel}</span></div>
            <h1 className="disp" style={{ margin: '6px 0 0', fontSize: '36px', fontWeight: '900', overflowWrap: 'anywhere' }}>{t.hello} <span dir="auto">{user.name}</span></h1>
          </div>
          <div className="fd" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', animationDelay: '.15s' }}>
            {search ? (
              <div role="search" className="dsr-search" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', minHeight: '48px', borderRadius: '999px', background: '#17151E', border: '1px solid #2C2936', color: '#8A859B' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>
                <input aria-label={t.search} placeholder={t.searchPh} value={search.value} onChange={(event) => search.onChange(event.target.value)} style={{ width: '180px', background: 'transparent', border: '0', color: '#F5F2EA', fontFamily: 'inherit', fontSize: '15px', outline: 'none', minHeight: '44px' }} />
              </div>
            ) : null}
            {/* Reference notifications bell omitted: the backend has no notifications. */}
            {talent ? (
              <Link className="btn btn-acc mag" href={`/${locale}/talent/${user.id}`} style={{ minHeight: '48px' }}>{copy.viewProfile}</Link>
            ) : admin ? (
              <Link className="btn btn-acc mag" href={`/${locale}/admin`} style={{ minHeight: '48px' }}>{d.cardAdminTitle}</Link>
            ) : (
              <Link className="btn btn-acc mag" href={`/${locale}/request`} style={{ minHeight: '48px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>
                {t.newCampaign}</Link>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

/** Section card used by the account / studio pages (same surface as the reference "الحملات" card). */
export function DashCard({ title, deck, aside, delay = 0.3, children, label }: { title: ReactNode; deck?: ReactNode; aside?: ReactNode; delay?: number; children: ReactNode; label?: string }) {
  return (
    <section className="card fd" aria-label={label} style={{ borderRadius: '28px', padding: '24px', animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: '0' }}>
          <h2 className="disp" style={{ margin: '0', fontSize: '22px', fontWeight: '800' }}>{title}</h2>
          {deck ? <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#8A859B', lineHeight: '1.7' }}>{deck}</p> : null}
        </div>
        {aside}
      </div>
      <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>{children}</div>
    </section>
  );
}
