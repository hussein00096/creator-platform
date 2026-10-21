'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { clearSession, readSession, type Session } from '@/lib/session';
import type { Locale, OwnOrder } from '@/lib/types';
import { DashShell, DashWait } from './dash-shell';
import { Gate } from './desk';
import { ArrowIcon, Icon, type IconName } from './icons';
import { SegControl } from './ui-client';

type Bucket = 'all' | 'review' | 'confirmed' | 'done';

const buckets: Record<Exclude<Bucket, 'all'>, string[]> = {
  review: ['pending', 'reviewing'],
  confirmed: ['confirmed'],
  done: ['closed', 'rejected'],
};

const tone: Record<string, string> = {
  pending: 'pill-pending',
  reviewing: 'pill-pending',
  confirmed: 'pill-active',
  closed: 'pill-done',
  rejected: 'pill-bad',
};

function stamp(locale: Locale, value: string, months: string[]) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return locale === 'ar' ? `${day} ${month} ${year}` : `${month} ${day}, ${year}`;
}

export function OrderDesk({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const t = getDashboard(locale);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [rows, setRows] = useState<OwnOrder[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState('');
  const [filter, setFilter] = useState<Bucket>('all');

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      setSession(null);
      return;
    }
    api<{ id: number; name: string; role: string; status: string }>('/api/v1/auth/me', { token: saved.token })
      .then((result) => setSession({ token: saved.token, user: result.data }))
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  useEffect(() => {
    if (!session) return;
    api<OwnOrder[]>('/api/v1/me/requests', { token: session.token })
      .then((result) => setRows(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : copy.offline));
  }, [session, copy.offline]);

  if (session === undefined) return <DashWait label={copy.loading} />;

  if (!session) {
    return (
      <Gate eyebrow={copy.orders} title={copy.ordersTitle} deck={getAccount(locale).signInFirst} shot="/scenes/campaign.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/orders`)}`}><span>{copy.enter}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  const talent = session.user.role === 'influencer';
  const count = (key: Exclude<Bucket, 'all'>) => rows.filter((item) => buckets[key].includes(item.status)).length;
  const shown = filter === 'all' ? rows : rows.filter((item) => buckets[filter].includes(item.status));
  const kpis: { label: string; value: number; icon: IconName }[] = [
    { label: t.kpiTotal, value: rows.length, icon: 'layers' },
    { label: t.kpiReview, value: count('review'), icon: 'clock' },
    { label: t.kpiConfirmed, value: count('confirmed'), icon: 'check' },
    { label: t.kpiDone, value: count('done'), icon: 'file' },
  ];
  const filters: { value: Bucket; label: string }[] = [
    { value: 'all', label: t.filterAll },
    { value: 'review', label: t.filterReview },
    { value: 'confirmed', label: t.filterConfirmed },
    { value: 'done', label: t.filterDone },
  ];

  return (
    <DashShell
      locale={locale}
      user={session.user}
      page="orders"
      eyebrow={<>{copy.orders} — <span dir="ltr">{String(rows.length).padStart(2, '0')}</span></>}
      title={copy.ordersTitle}
      deck={copy.ordersDeck}
    >
      {error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : null}

      {!rows.length ? (
        <section className="card ds-empty fd">
          <Icon name={talent ? 'image' : 'layers'} size={28} />
          <p className="disp" dir="auto">{talent ? copy.ordersEmptyTalent : copy.ordersEmpty}</p>
          {talent ? (
            <Link className="btn btn-acc" href={`/${locale}/studio`}><span>{copy.studio}</span><ArrowIcon /></Link>
          ) : (
            <div className="ds-acts">
              <Link className="btn btn-acc" href={`/${locale}/directory`}><span>{copy.directory}</span><ArrowIcon /></Link>
              <Link className="btn btn-ghost" href={`/${locale}/request`}>{copy.request}</Link>
            </div>
          )}
        </section>
      ) : (
        <>
          <ul className="ds-kpis">
            {kpis.map((item, index) => (
              <li key={item.label} className={`ds-kpi fd${index === 0 ? ' is-acc' : ''}`} style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
                <span className="ds-kpi-ico" aria-hidden="true"><Icon name={item.icon} size={20} /></span>
                <b className="disp" dir="ltr">{String(item.value).padStart(2, '0')}</b>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <section className="card ds-panel">
            <header className="ds-panel-head">
              <h2 className="ds-h2">{t.tableTitle}</h2>
              <SegControl<Bucket>
                value={filter}
                onChange={(value) => { setFilter(value); setOpen(''); }}
                label={t.filterLabel}
                options={filters.map((item) => ({
                  value: item.value,
                  label: <>{item.label} <small className="ds-seg-n" dir="ltr">{item.value === 'all' ? rows.length : count(item.value)}</small></>,
                }))}
              />
            </header>

            {!shown.length ? (
              <p className="ds-none">{t.filterEmpty}</p>
            ) : (
              <div className="tbl-w">
                <table className="tbl ds-tbl">
                  <thead>
                    <tr>
                      <th scope="col">{t.colNum}</th>
                      <th scope="col">{t.colTitle}</th>
                      <th scope="col">{t.colDate}</th>
                      <th scope="col">{t.colStatus}</th>
                      <th scope="col"><span className="sr-only">{t.colMore}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((item) => {
                      const key = `${item.kind}-${item.id}`;
                      const on = open === key;
                      const status = copy.orderStatus[item.status as keyof typeof copy.orderStatus] || item.status;
                      const facts = [
                        item.productDescription ? { k: copy.product, v: item.productDescription } : null,
                        item.executionDetails ? { k: copy.execution, v: item.executionDetails } : null,
                        item.usagePlace ? { k: copy.usage, v: item.usagePlace } : null,
                        item.quantity ? { k: copy.quantity, v: String(item.quantity), ltr: true } : null,
                        item.faces.length ? { k: copy.orderFaces, v: item.faces.map((face) => face.name).join(' · ') } : null,
                        item.guests.length ? { k: copy.external, v: item.guests.map((guest) => guest.name).join(' · ') } : null,
                      ].filter(Boolean) as { k: string; v: string; ltr?: boolean }[];
                      const body = (item.kind === 'service' && item.details) || facts.length || (item.status === 'rejected' && item.rejectionReason);
                      return (
                        <Fragment key={key}>
                          <tr className={on ? 'is-on' : undefined}>
                            <td className="ds-num" dir="ltr">{String(rows.indexOf(item) + 1).padStart(2, '0')}</td>
                            <td>
                              <strong className="ds-row-t" dir="auto">{item.title}</strong>
                              <small className="ds-row-k">{copy.orderKind[item.kind]}</small>
                            </td>
                            <td className="ds-when">{stamp(locale, item.createdAt, copy.calMonths)}</td>
                            <td><span className={`pill ${tone[item.status] || 'pill-done'}`}>{status}</span></td>
                            <td className="ds-tog">
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setOpen(on ? '' : key)}
                                aria-expanded={on}
                                aria-controls={`more-${key}`}
                              >
                                {on ? copy.ordersClose : copy.ordersOpen}
                                <span className={`ds-pl${on ? ' on' : ''}`} aria-hidden="true"><Icon name="plus" size={16} /></span>
                              </button>
                            </td>
                          </tr>
                          {on ? (
                            <tr className="ds-more" id={`more-${key}`}>
                              <td colSpan={5}>
                                <div className="ds-more-in">
                                  {item.kind === 'service' && item.details ? <p className="ds-more-p" dir="auto">{item.details}</p> : null}
                                  {facts.length ? (
                                    <dl className="ds-facts">
                                      {facts.map((fact) => (
                                        <div key={fact.k}><dt>{fact.k}</dt><dd dir={fact.ltr ? 'ltr' : 'auto'}>{fact.v}</dd></div>
                                      ))}
                                    </dl>
                                  ) : null}
                                  {item.status === 'rejected' && item.rejectionReason ? (
                                    <p className="ds-reject" dir="auto"><b>{copy.orderReject}</b> {item.rejectionReason}</p>
                                  ) : null}
                                  {!body ? <p className="ds-more-p">{t.noDetails}</p> : null}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </DashShell>
  );
}
