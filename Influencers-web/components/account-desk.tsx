'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { placeLabel } from '@/lib/names';
import { clearSession, readSession, saveSession, type Session } from '@/lib/session';
import type { CategoryNode, Locale, OwnAccount, Place } from '@/lib/types';
import { DashShell, DashWait } from './dash-shell';
import { Gate, Panel } from './desk';
import { Float, Seg } from './fields';
import { ArrowIcon, Icon } from './icons';
import { Pick } from './pick';
import { TalentEdit } from './talent-edit';

export function AccountDesk({
  locale,
  tree,
  governorates,
  countries,
}: {
  locale: Locale;
  tree: CategoryNode[];
  governorates: Place[];
  countries: Place[];
}) {
  const copy = getCopy(locale);
  const acct = getAccount(locale);
  const dash = getDashboard(locale);
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [account, setAccount] = useState<OwnAccount | null>(null);
  const [scope, setScope] = useState<'inside_iraq' | 'outside_iraq'>('inside_iraq');
  const [govId, setGovId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedSession = readSession();
    if (!savedSession) {
      setSession(null);
      return;
    }
    api<OwnAccount>('/api/v1/me/account', { token: savedSession.token })
      .then((result) => {
        setSession({ token: savedSession.token, user: result.data });
        setAccount(result.data);
        if (result.data.profile?.locationScope) setScope(result.data.profile.locationScope);
        if (result.data.profile?.governorate?.id) setGovId(String(result.data.profile.governorate.id));
        if (result.data.profile?.country?.id) setCountryId(String(result.data.profile.country.id));
      })
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  if (session === undefined) return <DashWait label={copy.loading} />;

  if (!session) {
    return (
      <Gate eyebrow={copy.account} title={copy.accountTitle} deck={getAccount(locale).signInFirst} shot="/scenes/set.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/account`)}`}><span>{copy.enter}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError('');
    setSaved(false);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || '').trim();
    try {
      const body = session.user.role === 'client'
        ? {
            name: text('name'),
            phone: text('phone'),
            password: text('password'),
            brandName: text('brandName'),
            whatsapp: text('whatsapp'),
            contactEmail: text('contactEmail'),
            locationScope: scope,
            governorateId: scope === 'inside_iraq' ? govId : null,
            countryId: scope === 'outside_iraq' ? countryId : null,
          }
        : session.user.role === 'influencer'
          ? {
              name: text('name'),
              password: text('password'),
              whatsapp: text('whatsapp'),
              contactEmail: text('contactEmail'),
            }
          : {
              name: text('name'),
              phone: text('phone'),
              email: text('email'),
              password: text('password'),
            };
      const result = await api<OwnAccount>('/api/v1/me/account', { method: 'PATCH', token: session.token, body });
      setAccount(result.data);
      saveSession(session.token, result.data);
      setSession({ token: session.token, user: result.data });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  function leave() {
    clearSession();
    setSession(null);
    router.push(`/${locale}`);
  }

  const client = session.user.role === 'client';
  const plain = !client;
  if (session.user.role === 'influencer' && account) {
    return (
      <TalentEdit
        locale={locale}
        session={session}
        account={account}
        tree={tree}
        governorates={governorates}
        countries={countries}
        onLeave={leave}
      />
    );
  }

  const status = copy.orderStatus[session.user.status as keyof typeof copy.orderStatus] || (session.user.status === 'approved' ? copy.approved : session.user.status);

  return (
    <DashShell locale={locale} user={session.user} page="account" eyebrow={copy.account} title={copy.accountTitle} deck={copy.accountDeck} onLeave={leave}>
      <div className="ds-split">
        <form className="ds-form" onSubmit={submit}>
          {session.user.status === 'pending' ? <p className="ds-note" role="status">{copy.pendingAccount}</p> : null}
          <Panel index="01" title={copy.joinYouTitle}>
            <Float label={copy.name} name="name" required dir="auto" minLength={2} autoComplete="name" defaultValue={account?.name || ''} />
            {client ? (
              <div className="ds-two">
                <Float label={copy.phone} name="phone" required dir="ltr" inputMode="tel" autoComplete="tel" defaultValue={account?.phone || ''} />
                <Float label={copy.brand} name="brandName" dir="auto" defaultValue={account?.profile?.brandName || ''} />
              </div>
            ) : null}
          </Panel>
          {plain ? (
            <Panel index="02" title={acct.idTitle} deck={acct.idDeck}>
              <div className="ds-two">
                <Float label={copy.phone} name="phone" dir="ltr" inputMode="tel" autoComplete="tel" defaultValue={account?.phone || ''} />
                <Float label={copy.email} name="email" type="email" dir="ltr" autoComplete="email" defaultValue={account?.email || ''} />
              </div>
            </Panel>
          ) : (
            <Panel index="02" title={copy.sectionReach} deck={copy.secondContact}>
              <div className="ds-two">
                <Float label={copy.whatsapp} name="whatsapp" dir="ltr" inputMode="tel" defaultValue={account?.profile?.whatsapp || ''} />
                <Float label={copy.email} name="contactEmail" type="email" dir="ltr" autoComplete="email" defaultValue={account?.profile?.contactEmail || ''} />
              </div>
            </Panel>
          )}
          {client ? (
            <Panel index="03" title={copy.sectionPlace}>
              <Seg value={scope} onChange={setScope} options={[{ value: 'inside_iraq', label: copy.inside }, { value: 'outside_iraq', label: copy.outside }]} />
              {scope === 'inside_iraq' ? (
                <Pick
                  value={govId}
                  onChange={setGovId}
                  placeholder={copy.governorate}
                  required
                  options={governorates.map((item) => ({ value: String(item.id), label: placeLabel(locale, item) }))}
                />
              ) : (
                <Pick
                  value={countryId}
                  onChange={setCountryId}
                  placeholder={copy.country}
                  required
                  options={countries.filter((item) => item.code !== 'IQ').map((item) => ({ value: String(item.id), label: placeLabel(locale, item) }))}
                />
              )}
            </Panel>
          ) : null}
          <Panel index={client ? '04' : '03'} title={copy.password}>
            <Float label={copy.passwordOptional} name="password" type="password" dir="ltr" autoComplete="new-password" />
          </Panel>
          <div className="ds-save">
            <div className="ds-save-msg" aria-live="polite">
              {saved ? <p className="ok-msg" dir="auto"><Icon name="check" size={16} />{copy.saved}</p> : null}
              {error ? <p className="err" dir="auto" role="alert">{error}</p> : null}
            </div>
            <button className="btn btn-acc" type="submit" disabled={saving}><span>{saving ? copy.sending : copy.send}</span><ArrowIcon /></button>
          </div>
        </form>

        <aside className="ds-aside">
          <div className="card ds-sum">
            <span className="ds-ini disp" aria-hidden="true">{(session.user.name || copy.wordmark).trim().charAt(0)}</span>
            <p className="ds-sum-top"><span>{client ? copy.joinAsClient : session.user.role === 'admin' ? dash.roleAdmin : dash.roleUser}</span><b className={`pill ${session.user.status === 'approved' ? 'pill-active' : 'pill-pending'}`}>{status}</b></p>
            <strong className="disp" dir="auto">{session.user.name}</strong>
            <Link href={`/${locale}/orders`} className="btn btn-ghost btn-sm btn-block">{copy.orders}<ArrowIcon size={18} /></Link>
            {session.user.role === 'user' ? (
              <Link href={`/${locale}/join/influencer`} className="btn btn-acc btn-sm btn-block">{acct.becomeCreator}<ArrowIcon size={18} /></Link>
            ) : null}
            {session.user.role === 'admin' ? (
              <Link href={`/${locale}/admin`} className="btn btn-acc btn-sm btn-block">{acct.adminPanel}<ArrowIcon size={18} /></Link>
            ) : null}
          </div>
        </aside>
      </div>
    </DashShell>
  );
}
