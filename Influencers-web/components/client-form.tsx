'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { deco } from '@/lib/people';
import { placeLabel } from '@/lib/names';
import type { Locale, Place } from '@/lib/types';
import { AuthSection, AuthShell } from './auth-shell';
import { Gate } from './desk';
import { Float, Seg } from './fields';
import { ArrowIcon } from './icons';
import { Pick } from './pick';


export function ClientForm({
  locale,
  governorates,
  countries,
}: {
  locale: Locale;
  governorates: Place[];
  countries: Place[];
}) {
  const copy = getCopy(locale);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState<'inside_iraq' | 'outside_iraq'>('inside_iraq');
  const [govId, setGovId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [brand, setBrand] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (scope === 'inside_iraq' && !govId) {
      setError(copy.governorate);
      return;
    }
    if (scope === 'outside_iraq' && !countryId) {
      setError(copy.country);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api('/api/v1/auth/register/client', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone,
          password,
          brandName: brand.trim(),
          whatsapp,
          contactEmail: email,
          locationScope: scope,
          governorateId: scope === 'inside_iraq' ? govId : null,
          countryId: scope === 'outside_iraq' ? countryId : null,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Gate eyebrow={copy.joinClient} title={copy.pendingAccount} deck={copy.joinAsClientDeck} shot="/scenes/campaign.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}`}><span>{copy.back}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  return (
    <AuthShell locale={locale} mode="client">
      <form className="au-form" onSubmit={submit}>
        <AuthSection index={deco(1, locale)} title={copy.joinYouTitle} deck={copy.joinPhoneHint}>
          <Float label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
          <div className="au-two">
            <Float label={copy.phone} value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" required inputMode="tel" autoComplete="tel" />
            <Float label={copy.password} value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} dir="ltr" autoComplete="new-password" />
          </div>
          <Float label={copy.brand} value={brand} onChange={(event) => setBrand(event.target.value)} dir="auto" />
        </AuthSection>
        <AuthSection index={deco(2, locale)} title={copy.sectionReach} deck={copy.secondContact}>
          <div className="au-two">
            <Float label={copy.whatsapp} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} dir="ltr" inputMode="tel" />
            <Float label={copy.email} value={email} onChange={(event) => setEmail(event.target.value)} type="email" dir="ltr" autoComplete="email" />
          </div>
        </AuthSection>
        <AuthSection index={deco(3, locale)} title={copy.joinPlaceTitle}>
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
        </AuthSection>
        {error ? <p className="err au-err" role="alert" dir="auto">{error}</p> : null}
        <button className="btn btn-acc btn-block" type="submit" disabled={saving}><span>{saving ? copy.sending : copy.joinSend}</span><ArrowIcon /></button>
      </form>
    </AuthShell>
  );
}
