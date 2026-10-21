'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowIcon, Icon, Star, type IconName } from '@/components/icons';
import { lockScroll } from '@/components/motion';
import { api } from '@/lib/api';
import { getAdmin } from '@/lib/copy-admin';
import { getCopy } from '@/lib/copy';
import { clearSession, readSession } from '@/lib/session';
import type { Account, Locale, OwnAccount, OwnOrder } from '@/lib/types';
import { Gate } from './desk';

export type AdminAccountRow = {
  id: number;
  name: string;
  role: string;
  status: string;
  statusReason: string | null;
  phone: string | null;
  email: string | null;
  brandName: string | null;
  createdAt: string;
};

export type AdminAccount = OwnAccount & {
  statusReason: string | null;
  createdAt: string;
  profile: (OwnAccount['profile'] & {
    avatar?: string | null;
    cover?: string | null;
    portfolio?: { id: number; filePath: string }[];
  }) | null;
};

export type Requester = { id: number; name: string; role: string; phone: string | null; email: string | null };
export type AdminRequest = OwnOrder & { requester: Requester };

export type AdminStats = {
  accounts: { role: string; status: string; n: number }[];
  requests: Record<string, number>;
};

type AdminCtx = {
  locale: Locale;
  token: string;
  user: Account;
  stats: AdminStats | null;
  refreshStats: () => void;
};

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const value = useContext(Ctx);
  if (!value) throw new Error('useAdmin outside AdminShell');
  return value;
}

/** Sums account counts for a role/status (either may be omitted). */
export function countAccounts(stats: AdminStats | null, role?: string, status?: string) {
  if (!stats) return 0;
  return stats.accounts.filter((row) => (!role || row.role === role) && (!status || row.status === status)).reduce((sum, row) => sum + row.n, 0);
}

export const accountTone: Record<string, string> = {
  pending: 'pill-pending',
  approved: 'pill-active',
  rejected: 'pill-bad',
  suspended: 'pill-done',
};

export const requestTone: Record<string, string> = {
  pending: 'pill-pending',
  reviewing: 'pill-pending',
  confirmed: 'pill-active',
  closed: 'pill-done',
  rejected: 'pill-bad',
};

export function stamp(locale: Locale, value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const months = getCopy(locale).calMonths;
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return locale === 'ar' ? `${day} ${month} ${year}` : `${month} ${day}, ${year}`;
}

export function errText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function today(locale: Locale, days: string[], months: string[]) {
  const date = new Date();
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  return locale === 'ar'
    ? `${day}، ${date.getDate()} ${month} ${date.getFullYear()}`
    : `${day}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
}

type Section = { href: string; label: string; icon: IconName; badge?: number };

/** Admin chrome: session gate, 264px sidebar (drawer under 960px) and top bar. Pages read the session with `useAdmin()`. */
export function AdminShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const router = useRouter();
  const pathname = usePathname() || '';
  const [session, setSession] = useState<{ token: string; user: Account } | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    setDate(today(locale, t.days, copy.calMonths));
  }, [locale, t.days, copy.calMonths]);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      setSession(null);
      return;
    }
    api<Account>('/api/v1/auth/me', { token: saved.token })
      .then((result) => setSession({ token: saved.token, user: result.data }))
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  const token = session?.user.role === 'admin' ? session.token : '';
  const refreshStats = useCallback(() => {
    if (!token) return;
    api<AdminStats>('/api/v1/admin/stats', { token })
      .then((result) => setStats(result.data))
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  if (session === undefined) return <AdminWait label={copy.loading} />;

  if (!session) {
    return (
      <Gate eyebrow={t.area} title={t.gateTitle} deck={t.gateLogin} shot="/scenes/campaign.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin`)}`}><span>{copy.enter}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  if (session.user.role !== 'admin') {
    return (
      <Gate eyebrow={t.area} title={t.gateOnly} deck={t.gateOnlyDeck} shot="/scenes/campaign.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}`}><span>{t.gateHome}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  function leave() {
    setOpen(false);
    clearSession();
    router.push(`/${locale}`);
  }

  const base = `/${locale}/admin`;
  const pendingAccounts = countAccounts(stats, undefined, 'pending');
  const openRequests = stats ? (stats.requests.pending || 0) + (stats.requests.reviewing || 0) : 0;
  const links: Section[] = [
    { href: base, label: t.navOverview, icon: 'grid' },
    { href: `${base}/accounts`, label: t.navAccounts, icon: 'users', badge: pendingAccounts },
    { href: `${base}/requests`, label: t.navRequests, icon: 'layers', badge: openRequests },
    { href: `${base}/categories`, label: t.navCategories, icon: 'sliders' },
    { href: `${base}/contact`, label: t.navContact, icon: 'phone' },
  ];
  const active = (href: string) => (href === base ? pathname === base || pathname === `${base}/` : pathname.startsWith(href));

  return (
    <Ctx.Provider value={{ locale, token: session.token, user: session.user, stats, refreshStats }}>
      <div className="ds ad">
        <div className="ds-mbar">
          <Link href={base} className="logo" aria-label={copy.wordmark}>
            <Star size={24} />
            <span>{copy.wordmark}</span>
          </Link>
          <button type="button" className="ibtn ibtn-sm" aria-label={t.menu} aria-expanded={open} aria-controls="ad-side" onClick={() => setOpen(true)}>
            <Icon name="menu" size={20} />
          </button>
        </div>

        {open ? <button type="button" className="ds-scrim" aria-label={t.closeMenu} tabIndex={-1} onClick={() => setOpen(false)} /> : null}

        <aside id="ad-side" className="ds-side" data-open={open || undefined} aria-label={t.nav}>
          <div className="ds-side-top">
            <Link href={base} className="logo" aria-label={copy.wordmark}>
              <Star size={26} />
              <span>{copy.wordmark}</span>
            </Link>
            <button type="button" className="ibtn ibtn-sm ds-x" aria-label={t.closeMenu} onClick={() => setOpen(false)}>
              <Icon name="close" size={18} />
            </button>
          </div>

          <span className="ad-area tag-l">{t.area}</span>

          <nav className="ds-nav">
            {links.map((item) => {
              const on = active(item.href);
              return (
                <Link key={item.href} href={item.href} className={`sb-l${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => setOpen(false)}>
                  <Icon name={item.icon} size={20} />
                  <span className="ad-l">{item.label}</span>
                  {item.badge ? <em className="ad-badge" dir="ltr">{item.badge}</em> : null}
                </Link>
              );
            })}
            <span className="ds-rule" aria-hidden="true" />
            <Link href={`/${locale}`} className="sb-l"><Icon name="home" size={20} />{t.backSite}</Link>
            <button type="button" className="sb-l ds-out" onClick={leave}><Icon name="logout" size={20} flip />{copy.signOut}</button>
          </nav>
        </aside>

        <div className="ds-main">
          <header className="ds-top">
            <div className="min-w-0">
              <p className="ds-date">{date || ' '}</p>
              <p className="ds-hello disp">{t.hello} <span className="ac" dir="auto">{session.user.name}</span></p>
            </div>
            <div className="ds-top-act">
              <span className="tag-l ds-role hide-m">{t.roleTag}</span>
            </div>
          </header>

          <main className="ds-body">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}

/** Page heading inside the admin shell. */
export function AdminHead({ eyebrow, title, deck, children }: { eyebrow: ReactNode; title: string; deck?: string; children?: ReactNode }) {
  return (
    <header className="ds-head ad-head fd">
      <div className="min-w-0">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="ds-title">{title}</h1>
        {deck ? <p className="ds-deck">{deck}</p> : null}
      </div>
      {children}
    </header>
  );
}

export function AdminWait({ label }: { label: string }) {
  return <p className="wait" role="status" aria-label={label}><i /><i /><i /></p>;
}

/** Side panel (inline-end) for a record's details; full width under 560px. */
export function AdminDrawer({ title, label, onClose, children }: { title: ReactNode; label: string; onClose: () => void; children: ReactNode }) {
  const { locale } = useAdmin();
  const t = getAdmin(locale);
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    lockScroll(true);
    const before = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') close.current();
    }
    document.addEventListener('keydown', key);
    return () => {
      lockScroll(false);
      document.removeEventListener('keydown', key);
      before?.focus?.();
    };
  }, []);

  return (
    <>
      <button type="button" className="ad-scrim" aria-label={t.close} tabIndex={-1} onClick={onClose} />
      <div className="ad-drawer" role="dialog" aria-modal="true" aria-label={label} ref={ref} tabIndex={-1}>
        <header className="ad-drawer-top">
          <div className="min-w-0">{title}</div>
          <button type="button" className="ibtn ibtn-sm" aria-label={t.close} onClick={onClose}><Icon name="close" size={18} /></button>
        </header>
        <div className="ad-drawer-body">{children}</div>
      </div>
    </>
  );
}

/** Label / value list used in the detail panels. */
export function Facts({ rows }: { rows: ({ k: string; v: ReactNode; ltr?: boolean; wide?: boolean } | null | false | undefined)[] }) {
  const list = rows.filter(Boolean) as { k: string; v: ReactNode; ltr?: boolean; wide?: boolean }[];
  if (!list.length) return null;
  return (
    <dl className="ad-facts">
      {list.map((row) => (
        <div key={row.k} className={row.wide ? 'is-wide' : undefined}>
          <dt>{row.k}</dt>
          <dd dir={row.ltr ? 'ltr' : typeof row.v === 'string' ? 'auto' : undefined}>{row.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Previous / next pager. */
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  const { locale } = useAdmin();
  const t = getAdmin(locale);
  if (pages <= 1) return null;
  return (
    <nav className="ad-pager" aria-label={t.pageOf(page, pages)}>
      <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t.prev}</button>
      <span>{t.pageOf(page, pages)}</span>
      <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>{t.next}</button>
    </nav>
  );
}

/** Phone / e-mail stacked, as links. */
export function ContactCell({ phone, email }: { phone?: string | null; email?: string | null }) {
  if (!phone && !email) return <span className="ad-dim">—</span>;
  return (
    <span className="ad-contact">
      {phone ? <a href={`tel:${phone}`} dir="ltr">{phone}</a> : null}
      {email ? <a href={`mailto:${email}`} dir="ltr">{email}</a> : null}
    </span>
  );
}
