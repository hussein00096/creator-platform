'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { AccountMenu } from '@/components/account-menu';
import { ArrowIcon, Icon, Logo } from '@/components/icons';
import { MotionEngine, lockScroll, setStill } from '@/components/motion';
import { getCopy } from '@/lib/copy';
import { getAccount } from '@/lib/copy-account';
import { getBq } from '@/lib/copy-bq';
import { readSession } from '@/lib/session';
import type { Account, Contact, Locale } from '@/lib/types';

/** Routes ported 1:1 from design/reference (they render the reference nav/footer themselves). */
const PORTED = ['/directory', '/talent', '/join', '/about', '/contact'];

/** Pages that bring their own chrome (auth split screen, booking wizard, dashboard). */
const BARE = ['/login', '/join/user', '/join/client', '/join/influencer', '/request', '/orders', '/account', '/studio', '/admin'];

export function Frame({ locale, contact, children }: { locale: Locale; contact?: Contact | null; children: ReactNode }) {
  const copy = getCopy(locale);
  const bq = getBq(locale);
  const pathname = usePathname();
  const [user, setUser] = useState<Account | null>(null);
  const [menu, setMenu] = useState(false);

  const rest = pathname.replace(/^\/(ar|en)/, '') || '/';
  const home = rest === '/';
  // Ported reference pages render their own nav/footer (design/reference); so do focused pages.
  const ported = home || PORTED.some((path) => rest === path || rest.startsWith(`${path}/`));
  const bare = ported || BARE.some((path) => rest === path || rest.startsWith(`${path}/`));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  useEffect(() => {
    setUser(readSession()?.user || null);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return undefined;
    lockScroll(true);
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenu(false);
    }
    window.addEventListener('keydown', key);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', key);
    };
  }, [menu]);

  const links = [
    { href: `/${locale}/directory`, label: bq.nav.creators, on: rest.startsWith('/directory') || rest.startsWith('/talent') },
    { href: `/${locale}/request`, label: bq.nav.brands, on: rest.startsWith('/request') },
    { href: `/${locale}/join`, label: bq.nav.joinCreator, on: rest === '/join' },
    { href: `/${locale}/about`, label: bq.nav.about, on: rest.startsWith('/about') },
  ];

  return (
    <>
      <MotionEngine />

      {bare ? null : (
        <header className="nav">
          <div className="wrap nav-in">
            <Link href={`/${locale}`} className="logo" aria-label={copy.wordmark}>
              <Logo />
              <span>{copy.wordmark}</span>
            </Link>
            <nav className="navl" aria-label={bq.nav.main}>
              {links.map((item) => (
                <Link key={item.href} href={item.href} className={`nl${item.on ? ' cur' : ''}`} aria-current={item.on ? 'page' : undefined}>{item.label}</Link>
              ))}
            </nav>
            <div className="nav-tools">
              <Suspense fallback={null}><LangSwitch locale={locale} label={bq.nav.lang} className="hide-xs" /></Suspense>
              {user ? (
                <AccountMenu locale={locale} user={user} pathname={pathname} onLeave={() => setUser(null)} />
              ) : (
                <>
                  <Link href={`/${locale}/login`} className="btn btn-ghost btn-sm hide-m">{bq.nav.login}</Link>
                  <Link href={`/${locale}/join`} className="btn btn-acc btn-sm mag">{bq.nav.start}<ArrowIcon size={18} /></Link>
                </>
              )}
              <button type="button" className="ibtn ibtn-sm mbtn" onClick={() => setMenu(true)} aria-expanded={menu} aria-controls="bq-menu" aria-label={bq.nav.menu}>
                <Icon name="menu" />
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="mnav" id="bq-menu" data-open={menu || undefined} aria-hidden={!menu} role="dialog" aria-modal="true" aria-label={bq.nav.main} data-lenis-prevent="">
        <div className="mnav-top">
          <Link href={`/${locale}`} className="logo" tabIndex={menu ? 0 : -1} onClick={() => setMenu(false)}>
            <Logo />
            <span>{copy.wordmark}</span>
          </Link>
          <button type="button" className="mnav-x" onClick={() => setMenu(false)} aria-label={bq.nav.close} tabIndex={menu ? 0 : -1}>
            <Icon name="close" />
          </button>
        </div>
        <nav className="mnav-links">
          {[{ href: `/${locale}`, label: bq.nav.home }, ...links, { href: `/${locale}/contact`, label: bq.nav.contact }].map((item, index) => (
            <Link key={item.href} href={item.href} tabIndex={menu ? 0 : -1} style={{ ['--i' as string]: String(index) }} onClick={() => setMenu(false)}>
              <small>{String(index + 1).padStart(2, '0')}</small>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mnav-foot">
          <Suspense fallback={null}><LangSwitch locale={locale} label={bq.nav.lang} className="mnav-lang" tabIndex={menu ? 0 : -1} /></Suspense>
          {user ? (
            <>
              <Link href={`/${locale}/orders`} className="btn btn-dark" tabIndex={menu ? 0 : -1}>{copy.orders}</Link>
              <Link href={`/${locale}/account`} className="btn btn-ghost" tabIndex={menu ? 0 : -1}>{copy.account}</Link>
              {user.role === 'user' ? (
                <Link href={`/${locale}/join/influencer`} className="btn btn-ghost" tabIndex={menu ? 0 : -1}>{getAccount(locale).becomeCreator}</Link>
              ) : null}
              {user.role === 'admin' ? (
                <Link href={`/${locale}/admin`} className="btn btn-ghost" tabIndex={menu ? 0 : -1}>{getAccount(locale).adminPanel}</Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href={`/${locale}/join`} className="btn btn-dark" tabIndex={menu ? 0 : -1}>{bq.nav.start}<ArrowIcon size={18} /></Link>
              <Link href={`/${locale}/login`} className="btn btn-ghost" tabIndex={menu ? 0 : -1}>{bq.nav.login}</Link>
            </>
          )}
        </div>
      </div>

      <main id="main">{children}</main>

      {bare ? null : home ? <BigFooter locale={locale} user={user} contact={contact || null} /> : <SmallFooter locale={locale} />}
    </>
  );
}

function MotionSwitch({ locale }: { locale: Locale }) {
  const bq = getBq(locale);
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(document.documentElement.classList.contains('still'));
  }, []);
  return (
    <button type="button" onClick={() => { setStill(!off); setOff(!off); }} aria-pressed={off}>
      <Icon name={off ? 'play' : 'pause'} size={14} />
      {off ? bq.foot.motionOn : bq.foot.motionOff}
    </button>
  );
}

function BigFooter({ locale, user, contact }: { locale: Locale; user: Account | null; contact: Contact | null }) {
  const copy = getCopy(locale);
  const bq = getBq(locale);
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-g">
          <div>
            <Link href={`/${locale}`} className="logo mb-5"><Logo /><span>{copy.wordmark}</span></Link>
            <p className="lead text-[16px] max-w-[340px]">{bq.foot.blurb}</p>
          </div>
          <div>
            <h4>{bq.foot.platform}</h4>
            <ul>
              <li><Link href={`/${locale}/directory`}>{bq.nav.creators}</Link></li>
              <li><Link href={`/${locale}/request`}>{bq.nav.brands}</Link></li>
              <li><Link href={`/${locale}/join/user`}>{getAccount(locale).newUser}</Link></li>
              <li><Link href={`/${locale}/join/influencer`}>{bq.nav.joinCreator}</Link></li>
              <li><Link href={`/${locale}/join/client`}>{copy.joinClient}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{bq.foot.company}</h4>
            <ul>
              <li><Link href={`/${locale}/about`}>{bq.nav.about}</Link></li>
              <li><Link href={`/${locale}/contact`}>{bq.nav.contact}</Link></li>
              {user ? (
                <>
                  <li><Link href={`/${locale}/orders`}>{copy.orders}</Link></li>
                  <li><Link href={`/${locale}/account`}>{copy.account}</Link></li>
                </>
              ) : (
                <li><Link href={`/${locale}/login`}>{bq.nav.login}</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h4>{bq.foot.reach}</h4>
            <ul>
              {/* Real contact details from the platform settings; placeholders until they are filled in. */}
              <li>{contact?.phone ? <a href={`tel:${contact.phone}`} dir="ltr">{contact.phone}</a> : <span>{bq.foot.phone}</span>}</li>
              <li>{contact?.email ? <a href={`mailto:${contact.email}`} dir="ltr">{contact.email}</a> : <span>{bq.foot.email}</span>}</li>
              {contact?.address ? <li><span className="text-[var(--mut)]">{contact.address}</span></li> : null}
            </ul>
          </div>
        </div>
      </div>
      <div className="foot-mark skx" aria-hidden="true" data-sparkle="">{copy.wordmark}</div>
      <div className="wrap">
        <div className="foot-legal">
          <span>© {year} {copy.wordmark}. {bq.foot.rights}</span>
          <span className="flex items-center gap-6 flex-wrap"><MotionSwitch locale={locale} /><span>{bq.foot.made}</span></span>
        </div>
      </div>
    </footer>
  );
}

function SmallFooter({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const bq = getBq(locale);
  return (
    <footer className="foot-s">
      <div className="wrap foot-s-in">
        <Link href={`/${locale}`} className="logo text-[22px]"><Logo /><span>{copy.wordmark}</span></Link>
        <nav aria-label={bq.foot.platform}>
          <Link href={`/${locale}/directory`}>{bq.nav.creators}</Link>
          <Link href={`/${locale}/request`}>{bq.nav.brands}</Link>
          <Link href={`/${locale}/join`}>{bq.nav.joinCreator}</Link>
          <Link href={`/${locale}/about`}>{bq.nav.about}</Link>
          <Link href={`/${locale}/contact`}>{bq.nav.contact}</Link>
        </nav>
        <small>© {new Date().getFullYear()} {copy.wordmark}</small>
      </div>
    </footer>
  );
}

function LangSwitch({ locale, label, className, tabIndex }: { locale: Locale; label: string; className?: string; tabIndex?: number }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const nextPath = pathname.replace(/^\/(ar|en)/, `/${other}`);
  const query = search.toString();
  const href = query ? `${nextPath}?${query}` : nextPath;
  return (
    <a className={`ibtn ibtn-sm lang${className ? ` ${className}` : ''}`} href={href} title={label} aria-label={label} lang={other} tabIndex={tabIndex} onClick={(event) => { event.preventDefault(); router.push(href); }}>
      {locale === 'ar' ? 'EN' : 'ع'}
    </a>
  );
}
