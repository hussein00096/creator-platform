'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AccountMenu } from '@/components/account-menu';
import { STAR } from '@/components/ref/parts';
import { getCopy } from '@/lib/copy';
import { readSession } from '@/lib/session';
import type { Account, Locale } from '@/lib/types';

const T = {
  ar: { menu: 'القائمة الرئيسية', creators: 'المؤثرين', brands: 'للشركات', join: 'انضم كمؤثر', about: 'من نحن', login: 'تسجيل الدخول', start: 'ابدأ الآن', other: 'English', footer: 'روابط التذييل' },
  en: { menu: 'Main menu', creators: 'Creators', brands: 'For brands', join: 'Join as creator', about: 'About', login: 'Log in', start: 'Get started', other: 'العربية', footer: 'Footer links' },
};

/** Inner-page footer from the reference (single row: logo · links · ©). */
export function RefFooter({ locale }: { locale: Locale }) {
  const t = T[locale];
  const copy = getCopy(locale);
  return (
    <footer style={{ borderTop: '1px solid #1F1D27', padding: '44px 0 36px' }}>
      <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <Link className="logo" href={`/${locale}`}><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg><span className="disp" style={{ fontSize: '24px', fontWeight: '900' }}>{copy.wordmark}</span></Link>
        <nav aria-label={t.footer} style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <Link className="nl" href={`/${locale}/directory`}>{t.creators}</Link><Link className="nl" href={`/${locale}/request`}>{t.brands}</Link><Link className="nl" href={`/${locale}/join`}>{t.join}</Link><Link className="nl" href={`/${locale}/about`}>{t.about}</Link>
        </nav>
        <span style={{ color: '#8A859B', fontSize: '14px' }}>© {new Date().getFullYear()} {copy.wordmark}</span>
      </div>
    </footer>
  );
}

/** Port of the reference `<header class="nav">`. */
export function RefNav({ locale }: { locale: Locale }) {
  const t = T[locale];
  const copy = getCopy(locale);
  const pathname = usePathname() || '';
  const [user, setUser] = useState<Account | null>(null);
  useEffect(() => setUser(readSession()?.user || null), [pathname]);
  const rest = pathname.replace(/^\/(ar|en)/, '');
  const cur = (match: boolean) => `nl${match ? ' cur' : ''}`;
  const other = locale === 'ar' ? 'en' : 'ar';

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="logo" href={`/${locale}`}>
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
          <span className="disp" style={{ fontSize: '28px', fontWeight: '900' }}>{copy.wordmark}</span>
        </Link>
        <nav className="navl" aria-label={t.menu} style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link className={cur(rest.startsWith('/directory') || rest.startsWith('/talent'))} href={`/${locale}/directory`}>{t.creators}</Link>
          <Link className={cur(rest.startsWith('/request'))} href={`/${locale}/request`}>{t.brands}</Link>
          <Link className={cur(rest === '/join')} href={`/${locale}/join`}>{t.join}</Link>
          <Link className={cur(rest.startsWith('/about'))} href={`/${locale}/about`}>{t.about}</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language switch as in design/reference/creators.html; the account menu replaces login/start when signed in. */}
          <Link className="ibtn navl" href={pathname.replace(/^\/(ar|en)/, `/${other}`) || `/${other}`} aria-label={t.other} lang={other} style={{ width: '46px', height: '46px', fontFamily: 'inherit', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>{locale === 'ar' ? 'EN' : 'ع'}</Link>
          {user ? (
            <AccountMenu locale={locale} user={user} pathname={pathname} onLeave={() => setUser(null)} />
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm navl" href={`/${locale}/login`}>{t.login}</Link>
              <Link className="btn btn-acc btn-sm mag" href={`/${locale}/join`}>{t.start}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
