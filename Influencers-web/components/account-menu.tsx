'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { clearSession } from '@/lib/session';
import type { Account, Locale } from '@/lib/types';

export function AccountMenu({
  locale,
  user,
  pathname,
  onLeave,
}: {
  locale: Locale;
  user: Account;
  pathname: string;
  onLeave: () => void;
}) {
  const copy = getCopy(locale);
  const acct = getAccount(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const initial = (user.name || copy.wordmark).trim().charAt(0);
  const onOrders = pathname.includes('/orders');
  const onAccount = pathname.includes('/account');

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function click(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', click);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  function leave() {
    clearSession();
    setOpen(false);
    onLeave();
    router.push(`/${locale}`);
  }

  return (
    <div className="acct" ref={root}>
      <button
        type="button"
        className="acct-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copy.account}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="acct-ini" aria-hidden="true">{initial}</span>
        <span className="hide-m" dir="auto">{user.name.split(' ')[0]}</span>
      </button>
      {open ? (
        <div className="acct-menu" role="menu" data-lenis-prevent="">
          <p dir="auto"><small>{copy.account}</small>{user.name}</p>
          <Link role="menuitem" href={`/${locale}/orders`} className={onOrders ? 'on' : undefined}><Icon name="grid" size={18} />{copy.orders}</Link>
          <Link role="menuitem" href={`/${locale}/account`} className={onAccount ? 'on' : undefined}><Icon name="user" size={18} />{copy.account}</Link>
          {user.role === 'influencer' ? (
            <Link role="menuitem" href={`/${locale}/studio`} className={pathname.includes('/studio') ? 'on' : undefined}><Icon name="image" size={18} />{copy.studio}</Link>
          ) : null}
          {user.role === 'user' ? (
            <Link role="menuitem" href={`/${locale}/join/influencer`}><Icon name="megaphone" size={18} />{acct.becomeCreator}</Link>
          ) : null}
          {user.role === 'admin' ? (
            <Link role="menuitem" href={`/${locale}/admin`} className={pathname.includes('/admin') ? 'on' : undefined}><Icon name="shield" size={18} />{acct.adminPanel}</Link>
          ) : null}
          <button type="button" role="menuitem" onClick={leave}><Icon name="logout" size={18} flip />{copy.signOut}</button>
        </div>
      ) : null}
    </div>
  );
}
