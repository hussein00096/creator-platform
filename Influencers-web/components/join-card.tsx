'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowIcon, Icon } from '@/components/icons';
import { SegControl } from '@/components/ui-client';
import { getJoin } from '@/lib/copy-join';
import type { Locale } from '@/lib/types';

type Role = 'user' | 'creator' | 'brand';

const targets: Record<Role, string> = { user: 'join/user', creator: 'join/influencer', brand: 'join/client' };

/** Hero chooser: picks the account type and links to the real sign-up form. */
export function JoinCard({ locale }: { locale: Locale }) {
  const t = getJoin(locale).card;
  const [role, setRole] = useState<Role>('creator');
  const href = `/${locale}/${targets[role]}`;
  const roles: Role[] = ['user', 'creator', 'brand'];

  return (
    <div className="card jn-card">
      <h2 className="h3">{t.title}</h2>
      <SegControl value={role} onChange={setRole} label={t.label} className="jn-seg" options={roles.map((value) => ({ value, label: t.roles[value] }))} />
      <p className="jn-next" key={role}>{t.next[role]}</p>
      <Link href={href} className="btn btn-acc btn-block mag">{t.cta[role]}<ArrowIcon /></Link>
      {role !== 'creator' ? null : <p className="jn-adult"><Icon name="info" size={16} />{t.adult}</p>}
      <p className="jn-have">
        {t.have} <Link href={`/${locale}/login`} className="lnk">{t.login}</Link>
      </p>
    </div>
  );
}
