'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAdmin } from '@/lib/copy-admin';
import { getCopy } from '@/lib/copy';
import { categoryLabel, languageLabel, placeLabel, socialHref } from '@/lib/names';
import {
  AdminDrawer,
  AdminHead,
  AdminWait,
  ContactCell,
  Facts,
  Pager,
  accountTone,
  errText,
  stamp,
  useAdmin,
  type AdminAccount,
  type AdminAccountRow,
} from './admin-shell';
import { ArrowIcon, Icon } from './icons';
import { SegControl } from './ui-client';

type Role = 'all' | 'user' | 'client' | 'influencer';
type Status = 'pending' | 'approved' | 'rejected' | 'suspended' | 'all';

const ROLES: Role[] = ['all', 'user', 'client', 'influencer'];
const STATUSES: Status[] = ['pending', 'approved', 'rejected', 'suspended', 'all'];
const LIMIT = 20;

function pick<T extends string>(value: string | null, list: T[], fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}

/** Accounts review: filters, search, paginated table and a detail drawer with status actions. */
export function AdminAccounts() {
  const { locale, token, refreshStats } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(() => pick(params.get('role'), ROLES, 'all'));
  const [status, setStatus] = useState<Status>(() => pick(params.get('status'), STATUSES, 'pending'));
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminAccountRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(() => Number(params.get('open')) || null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (role !== 'all') qs.set('role', role);
    if (status !== 'all') qs.set('status', status);
    if (search) qs.set('search', search);
    api<AdminAccountRow[]>(`/api/v1/admin/accounts?${qs}`, { token })
      .then((result) => {
        setRows(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setError('');
      })
      .catch((err) => setError(errText(err, copy.offline)));
  }, [token, role, status, search, page, copy.offline]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (role !== 'all') qs.set('role', role);
    qs.set('status', status);
    window.history.replaceState(null, '', `${window.location.pathname}?${qs}`);
  }, [role, status]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <AdminHead eyebrow={<>{t.navAccounts} — <span dir="ltr">{String(total).padStart(2, '0')}</span></>} title={t.accountsTitle} deck={t.accountsDeck} />

      <section className="card ds-panel">
        <div className="ad-filters">
          <div className="ad-chips" role="group" aria-label={t.roleFilter}>
            {ROLES.map((value) => (
              <button
                key={value}
                type="button"
                className={`chip chip-sm${role === value ? ' on' : ''}`}
                aria-pressed={role === value}
                onClick={() => { setRole(value); setPage(1); }}
              >
                {value === 'all' ? t.all : t.roles[value]}
              </button>
            ))}
          </div>
          <SegControl<Status>
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            label={t.statusFilter}
            options={STATUSES.map((value) => ({ value, label: value === 'all' ? t.all : t.statuses[value] }))}
          />
          <label className="ad-search">
            <span className="sr-only">{t.searchLabel}</span>
            <Icon name="search" size={18} />
            <input
              type="search"
              className="inp"
              placeholder={t.search}
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            />
          </label>
        </div>

        {error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : null}

        {rows === null ? (
          <AdminWait label={copy.loading} />
        ) : !rows.length ? (
          <p className="ds-none">{t.noAccounts}</p>
        ) : (
          <div className="tbl-w">
            <table className="tbl ds-tbl ad-tbl">
              <thead>
                <tr>
                  <th scope="col">{t.colName}</th>
                  <th scope="col">{t.colRole}</th>
                  <th scope="col">{t.colContact}</th>
                  <th scope="col">{t.colBrand}</th>
                  <th scope="col">{t.colCreated}</th>
                  <th scope="col">{t.colStatus}</th>
                  <th scope="col"><span className="sr-only">{t.colAction}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={openId === row.id ? 'is-on' : undefined}>
                    <td><strong className="ds-row-t" dir="auto">{row.name}</strong></td>
                    <td className="ad-nowrap">{t.roles[row.role] || row.role}</td>
                    <td><ContactCell phone={row.phone} email={row.email} /></td>
                    <td>{row.brandName ? <span dir="auto">{row.brandName}</span> : <span className="ad-dim">—</span>}</td>
                    <td className="ds-when">{stamp(locale, row.createdAt)}</td>
                    <td><span className={`pill ${accountTone[row.status] || 'pill-done'}`}>{t.statuses[row.status] || row.status}</span></td>
                    <td className="ds-tog">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenId(row.id)} aria-label={`${t.open}: ${row.name}`}>
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

      {openId ? (
        <AccountDetail
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => { load(); refreshStats(); }}
        />
      ) : null}
    </>
  );
}

type Action = 'approved' | 'rejected' | 'suspended' | 'pending';

function AccountDetail({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const { locale, token } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<AdminAccount>(`/api/v1/admin/accounts/${id}`, { token })
      .then((result) => setAccount(result.data))
      .catch((err) => setError(errText(err, copy.offline)));
  }, [id, token, copy.offline]);

  useEffect(() => {
    setAccount(null);
    setError('');
    setNote('');
    setAsking(null);
    load();
  }, [load]);

  async function apply(next: Action, why?: string) {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await api(`/api/v1/admin/accounts/${id}/status`, { method: 'PATCH', token, body: { status: next, reason: why?.trim() || undefined } });
      setAsking(null);
      setReason('');
      setNote(t.updated);
      load();
      onChanged();
    } catch (err) {
      setError(errText(err, copy.offline));
    } finally {
      setBusy(false);
    }
  }

  const p = account?.profile || null;
  const creator = account?.role === 'influencer';
  const company = account?.role === 'client';
  const where = p?.locationScope
    ? `${p.locationScope === 'inside_iraq' ? copy.inside : copy.outside}${p.governorate || p.country ? ` · ${placeLabel(locale, p.governorate || p.country)}` : ''}`
    : '';
  const map = (table: Record<string, string>, value?: string | null) => (value ? table[value] || value : '');
  const photos = [
    p?.avatar ? { src: p.avatar, label: t.avatar } : null,
    p?.cover ? { src: p.cover, label: t.cover } : null,
    ...(p?.portfolio || []).map((shot) => ({ src: shot.filePath, label: '' })),
  ].filter(Boolean) as { src: string; label: string }[];

  const actions: { value: Action; label: string; cls: string }[] = account
    ? ([
        account.status !== 'approved' ? { value: 'approved', label: t.approve, cls: 'btn-acc' } : null,
        account.status !== 'rejected' ? { value: 'rejected', label: t.reject, cls: 'btn-ghost ad-bad' } : null,
        account.status !== 'suspended' ? { value: 'suspended', label: t.suspend, cls: 'btn-ghost' } : null,
        account.status !== 'pending' ? { value: 'pending', label: t.reopen, cls: 'btn-ghost' } : null,
      ].filter(Boolean) as { value: Action; label: string; cls: string }[])
    : [];

  return (
    <AdminDrawer
      label={t.detail}
      onClose={onClose}
      title={
        <>
          <span className="eyebrow">{account ? t.roles[account.role] || account.role : t.detail}</span>
          <h2 className="ad-drawer-h" dir="auto">{account ? (company && p?.brandName) || account.name : '…'}</h2>
        </>
      }
    >
      {!account ? (
        error ? <p className="err" dir="auto" role="alert">{error}</p> : <AdminWait label={t.loadingDetail} />
      ) : (
        <>
          <div className="ad-status-row">
            <span className={`pill ${accountTone[account.status] || 'pill-done'}`}>{t.statuses[account.status] || account.status}</span>
            <span className="ad-dim">{t.created} {stamp(locale, account.createdAt)}</span>
            {creator && account.status === 'approved' ? (
              <Link href={`/${locale}/talent/${account.id}`} className="lnk ad-more" target="_blank">{t.publicProfile}<ArrowIcon size={16} /></Link>
            ) : null}
          </div>
          {account.statusReason ? <p className="ds-reject" dir="auto"><b>{t.currentReason}</b> {account.statusReason}</p> : null}

          {creator && photos.length ? (
            <section className="ad-sec">
              <h3 className="ad-sec-h">{t.sectionWork}</h3>
              <div className="ad-shots">
                {photos.map((shot, index) => (
                  <a key={`${shot.src}-${index}`} href={shot.src} target="_blank" rel="noreferrer" className="ad-shot">
                    <img src={shot.src} alt={shot.label || `${account.name} ${index + 1}`} loading="lazy" />
                    {shot.label ? <span>{shot.label}</span> : null}
                  </a>
                ))}
              </div>
            </section>
          ) : creator ? <p className="ad-dim">{t.noPhotos}</p> : null}

          <section className="ad-sec">
            <h3 className="ad-sec-h">{t.sectionContact}</h3>
            <Facts
              rows={[
                { k: copy.name, v: account.name },
                account.phone ? { k: t.phone, v: <a href={`tel:${account.phone}`}>{account.phone}</a>, ltr: true } : null,
                account.email ? { k: t.email, v: <a href={`mailto:${account.email}`}>{account.email}</a>, ltr: true } : null,
                p?.whatsapp ? { k: t.whatsapp, v: <a href={`https://wa.me/${p.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">{p.whatsapp}</a>, ltr: true } : null,
                p?.contactEmail ? { k: t.contactEmail, v: <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>, ltr: true } : null,
              ]}
            />
          </section>

          {company ? (
            <section className="ad-sec">
              <h3 className="ad-sec-h">{t.sectionCompany}</h3>
              {p ? <Facts rows={[{ k: t.brand, v: p.brandName || '—' }, where ? { k: t.place, v: where } : null]} /> : <p className="ad-dim">{t.noProfile}</p>}
            </section>
          ) : null}

          {creator ? (
            p ? (
              <>
                <section className="ad-sec">
                  <h3 className="ad-sec-h">{t.sectionProfile}</h3>
                  {p.categories?.length ? (
                    <div className="ad-tags">
                      {p.categories.map((item) => <span key={item.id} className="tag-l">{categoryLabel(locale, item)}</span>)}
                    </div>
                  ) : null}
                  {p.bio ? <p className="ad-bio" dir="auto">{p.bio}</p> : null}
                  <Facts
                    rows={[
                      where ? { k: t.place, v: where } : null,
                      p.experienceYears != null ? { k: t.experience, v: String(p.experienceYears), ltr: true } : null,
                      p.languages?.length ? { k: t.languages, v: p.languages.map((item) => languageLabel(locale, item)).join(' · ') } : null,
                      p.availability ? { k: t.availability, v: map(t.availabilityMap, p.availability) } : null,
                    ]}
                  />
                </section>
                <section className="ad-sec">
                  <h3 className="ad-sec-h">{t.sectionLook}</h3>
                  <Facts
                    rows={[
                      p.gender ? { k: copy.gender, v: map(copy.genderMap, p.gender) } : null,
                      p.birthDate ? { k: t.birth, v: stamp(locale, p.birthDate) } : null,
                      p.heightCm ? { k: copy.height, v: `${p.heightCm} ${copy.cm}` } : null,
                      p.weightKg ? { k: copy.weight, v: `${p.weightKg} ${copy.kg}` } : null,
                      p.skinTone ? { k: copy.skin, v: map(copy.skinMap, p.skinTone) } : null,
                      p.hairColor ? { k: copy.hair, v: map(copy.hairMap, p.hairColor) } : null,
                      p.eyeColor ? { k: copy.eyes, v: map(copy.eyeMap, p.eyeColor) } : null,
                      p.hijab ? { k: copy.hijab, v: map(copy.hijabMap, p.hijab) } : null,
                    ]}
                  />
                </section>
                {p.socialAccounts?.length ? (
                  <section className="ad-sec">
                    <h3 className="ad-sec-h">{t.sectionSocial}</h3>
                    <ul className="ad-socials">
                      {p.socialAccounts.map((item) => (
                        <li key={`${item.platform}-${item.handle}`}>
                          <span>{copy.platforms[item.platform as keyof typeof copy.platforms] || item.platform}</span>
                          <a href={socialHref(item.platform, item.handle)} target="_blank" rel="noreferrer" dir="ltr">{item.handle}</a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            ) : <p className="ad-dim">{t.noProfile}</p>
          ) : null}

          <section className="ad-sec ad-decide">
            <h3 className="ad-sec-h">{t.sectionDecision}</h3>
            {asking ? (
              <div className="fld">
                <label className="lbl" htmlFor="ad-reason">{t.reasonOptional}</label>
                <textarea id="ad-reason" className="inp ad-area-in" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} dir="auto" />
                <div className="ad-acts">
                  <button type="button" className={`btn btn-sm ${asking === 'rejected' ? 'btn-acc' : 'btn-cream'}`} disabled={busy} onClick={() => apply(asking, reason)}>
                    {busy ? t.saving : `${t.confirm}: ${asking === 'rejected' ? t.reject : t.suspend}`}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setAsking(null); setReason(''); }}>{t.cancel}</button>
                </div>
              </div>
            ) : (
              <div className="ad-acts">
                {actions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`btn btn-sm ${item.cls}`}
                    disabled={busy}
                    onClick={() => (item.value === 'rejected' || item.value === 'suspended' ? setAsking(item.value) : apply(item.value))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            {error ? <p className="err" dir="auto" role="alert">{error}</p> : null}
            {note ? <p className="ok-msg" role="status">{note}</p> : null}
          </section>
        </>
      )}
    </AdminDrawer>
  );
}
