'use client';

// /account in the ported dashboard shell (design/reference/dashboard.html). The forms, PATCH bodies,
// session refresh and gating are the existing AccountDesk logic (components/account-desk.tsx);
// fields use the reference form classes (.lbl/.inp/.seg).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { DashWait } from '@/components/dash-shell';
import { Gate } from '@/components/desk';
import { ArrowIcon } from '@/components/icons';
import { DashCard, RefDashShell } from '@/components/ref/dash-shell';
import { Field, Note, SaveBar, SegRow, Select, SummaryCard, Two } from '@/components/ref/dash-ui';
import { RefTalentEdit } from '@/components/ref/dash-talent';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { placeLabel } from '@/lib/names';
import { clearSession, readSession, saveSession, type Session } from '@/lib/session';
import type { CategoryNode, Locale, OwnAccount, Place } from '@/lib/types';

export function RefAccount({
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
      <RefTalentEdit
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
    <RefDashShell locale={locale} user={session.user} page="account" onLeave={leave}>
      <div className="split" style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '0' }}>
          {session.user.status === 'pending' ? <Note>{copy.pendingAccount}</Note> : null}
          <DashCard title={copy.joinYouTitle} deck={copy.accountDeck} delay={0.2}>
            <Field label={copy.name} name="name" required dir="auto" minLength={2} autoComplete="name" defaultValue={account?.name || ''} />
            {client ? (
              <Two>
                <Field label={copy.phone} name="phone" required dir="ltr" inputMode="tel" autoComplete="tel" defaultValue={account?.phone || ''} />
                <Field label={copy.brand} name="brandName" dir="auto" defaultValue={account?.profile?.brandName || ''} />
              </Two>
            ) : null}
          </DashCard>
          {plain ? (
            <DashCard title={acct.idTitle} deck={acct.idDeck} delay={0.3}>
              <Two>
                <Field label={copy.phone} name="phone" dir="ltr" inputMode="tel" autoComplete="tel" defaultValue={account?.phone || ''} />
                <Field label={copy.email} name="email" type="email" dir="ltr" autoComplete="email" defaultValue={account?.email || ''} />
              </Two>
            </DashCard>
          ) : (
            <DashCard title={copy.sectionReach} deck={copy.secondContact} delay={0.3}>
              <Two>
                <Field label={copy.whatsapp} name="whatsapp" dir="ltr" inputMode="tel" defaultValue={account?.profile?.whatsapp || ''} />
                <Field label={copy.email} name="contactEmail" type="email" dir="ltr" autoComplete="email" defaultValue={account?.profile?.contactEmail || ''} />
              </Two>
            </DashCard>
          )}
          {client ? (
            <DashCard title={copy.sectionPlace} delay={0.35}>
              <SegRow value={scope} onChange={setScope} options={[{ value: 'inside_iraq', label: copy.inside }, { value: 'outside_iraq', label: copy.outside }]} />
              {scope === 'inside_iraq' ? (
                <Select
                  label={copy.governorate}
                  value={govId}
                  onChange={setGovId}
                  placeholder={copy.governorate}
                  required
                  options={governorates.map((item) => ({ value: String(item.id), label: placeLabel(locale, item) }))}
                />
              ) : (
                <Select
                  label={copy.country}
                  value={countryId}
                  onChange={setCountryId}
                  placeholder={copy.country}
                  required
                  options={countries.filter((item) => item.code !== 'IQ').map((item) => ({ value: String(item.id), label: placeLabel(locale, item) }))}
                />
              )}
            </DashCard>
          ) : null}
          <DashCard title={copy.password} delay={0.4}>
            <Field label={copy.passwordOptional} name="password" type="password" dir="ltr" autoComplete="new-password" />
          </DashCard>
          <SaveBar saved={saved} error={error} saving={saving} savedLabel={copy.saved} sendLabel={copy.send} sendingLabel={copy.sending} />
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SummaryCard
            initial={(session.user.name || copy.wordmark).trim().charAt(0)}
            kicker={client ? copy.joinAsClient : session.user.role === 'admin' ? dash.roleAdmin : dash.roleUser}
            status={status}
            tone={session.user.status === 'approved' ? 'ok' : 'wait'}
            name={session.user.name}
          >
            <Link href={`/${locale}/orders`} className="btn btn-ghost btn-sm">{copy.orders}</Link>
            {session.user.role === 'user' ? <Link href={`/${locale}/join/influencer`} className="btn btn-acc btn-sm">{acct.becomeCreator}</Link> : null}
            {session.user.role === 'admin' ? <Link href={`/${locale}/admin`} className="btn btn-acc btn-sm">{acct.adminPanel}</Link> : null}
          </SummaryCard>
        </div>
      </div>
    </RefDashShell>
  );
}
