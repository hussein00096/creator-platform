'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAdmin } from '@/lib/copy-admin';
import { getCopy } from '@/lib/copy';
import { AdminDrawer, AdminHead, AdminWait, ContactCell, Facts, Pager, errText, requestTone, stamp, useAdmin, type AdminRequest } from './admin-shell';
import { ArrowIcon } from './icons';
import { SegControl } from './ui-client';

type Status = 'all' | 'pending' | 'reviewing' | 'confirmed' | 'closed' | 'rejected';
type Kind = 'all' | 'ugc' | 'service';
type Next = 'reviewing' | 'confirmed' | 'closed' | 'rejected';

const STATUSES: Status[] = ['all', 'pending', 'reviewing', 'confirmed', 'closed', 'rejected'];
const KINDS: Kind[] = ['all', 'ugc', 'service'];
const NEXT: Next[] = ['reviewing', 'confirmed', 'closed', 'rejected'];
const LIMIT = 20;

function pick<T extends string>(value: string | null, list: T[], fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}

const keyOf = (item: AdminRequest) => `${item.kind}-${item.id}`;

/** Requests review: status / kind filters, table and a detail drawer with the status control. */
export function AdminRequests() {
  const { locale, token, refreshStats } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>(() => pick(params.get('status'), STATUSES, 'all'));
  const [kind, setKind] = useState<Kind>(() => pick(params.get('kind'), KINDS, 'all'));
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminRequest[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [openKey, setOpenKey] = useState<string>(() => params.get('open') || '');
  const [current, setCurrent] = useState<AdminRequest | null>(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status !== 'all') qs.set('status', status);
    if (kind !== 'all') qs.set('kind', kind);
    api<AdminRequest[]>(`/api/v1/admin/requests?${qs}`, { token })
      .then((result) => {
        setRows(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setError('');
      })
      .catch((err) => setError(errText(err, copy.offline)));
  }, [token, status, kind, page, copy.offline]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openKey || current || !rows) return;
    const found = rows.find((item) => keyOf(item) === openKey);
    if (found) setCurrent(found);
  }, [openKey, current, rows]);

  useEffect(() => {
    const qs = new URLSearchParams({ status });
    if (kind !== 'all') qs.set('kind', kind);
    window.history.replaceState(null, '', `${window.location.pathname}?${qs}`);
  }, [status, kind]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const label = (value: string) => copy.orderStatus[value as keyof typeof copy.orderStatus] || value;

  function close() {
    setCurrent(null);
    setOpenKey('');
  }

  return (
    <>
      <AdminHead eyebrow={<>{t.navRequests} — <span dir="ltr">{String(total).padStart(2, '0')}</span></>} title={t.requestsTitle} deck={t.requestsDeck} />

      <section className="card ds-panel">
        <div className="ad-filters">
          <div className="ad-chips" role="group" aria-label={t.kindFilter}>
            {KINDS.map((value) => (
              <button
                key={value}
                type="button"
                className={`chip chip-sm${kind === value ? ' on' : ''}`}
                aria-pressed={kind === value}
                onClick={() => { setKind(value); setPage(1); }}
              >
                {value === 'all' ? t.all : t.kinds[value]}
              </button>
            ))}
          </div>
          <SegControl<Status>
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            label={t.statusFilter}
            options={STATUSES.map((value) => ({ value, label: value === 'all' ? t.all : label(value) }))}
          />
        </div>

        {error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : null}

        {rows === null ? (
          <AdminWait label={copy.loading} />
        ) : !rows.length ? (
          <p className="ds-none">{t.noRequests}</p>
        ) : (
          <div className="tbl-w">
            <table className="tbl ds-tbl ad-tbl">
              <thead>
                <tr>
                  <th scope="col">{t.colTitle}</th>
                  <th scope="col">{t.colKind}</th>
                  <th scope="col">{t.colRequester}</th>
                  <th scope="col">{t.colDate}</th>
                  <th scope="col">{t.colStatus}</th>
                  <th scope="col"><span className="sr-only">{t.colAction}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={keyOf(item)} className={current && keyOf(current) === keyOf(item) ? 'is-on' : undefined}>
                    <td><strong className="ds-row-t" dir="auto">{item.title}</strong></td>
                    <td className="ad-nowrap">{t.kinds[item.kind]}</td>
                    <td>
                      <span className="ad-who">
                        <b dir="auto">{item.requester.name}</b>
                        <small>{t.roles[item.requester.role] || item.requester.role}</small>
                        <ContactCell phone={item.requester.phone} email={item.requester.email} />
                      </span>
                    </td>
                    <td className="ds-when">{stamp(locale, item.createdAt)}</td>
                    <td><span className={`pill ${requestTone[item.status] || 'pill-done'}`}>{label(item.status)}</span></td>
                    <td className="ds-tog">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOpenKey(keyOf(item)); setCurrent(item); }} aria-label={`${t.open}: ${item.title}`}>
                        {t.open}<ArrowIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="ad-foot">
          <span className="ad-dim">{t.total(total)}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </section>

      {current ? (
        <RequestDetail
          key={keyOf(current)}
          item={current}
          onClose={close}
          onChanged={(next) => { setCurrent(next); load(); refreshStats(); }}
        />
      ) : null}
    </>
  );
}

function RequestDetail({ item, onClose, onChanged }: { item: AdminRequest; onClose: () => void; onChanged: (item: AdminRequest) => void }) {
  const { locale, token } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const [next, setNext] = useState<Next | ''>('');
  const [reason, setReason] = useState(item.rejectionReason || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const label = (value: string) => copy.orderStatus[value as keyof typeof copy.orderStatus] || value;
  const who = item.requester;
  const ugc = item.kind === 'ugc';

  async function save() {
    if (!next) return;
    if (next === 'rejected' && !reason.trim()) {
      setError(t.needReason);
      return;
    }
    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await api<AdminRequest>(`/api/v1/admin/requests/${item.kind}/${item.id}`, {
        method: 'PATCH',
        token,
        body: { status: next, ...(next === 'rejected' ? { rejectionReason: reason.trim() } : {}) },
      });
      setNext('');
      setNote(t.updated);
      onChanged(result.data);
    } catch (err) {
      setError(errText(err, copy.offline));
    } finally {
      setBusy(false);
    }
  }

  const faces = item.faces.length ? (
    <span className="ad-links">
      {item.faces.map((face) => (
        <Link key={face.id} href={`/${locale}/talent/${face.id}`} target="_blank" dir="auto">{face.name}</Link>
      ))}
    </span>
  ) : null;

  return (
    <AdminDrawer
      label={t.requestDetail}
      onClose={onClose}
      title={
        <>
          <span className="eyebrow">{t.kinds[item.kind]} · <span dir="ltr">#{item.id}</span></span>
          <h2 className="ad-drawer-h" dir="auto">{item.title}</h2>
        </>
      }
    >
      <div className="ad-status-row">
        <span className={`pill ${requestTone[item.status] || 'pill-done'}`}>{label(item.status)}</span>
        <span className="ad-dim">{copy.orderWhen} {stamp(locale, item.createdAt)}</span>
        {item.updatedAt !== item.createdAt ? <span className="ad-dim">{t.updatedAt} {stamp(locale, item.updatedAt)}</span> : null}
      </div>
      {item.status === 'rejected' && item.rejectionReason ? <p className="ds-reject" dir="auto"><b>{copy.orderReject}</b> {item.rejectionReason}</p> : null}

      <section className="ad-sec">
        <h3 className="ad-sec-h">{t.requester}</h3>
        <Facts
          rows={[
            { k: copy.name, v: who.name },
            { k: t.colRole, v: t.roles[who.role] || who.role },
            who.phone ? { k: t.phone, v: <a href={`tel:${who.phone}`}>{who.phone}</a>, ltr: true } : null,
            who.email ? { k: t.email, v: <a href={`mailto:${who.email}`}>{who.email}</a>, ltr: true } : null,
          ]}
        />
      </section>

      <section className="ad-sec">
        <h3 className="ad-sec-h">{t.details}</h3>
        {!ugc && item.details ? <p className="ad-bio" dir="auto">{item.details}</p> : null}
        <Facts
          rows={[
            ugc && item.productDescription ? { k: copy.product, v: item.productDescription, wide: true } : null,
            ugc && item.executionDetails ? { k: copy.execution, v: item.executionDetails, wide: true } : null,
            ugc && item.usagePlace ? { k: copy.usage, v: item.usagePlace } : null,
            ugc && item.quantity ? { k: copy.quantity, v: String(item.quantity), ltr: true } : null,
            faces ? { k: ugc ? t.faces : t.bookedFace, v: faces } : null,
            item.guests.length
              ? {
                  k: t.guests,
                  wide: true,
                  v: (
                    <ul className="ad-guests">
                      {item.guests.map((guest, index) => (
                        <li key={`${guest.name}-${index}`}><b>{guest.name}</b>{guest.note ? <span> — {guest.note}</span> : null}</li>
                      ))}
                    </ul>
                  ),
                }
              : null,
          ]}
        />
      </section>

      <section className="ad-sec ad-decide">
        <h3 className="ad-sec-h">{t.changeStatus}</h3>
        <div className="ad-chips" role="radiogroup" aria-label={t.changeStatus}>
          {NEXT.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={next === value}
              className={`chip chip-sm${next === value ? ' on' : ''}`}
              disabled={item.status === value}
              onClick={() => { setNext(value); setError(''); setNote(''); }}
            >
              {label(value)}
            </button>
          ))}
        </div>
        {next === 'rejected' ? (
          <div className="fld">
            <label className="lbl" htmlFor="ad-reject">{t.reasonRequired}</label>
            <textarea id="ad-reject" className="inp ad-area-in" rows={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} dir="auto" required aria-invalid={error === t.needReason || undefined} />
            <small>{t.reasonHint}</small>
          </div>
        ) : null}
        {next ? (
          <div className="ad-acts">
            <button type="button" className="btn btn-acc btn-sm" disabled={busy} onClick={save}>{busy ? t.saving : t.setStatus}</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setNext(''); setError(''); }}>{t.cancel}</button>
          </div>
        ) : null}
        {error ? <p className="err" dir="auto" role="alert">{error}</p> : null}
        {note ? <p className="ok-msg" role="status">{note}</p> : null}
      </section>
    </AdminDrawer>
  );
}
