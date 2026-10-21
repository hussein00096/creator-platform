'use client';

// 1:1 port of design/reference/dashboard.html (KPI tiles, filterable table, side widgets) for /orders.
// Data, KPIs, status filter, details toggle, auth gate and empty states are the existing OrderDesk logic
// (components/order-desk.tsx) over GET /api/v1/me/requests.
import Link from 'next/link';
import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { DashWait } from '@/components/dash-shell';
import { Gate } from '@/components/desk';
import { ArrowIcon } from '@/components/icons';
import { RefDashShell, T as SHELL, dayMonth, digits } from '@/components/ref/dash-shell';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { clearSession, readSession, type Session } from '@/lib/session';
import type { Locale, OwnOrder } from '@/lib/types';

type Bucket = 'all' | 'review' | 'confirmed' | 'done';

const buckets: Record<Exclude<Bucket, 'all'>, string[]> = {
  review: ['pending', 'reviewing'],
  confirmed: ['confirmed'],
  done: ['closed', 'rejected'],
};

const T = {
  ar: {
    table: 'الطلبات',
    filter: 'فلترة الطلبات',
    colTitle: 'الطلب',
    colFace: 'المؤثر',
    colKind: 'النوع',
    colStatus: 'الحالة',
    colDate: 'الموعد',
    colAct: 'إجراء',
    view: 'عرض',
    hide: 'إخفاء',
    fresh: 'طلبات جديدة',
    freshLabel: 'آخر الطلبات',
    waiting: (n: string) => `${n} قيد المراجعة`,
    week: 'هذا الأسبوع',
    weekLabel: 'طلبات الأسبوع',
    weekNone: 'ماكو طلبات هالأسبوع.',
    none: 'ماكو طلبات بعد.',
    noMatch: 'ماكو نتائج مطابقة.',
  },
  en: {
    table: 'Requests',
    filter: 'Filter requests',
    colTitle: 'Request',
    colFace: 'Creator',
    colKind: 'Type',
    colStatus: 'Status',
    colDate: 'Date',
    colAct: 'Action',
    view: 'View',
    hide: 'Hide',
    fresh: 'New requests',
    freshLabel: 'Latest requests',
    waiting: (n: string) => `${n} in review`,
    week: 'This week',
    weekLabel: 'This week’s requests',
    weekNone: 'No requests this week.',
    none: 'No requests yet.',
    noMatch: 'No matching results.',
  },
};

/** Avatar colours of the reference rows / offer cards, cycled. */
const SWATCH = ['#7A2E3B', '#1F5A4E', '#3B2F7A', '#6B4A1F', '#2F5A3A', '#24525E'];
const OFFER = ['#6A2F4A', '#4A2F5E', '#2A3F66'];

/** Reference status pill colours: green = active, orange = awaiting, grey = finished (+ red for declined). */
const PILL: Record<string, CSSProperties> = {
  pending: { background: 'rgba(255,154,92,.15)', color: '#FF9A5C' },
  reviewing: { background: 'rgba(255,154,92,.15)', color: '#FF9A5C' },
  confirmed: { background: 'rgba(74,222,128,.14)', color: '#6EE7A0' },
  closed: { background: '#24212D', color: '#B1ACBE' },
  rejected: { background: 'rgba(248,113,113,.14)', color: '#F87171' },
};

const KPI_ICON = ['M3 11l18-8-8 18-2-8z', 'M4 4h16v16H4zM4 8l8 5 8-5', 'M20 6L9 17l-5-5', 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18'];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function RefOrders({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const d = getDashboard(locale);
  const t = T[locale];
  const s = SHELL[locale];
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [rows, setRows] = useState<OwnOrder[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState('');
  const [filter, setFilter] = useState<Bucket>('all');
  const [query, setQuery] = useState('');

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
  const needle = query.trim().toLowerCase();
  const shown = (filter === 'all' ? rows : rows.filter((item) => buckets[filter].includes(item.status)))
    .filter((item) => !needle || [item.title, ...item.faces.map((face) => face.name), ...item.guests.map((guest) => guest.name)].join(' ').toLowerCase().includes(needle));
  const kpis = [
    { label: d.kpiTotal, value: rows.length },
    { label: d.kpiReview, value: count('review') },
    { label: d.kpiConfirmed, value: count('confirmed') },
    { label: d.kpiDone, value: count('done') },
  ];
  const filters: { value: Bucket; label: string }[] = [
    { value: 'all', label: d.filterAll },
    { value: 'review', label: d.filterReview },
    { value: 'confirmed', label: d.filterConfirmed },
    { value: 'done', label: d.filterDone },
  ];
  const statusOf = (item: OwnOrder) => copy.orderStatus[item.status as keyof typeof copy.orderStatus] || item.status;
  const who = (item: OwnOrder) => item.faces[0]?.name || item.guests[0]?.name || '';
  const extra = (item: OwnOrder) => item.faces.length + item.guests.length - 1;

  // Side widgets from the same requests: newest three, and this week's strip (dots on days with requests).
  const latest = [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 3);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const week = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const thisWeek = rows.filter((item) => week.some((day) => sameDay(day, new Date(item.createdAt))));

  return (
    <RefDashShell locale={locale} user={session.user} page="orders" search={{ value: query, onChange: (value) => { setQuery(value); setOpen(''); } }}>
      {error ? <p className="dsr-msg dsr-err" dir="auto" role="alert" style={{ marginTop: '20px' }}>{error}</p> : null}

      {/* KPIs */}
      <div className="g4" style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        {kpis.map((item, index) => {
          const acc = index === 0;
          return (
            <div key={item.label} className="card lift pop" style={{ padding: '22px', borderRadius: '24px', animationDelay: `${(index * 0.07).toFixed(2)}s`, background: acc ? 'var(--acc)' : '#17151E', color: acc ? '#0E0D12' : '#F5F2EA', borderColor: acc ? 'transparent' : '#2C2936' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: acc ? '#2A2733' : '#B1ACBE' }}>{item.label}</span>
                <span style={{ width: '38px', height: '38px', borderRadius: '12px', background: acc ? '#0E0D12' : '#24212D', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={KPI_ICON[index]}></path></svg></span>
              </div>
              <div className="disp" style={{ marginTop: '14px', fontSize: '44px', fontWeight: '900', lineHeight: '1' }}>{digits(item.value, locale)}</div>
            </div>
          );
        })}
      </div>

      <div className="split" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>

        {/* requests */}
        <section className="card fd" aria-label={t.table} style={{ borderRadius: '28px', padding: '24px', animationDelay: '.3s' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 className="disp" style={{ margin: '0', fontSize: '22px', fontWeight: '800' }}>{t.table}</h2>
            <div className="seg-w dsr-tabs" role="tablist" aria-label={t.filter}>
              {filters.map((item) => (
                <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} className={`seg ${filter === item.value ? 'on' : ''}`} style={{ minHeight: '38px', padding: '0 14px', fontSize: '14px' }} onClick={() => { setFilter(item.value); setOpen(''); }}>{item.label}</button>
              ))}
            </div>
          </div>

          {!rows.length ? (
            <div className="dsr-empty">
              <p className="disp" dir="auto">{talent ? copy.ordersEmptyTalent : copy.ordersEmpty}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {talent ? (
                  <Link className="btn btn-acc btn-sm" href={`/${locale}/studio`}>{copy.studio}</Link>
                ) : (
                  <>
                    <Link className="btn btn-acc btn-sm" href={`/${locale}/directory`}>{copy.directory}</Link>
                    <Link className="btn btn-ghost btn-sm" href={`/${locale}/request`}>{copy.request}</Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '16px', overflowX: 'auto' }}>
              <table className="tbl" style={{ minWidth: '640px' }}>
                <thead><tr><th>{t.colTitle}</th><th>{t.colFace}</th><th>{t.colKind}</th><th>{t.colStatus}</th><th>{t.colDate}</th><th><span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t.colAct}</span></th></tr></thead>
                <tbody>
                  {!shown.length ? (
                    <tr><td colSpan={6} style={{ color: '#8A859B', textAlign: 'center', padding: '28px 16px' }}>{needle ? t.noMatch : d.filterEmpty}</td></tr>
                  ) : shown.map((item, index) => {
                    const key = `${item.kind}-${item.id}`;
                    const on = open === key;
                    const name = who(item);
                    const more = extra(item);
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
                        <tr className="pop" style={{ animationDelay: `${(Math.min(index, 8) * 0.05).toFixed(2)}s` }}>
                          <td style={{ fontWeight: '600' }} dir="auto">{item.title}</td>
                          <td>
                            {name ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '34px', height: '34px', borderRadius: '50%', background: SWATCH[index % SWATCH.length], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>{name.trim().charAt(0)}</span><span dir="auto">{name}</span>{more > 0 ? <span style={{ color: '#8A859B', fontSize: '13px' }}>+{digits(more, locale)}</span> : null}</span>
                            ) : <span style={{ color: '#8A859B' }}>—</span>}
                          </td>
                          <td style={{ color: '#B1ACBE' }}>{copy.orderKind[item.kind]}</td>
                          <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '6px 12px', borderRadius: '999px', ...(PILL[item.status] || PILL.closed) }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }}></span>{statusOf(item)}</span></td>
                          <td style={{ color: '#B1ACBE' }}>{dayMonth(locale, item.createdAt)}</td>
                          <td><button type="button" className="btn btn-ghost btn-sm" style={{ minHeight: '40px', padding: '0 14px', fontSize: '14px' }} aria-expanded={on} aria-controls={`more-${key}`} onClick={() => setOpen(on ? '' : key)}>{on ? t.hide : t.view}</button></td>
                        </tr>
                        {on ? (
                          <tr className="dsr-more" id={`more-${key}`}>
                            <td colSpan={6}>
                              {item.kind === 'service' && item.details ? <p className="dsr-more-p" dir="auto">{item.details}</p> : null}
                              {facts.length ? (
                                <dl className="dsr-facts">
                                  {facts.map((fact) => (
                                    <div key={fact.k}><dt>{fact.k}</dt><dd dir={fact.ltr ? 'ltr' : 'auto'}>{fact.v}</dd></div>
                                  ))}
                                </dl>
                              ) : null}
                              {item.status === 'rejected' && item.rejectionReason ? (
                                <p className="dsr-msg dsr-err" dir="auto"><b>{copy.orderReject}</b> {item.rejectionReason}</p>
                              ) : null}
                              {!body ? <p className="dsr-more-p">{d.noDetails}</p> : null}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* newest requests (the reference's creator offers with accept/reject have no backend; the buttons are omitted) */}
          <section className="card fd" aria-label={t.freshLabel} style={{ borderRadius: '28px', padding: '22px', animationDelay: '.4s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="disp" style={{ margin: '0', fontSize: '20px', fontWeight: '800' }}>{t.fresh}</h2>
              <span style={{ fontSize: '13px', color: '#8A859B' }}>{t.waiting(digits(count('review'), locale))}</span>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!latest.length ? <p style={{ margin: '0', fontSize: '14px', color: '#8A859B' }}>{t.none}</p> : latest.map((item, index) => (
                <div key={`${item.kind}-${item.id}`} style={{ padding: '14px', borderRadius: '18px', background: '#1E1B26', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '42px', height: '42px', borderRadius: '14px', background: OFFER[index % OFFER.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flex: 'none' }}>{(who(item) || item.title).trim().charAt(0)}</span>
                    <div style={{ flex: '1', minWidth: '0' }}><div style={{ fontWeight: '700', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="auto">{item.title}</div><div style={{ fontSize: '13px', color: '#8A859B' }}>{copy.orderKind[item.kind]} · {statusOf(item)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* week */}
          <section className="card fd" aria-label={t.weekLabel} style={{ borderRadius: '28px', padding: '22px', animationDelay: '.5s' }}>
            <h2 className="disp" style={{ margin: '0', fontSize: '20px', fontWeight: '800' }}>{t.week}</h2>
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px', textAlign: 'center' }}>
              {week.map((day) => {
                const now = sameDay(day, today);
                const has = rows.some((item) => sameDay(day, new Date(item.createdAt)));
                return (
                  <div key={day.toISOString()} style={{ padding: '10px 0', borderRadius: '14px', background: now ? 'var(--acc)' : '#1E1B26', color: now ? '#0E0D12' : '#F5F2EA' }}>
                    <div style={{ fontSize: '11px', opacity: '.8' }}>{s.short[day.getDay()]}</div>
                    <div className="disp" style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px' }}>{digits(day.getDate(), locale)}</div>
                    <div style={{ margin: '6px auto 0', width: '6px', height: '6px', borderRadius: '50%', background: has ? (now ? '#0E0D12' : 'var(--acc)') : 'transparent' }}></div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              {!thisWeek.length ? <p style={{ margin: '0', color: '#8A859B' }}>{t.weekNone}</p> : thisWeek.slice(0, 3).map((item, index) => (
                <div key={`${item.kind}-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '4px', height: '36px', borderRadius: '4px', background: index % 2 ? '#46E3C8' : 'var(--acc)', flex: 'none' }}></span><div style={{ minWidth: '0' }}><div style={{ fontWeight: '600' }} dir="auto">{item.title}{who(item) ? ` · ${who(item)}` : ''}</div><div style={{ color: '#8A859B' }}>{s.days[new Date(item.createdAt).getDay()]} · {statusOf(item)}</div></div></div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </RefDashShell>
  );
}
