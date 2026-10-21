'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAdmin } from '@/lib/copy-admin';
import { getCopy } from '@/lib/copy';
import { AdminHead, accountTone, countAccounts, errText, requestTone, stamp, useAdmin, type AdminAccountRow, type AdminRequest } from './admin-shell';
import { ArrowIcon, Icon, type IconName } from './icons';

/** Admin landing: KPI tiles from /admin/stats plus pending accounts and latest requests. */
export function AdminOverview() {
  const { locale, token, stats, refreshStats } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const [pending, setPending] = useState<AdminAccountRow[] | null>(null);
  const [latest, setLatest] = useState<AdminRequest[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshStats();
    Promise.all([
      api<AdminAccountRow[]>('/api/v1/admin/accounts?status=pending&limit=6', { token }),
      api<AdminRequest[]>('/api/v1/admin/requests?limit=6', { token }),
    ])
      .then(([accounts, requests]) => {
        setPending(accounts.data);
        setLatest(requests.data);
      })
      .catch((err) => setError(errText(err, copy.offline)));
  }, [token, refreshStats, copy.offline]);

  const base = `/${locale}/admin`;
  const req = stats?.requests || {};
  const allRequests = Object.values(req).reduce((sum, n) => sum + n, 0);
  const kpis: { label: string; value: number; icon: IconName; href: string }[] = [
    { label: t.kpiCreators, value: countAccounts(stats, 'influencer', 'pending'), icon: 'star', href: `${base}/accounts?role=influencer&status=pending` },
    { label: t.kpiCompanies, value: countAccounts(stats, 'client', 'pending'), icon: 'briefcase', href: `${base}/accounts?role=client&status=pending` },
    { label: t.kpiOpen, value: (req.pending || 0) + (req.reviewing || 0), icon: 'clock', href: `${base}/requests?status=pending` },
    { label: t.kpiUsers, value: countAccounts(stats, 'user'), icon: 'user', href: `${base}/accounts?role=user&status=all` },
    { label: t.kpiApprovedCreators, value: countAccounts(stats, 'influencer', 'approved'), icon: 'check', href: `${base}/accounts?role=influencer&status=approved` },
    { label: t.kpiApprovedCompanies, value: countAccounts(stats, 'client', 'approved'), icon: 'shield', href: `${base}/accounts?role=client&status=approved` },
    { label: t.kpiConfirmed, value: req.confirmed || 0, icon: 'spark', href: `${base}/requests?status=confirmed` },
    { label: t.kpiAllRequests, value: allRequests, icon: 'file', href: `${base}/requests?status=all` },
  ];

  return (
    <>
      <AdminHead eyebrow={t.navOverview} title={t.overviewTitle} deck={t.overviewDeck} />
      {error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : null}

      <ul className="ds-kpis ad-kpis">
        {kpis.map((item, index) => (
          <li key={item.label} className="fd" style={{ animationDelay: `${0.08 + index * 0.05}s` }}>
            <Link href={item.href} className={`ds-kpi ad-kpi${index < 3 && item.value ? ' is-acc' : ''}`}>
              <span className="ds-kpi-ico" aria-hidden="true"><Icon name={item.icon} size={20} /></span>
              <b className="disp" dir="ltr">{stats ? String(item.value).padStart(2, '0') : '—'}</b>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="ad-two">
        <section className="card ds-panel">
          <header className="ds-panel-head">
            <h2 className="ds-h2">{t.pendingList}</h2>
            <Link href={`${base}/accounts?status=pending`} className="lnk ad-more">{t.seeAll}<ArrowIcon size={16} /></Link>
          </header>
          {pending === null ? null : !pending.length ? (
            <p className="ds-none">{t.nonePending}</p>
          ) : (
            <ul className="ad-list">
              {pending.map((row) => (
                <li key={row.id}>
                  <Link href={`${base}/accounts?status=pending&open=${row.id}`} className="ad-list-row">
                    <span className="min-w-0">
                      <strong dir="auto">{row.brandName || row.name}</strong>
                      <small>{t.roles[row.role] || row.role} · {stamp(locale, row.createdAt)}</small>
                    </span>
                    <span className={`pill ${accountTone[row.status] || 'pill-done'}`}>{t.statuses[row.status] || row.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card ds-panel">
          <header className="ds-panel-head">
            <h2 className="ds-h2">{t.latestRequests}</h2>
            <Link href={`${base}/requests`} className="lnk ad-more">{t.seeAll}<ArrowIcon size={16} /></Link>
          </header>
          {latest === null ? null : !latest.length ? (
            <p className="ds-none">{t.noneRequests}</p>
          ) : (
            <ul className="ad-list">
              {latest.map((row) => (
                <li key={`${row.kind}-${row.id}`}>
                  <Link href={`${base}/requests?status=all&open=${row.kind}-${row.id}`} className="ad-list-row">
                    <span className="min-w-0">
                      <strong dir="auto">{row.title}</strong>
                      <small>{t.kinds[row.kind]} · <span dir="auto">{row.requester.name}</span> · {stamp(locale, row.createdAt)}</small>
                    </span>
                    <span className={`pill ${requestTone[row.status] || 'pill-done'}`}>{copy.orderStatus[row.status as keyof typeof copy.orderStatus] || row.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
