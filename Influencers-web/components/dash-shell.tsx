'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowIcon, Icon, Star, type IconName } from '@/components/icons';
import { lockScroll } from '@/components/motion';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { clearSession } from '@/lib/session';
import type { Locale } from '@/lib/types';

export type DashPage = 'orders' | 'account' | 'studio';
type DashUser = { id: number; name: string; role: string };

function today(locale: Locale, days: string[], months: string[]) {
  const date = new Date();
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  return locale === 'ar'
    ? `${day}، ${date.getDate()} ${month} ${date.getFullYear()}`
    : `${day}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Signed-in dashboard chrome: 264px sidebar (drawer under 960px), top bar and page heading. */
export function DashShell({
  locale,
  user,
  page,
  eyebrow,
  title,
  deck,
  onLeave,
  children,
}: {
  locale: Locale;
  user: DashUser;
  page: DashPage;
  eyebrow?: ReactNode;
  title: string;
  deck?: string;
  onLeave?: () => void;
  children: ReactNode;
}) {
  const copy = getCopy(locale);
  const t = getDashboard(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const talent = user.role === 'influencer';
  const admin = user.role === 'admin';
  const plainUser = user.role === 'user';
  const roleLabel = talent ? t.roleTalent : admin ? t.roleAdmin : plainUser ? t.roleUser : t.roleClient;
  const card = talent
    ? { title: t.cardTalentTitle, body: t.cardTalentBody, href: `/${locale}/studio`, cta: t.navStudio }
    : admin
      ? { title: t.cardAdminTitle, body: t.cardAdminBody, href: `/${locale}/admin`, cta: t.adminBtn }
      : plainUser
        ? { title: t.cardUserTitle, body: t.cardUserBody, href: `/${locale}/join/influencer`, cta: t.cardUserTitle }
        : { title: t.cardClientTitle, body: t.cardClientBody, href: `/${locale}/request`, cta: t.newRequest };

  useEffect(() => {
    setDate(today(locale, t.days, copy.calMonths));
  }, [locale, t.days, copy.calMonths]);

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

  const links: { id: DashPage; label: string; icon: IconName }[] = [
    { id: 'orders', label: t.navOrders, icon: 'grid' },
    { id: 'account', label: t.navAccount, icon: 'user' },
    ...(talent ? [{ id: 'studio' as const, label: t.navStudio, icon: 'image' as const }] : []),
  ];

  return (
    <div className="ds">
      <div className="ds-mbar">
        <Link href={`/${locale}`} className="logo" aria-label={copy.wordmark}>
          <Star size={24} />
          <span>{copy.wordmark}</span>
        </Link>
        <button type="button" className="ibtn ibtn-sm" aria-label={t.menu} aria-expanded={open} aria-controls="ds-side" onClick={() => setOpen(true)}>
          <Icon name="menu" size={20} />
        </button>
      </div>

      {open ? <button type="button" className="ds-scrim" aria-label={t.closeMenu} tabIndex={-1} onClick={() => setOpen(false)} /> : null}

      <aside id="ds-side" className="ds-side" data-open={open || undefined} aria-label={t.dashNav}>
        <div className="ds-side-top">
          <Link href={`/${locale}`} className="logo" aria-label={copy.wordmark}>
            <Star size={26} />
            <span>{copy.wordmark}</span>
          </Link>
          <button type="button" className="ibtn ibtn-sm ds-x" aria-label={t.closeMenu} onClick={() => setOpen(false)}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="ds-nav">
          {links.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}/${item.id}`}
              className={`sb-l${page === item.id ? ' on' : ''}`}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon name={item.icon} size={20} />{item.label}
            </Link>
          ))}
          <span className="ds-rule" aria-hidden="true" />
          <Link href={`/${locale}`} className="sb-l"><Icon name="home" size={20} />{t.backSite}</Link>
          <button type="button" className="sb-l ds-out" onClick={leave}><Icon name="logout" size={20} flip />{copy.signOut}</button>
        </nav>

        <div className="ds-card">
          <Star size={26} color="#0E0D12" className="spin" />
          <b className="disp">{card.title}</b>
          <p>{card.body}</p>
          <Link href={card.href} className="btn btn-dark btn-sm" onClick={() => setOpen(false)}>
            {card.cta}<ArrowIcon size={18} />
          </Link>
        </div>
      </aside>

      <div className="ds-main">
        <header className="ds-top">
          <div className="min-w-0">
            <p className="ds-date">{date || ' '}</p>
            <p className="ds-hello disp">{t.hello} <span className="ac" dir="auto">{user.name}</span></p>
          </div>
          <div className="ds-top-act">
            <span className="tag-l ds-role hide-m">{roleLabel}</span>
            {talent ? (
              <Link href={`/${locale}/talent/${user.id}`} className="btn btn-acc btn-sm">{copy.viewProfile}<ArrowIcon size={18} /></Link>
            ) : admin ? (
              <Link href={`/${locale}/admin`} className="btn btn-acc btn-sm">{t.cardAdminTitle}<ArrowIcon size={18} /></Link>
            ) : (
              <Link href={`/${locale}/request`} className="btn btn-acc btn-sm"><Icon name="plus" size={18} />{t.newRequest}</Link>
            )}
          </div>
        </header>

        <main className="ds-body">
          <header className="ds-head fd">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h1 className="ds-title">{title}</h1>
            {deck ? <p className="ds-deck">{deck}</p> : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Loading dots used while the session resolves. */
export function DashWait({ label }: { label: string }) {
  return <p className="wait" role="status" aria-label={label}><i /><i /><i /></p>;
}
