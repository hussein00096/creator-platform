'use client';

// Creator /account form in the ported dashboard shell. State, validation and the PATCH body are the
// existing TalentEdit logic (components/talent-edit.tsx); fields use the reference form classes.
import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { DashCard, RefDashShell } from '@/components/ref/dash-shell';
import { Area, Field, Note, SaveBar, SegRow, Select, SummaryCard, Swatch, Two } from '@/components/ref/dash-ui';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { adultDate, isAdult, selectionNeedsLook } from '@/lib/look';
import { categoryLabel, languageOptions, placeLabel } from '@/lib/names';
import { doorShot } from '@/lib/scenes';
import { saveSession, type Session } from '@/lib/session';
import type { Availability, CategoryNode, Locale, OwnAccount, Place } from '@/lib/types';

const platforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat', 'x'] as const;
const skins = [
  { id: 'fair', tone: '#f3e0c8' },
  { id: 'medium', tone: '#e0b892' },
  { id: 'olive', tone: '#c4a06a' },
  { id: 'brown', tone: '#8d6239' },
  { id: 'dark', tone: '#4a2e1c' },
] as const;
const hairs = [
  { id: 'black', tone: '#1a1410' },
  { id: 'brown', tone: '#5c3a22' },
  { id: 'blonde', tone: '#d4b46a' },
  { id: 'red', tone: '#a33b28' },
  { id: 'gray', tone: '#9a958c' },
  { id: 'colored', tone: '#7c3aed' },
] as const;
const eyes = [
  { id: 'brown', tone: '#6b3f24' },
  { id: 'black', tone: '#1c1a18' },
  { id: 'hazel', tone: '#8a6a32' },
  { id: 'green', tone: '#3f6b45' },
  { id: 'blue', tone: '#3d5c8a' },
  { id: 'gray', tone: '#7a7e86' },
] as const;

function parentOf(tree: CategoryNode[], ids: number[]) {
  const picked = new Set(ids);
  return tree.find((item) => (item.children || []).some((child) => picked.has(child.id)))?.id || tree[0]?.id || null;
}

export function RefTalentEdit({
  locale,
  session,
  account,
  tree,
  governorates,
  countries,
  onLeave,
}: {
  locale: Locale;
  session: Session;
  account: OwnAccount;
  tree: CategoryNode[];
  governorates: Place[];
  countries: Place[];
  onLeave: () => void;
}) {
  const copy = getCopy(locale);
  const profile = account.profile;
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(account.name);
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>(profile?.gender === 'male' ? 'male' : 'female');
  const [birth, setBirth] = useState(String(profile?.birthDate || '').slice(0, 10));
  const [height, setHeight] = useState(profile?.heightCm != null ? String(profile.heightCm) : '');
  const [weight, setWeight] = useState(profile?.weightKg != null ? String(profile.weightKg) : '');
  const [skin, setSkin] = useState(profile?.skinTone || '');
  const [hair, setHair] = useState(profile?.hairColor || '');
  const [eye, setEye] = useState(profile?.eyeColor || '');
  const [hijab, setHijab] = useState(profile?.hijab && profile.hijab !== 'not_applicable' ? profile.hijab : '');
  const [years, setYears] = useState(String(profile?.experienceYears ?? 0));
  const [bio, setBio] = useState(profile?.bio || '');
  const [scope, setScope] = useState<'inside_iraq' | 'outside_iraq'>(profile?.locationScope || 'inside_iraq');
  const [governorateId, setGovernorateId] = useState(profile?.governorate?.id ? String(profile.governorate.id) : '');
  const [countryId, setCountryId] = useState(profile?.country?.code === 'IQ' ? '' : profile?.country?.id ? String(profile.country.id) : '');
  const [languages, setLanguages] = useState<string[]>(profile?.languages?.length ? profile.languages : ['العربية']);
  const [categoryIds, setCategoryIds] = useState<number[]>((profile?.categories || []).map((item) => item.id));
  const [group, setGroup] = useState<number | null>(parentOf(tree, (profile?.categories || []).map((item) => item.id)));
  const [socials, setSocials] = useState<{ platform: string; handle: string }[]>(
    profile?.socialAccounts?.length
      ? profile.socialAccounts.map((item) => ({ platform: item.platform, handle: item.handle }))
      : [{ platform: 'instagram', handle: '' }],
  );
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [contactEmail, setContactEmail] = useState(profile?.contactEmail || '');
  const [availability, setAvailability] = useState<Availability>(profile?.availability || 'active');

  const needsLook = selectionNeedsLook(tree, categoryIds);
  const showHijab = needsLook && gender === 'female';
  const showHair = needsLook && (gender === 'male' || hijab === 'no');
  const parent = tree.find((item) => item.id === group);

  const workStates = useMemo(
    () => (['active', 'busy', 'paused'] as const).map((value) => ({ value, label: copy.workStateMap[value] })),
    [copy.workStateMap],
  );

  function toggleCategory(id: number) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleLanguage(value: string) {
    setLanguages((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function validate() {
    if (name.trim().length < 2) return copy.name;
    if (!isAdult(birth)) return copy.joinAdult;
    if (!categoryIds.length) return copy.joinNeedSpecialty;
    if (needsLook && (!height || !weight || !skin || !eye)) return copy.joinNeedLook;
    if (showHijab && !hijab) return copy.joinNeedHijab;
    if (showHair && !hair) return copy.joinNeedHair;
    if (!languages.length) return copy.joinNeedLanguage;
    if (bio.trim().length < 20) return copy.joinBioHint;
    if (!socials.some((item) => item.handle.trim())) return copy.joinNeedSocial;
    if (scope === 'inside_iraq' && !governorateId) return copy.governorate;
    if (scope === 'outside_iraq' && !countryId) return copy.country;
    return '';
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const hint = validate();
    if (hint) {
      setError(hint);
      return;
    }
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const result = await api<OwnAccount>('/api/v1/me/account', {
        method: 'PATCH',
        token: session.token,
        body: {
          name: name.trim(),
          password: password || undefined,
          gender,
          birthDate: birth,
          heightCm: needsLook ? height : null,
          weightKg: needsLook ? weight : null,
          skinTone: needsLook ? skin : null,
          hairColor: showHair ? hair : null,
          eyeColor: needsLook ? eye : null,
          hijab: gender === 'male' ? 'not_applicable' : hijab || null,
          experienceYears: years || 0,
          languages,
          bio: bio.trim(),
          locationScope: scope,
          governorateId: scope === 'inside_iraq' ? governorateId : null,
          countryId: scope === 'outside_iraq' ? countryId : null,
          categoryIds,
          socialAccounts: socials.filter((item) => item.handle.trim()),
          whatsapp,
          contactEmail,
          availability,
        },
      });
      saveSession(session.token, result.data);
      setPassword('');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RefDashShell locale={locale} user={session.user} page="account" onLeave={onLeave}>
      <div className="split" style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '0' }}>
          {session.user.status === 'pending' ? <Note>{copy.pendingAccount}</Note> : null}
          <DashCard title={copy.workState} deck={copy.workStateDeck} delay={0.2}>
            <SegRow value={availability} onChange={setAvailability} options={workStates} />
          </DashCard>

          <DashCard title={copy.joinYouTitle} deck={copy.joinPhoneHint} delay={0.25}>
            <Field label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
            <Field label={copy.phone} value={account.phone || ''} dir="ltr" disabled readOnly />
            <SegRow label={copy.gender} value={gender} onChange={setGender} options={[{ value: 'female', label: copy.genderMap.female }, { value: 'male', label: copy.genderMap.male }]} />
            <Field label={copy.birth} type="date" value={birth} onChange={(event) => setBirth(event.target.value)} max={adultDate()} required dir="ltr" />
            <Field label={copy.passwordOptional} value={password} onChange={(event) => setPassword(event.target.value)} type="password" dir="ltr" autoComplete="new-password" />
          </DashCard>

          <DashCard title={copy.joinPickService} deck={copy.joinPickSpecialty} delay={0.3}>
            <div className="dsr-tiles">
              {tree.map((item) => {
                const count = (item.children || []).filter((child) => categoryIds.includes(child.id)).length;
                const shot = doorShot(item);
                return (
                  <button type="button" key={item.id} className={`opt dsr-tile ${group === item.id ? 'on' : ''}`} aria-pressed={group === item.id} onClick={() => setGroup(item.id)}>
                    {shot ? <img src={shot} alt="" /> : <span className="disp dsr-tile-l" aria-hidden="true">{categoryLabel(locale, item).charAt(0)}</span>}
                    <b>{categoryLabel(locale, item)}</b>
                    {count ? <em dir="ltr">{count}</em> : null}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} key={group || 0}>
              {(parent?.children || []).map((child) => (
                <button type="button" key={child.id} className={`chip ${categoryIds.includes(child.id) ? 'on' : ''}`} aria-pressed={categoryIds.includes(child.id)} onClick={() => toggleCategory(child.id)}>
                  {categoryLabel(locale, child)}
                </button>
              ))}
            </div>
            {categoryIds.length ? <Note>{needsLook ? copy.joinLookDeck : copy.joinLookSkip}</Note> : null}
          </DashCard>

          {needsLook ? (
            <DashCard title={copy.joinLookTitle} deck={copy.joinLookDeck} delay={0.3}>
              {showHijab ? (
                <SegRow label={copy.hijab} value={hijab as 'yes' | 'no' | ''} onChange={setHijab} options={[{ value: 'yes', label: copy.hijabMap.yes }, { value: 'no', label: copy.hijabMap.no }]} />
              ) : null}
              <Two>
                <Field label={`${copy.height} · ${copy.cm}`} value={height} onChange={(event) => setHeight(event.target.value)} inputMode="numeric" dir="ltr" />
                <Field label={`${copy.weight} · ${copy.kg}`} value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="numeric" dir="ltr" />
              </Two>
              <Swatch label={copy.skin} items={skins} value={skin} onChange={setSkin} names={copy.skinMap} />
              {showHair ? <Swatch label={copy.hair} items={hairs} value={hair} onChange={setHair} names={copy.hairMap} /> : null}
              <Swatch label={copy.eyes} items={eyes} value={eye} onChange={setEye} names={copy.eyeMap} />
            </DashCard>
          ) : null}

          <DashCard title={copy.joinWorkTitle} deck={copy.joinBioHint} delay={0.3}>
            <Field label={copy.experience} value={years} onChange={(event) => setYears(event.target.value)} inputMode="numeric" dir="ltr" />
            <div>
              <span className="lbl">{copy.languages}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {languageOptions.map((item) => (
                  <button type="button" key={item.value} className={`chip ${languages.includes(item.value) ? 'on' : ''}`} aria-pressed={languages.includes(item.value)} onClick={() => toggleLanguage(item.value)}>
                    {locale === 'en' ? item.en : item.ar}
                  </button>
                ))}
              </div>
            </div>
            <Area
              label={copy.bio}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              required
              minLength={20}
              dir="auto"
              extra={<em dir="ltr" style={{ fontStyle: 'normal', color: bio.trim().length >= 20 ? '#6EE7A0' : '#8A859B' }}>{bio.trim().length}/20</em>}
            />
            <div>
              <span className="lbl">{copy.accounts}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {socials.map((item, index) => (
                  <div className="dsr-social" key={`${item.platform}-${index}`}>
                    <Select
                      value={item.platform}
                      placeholder={copy.accounts}
                      onChange={(platform) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, platform } : row)))}
                      options={platforms.map((platform) => ({ value: platform, label: copy.platforms[platform] }))}
                    />
                    <input className="inp" dir="ltr" value={item.handle} placeholder={copy.handle} aria-label={copy.handle} onChange={(event) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, handle: event.target.value } : row)))} />
                    <button type="button" className="ibtn" aria-label={copy.remove} onClick={() => setSocials((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }} onClick={() => setSocials((current) => [...current, { platform: 'instagram', handle: '' }])}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>
                {copy.addSocial}
              </button>
            </div>
            <Two>
              <Field label={copy.whatsapp} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} dir="ltr" inputMode="tel" />
              <Field label={copy.email} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} type="email" dir="ltr" autoComplete="email" />
            </Two>
          </DashCard>

          <DashCard title={copy.joinPlaceTitle} delay={0.3}>
            <SegRow value={scope} onChange={setScope} options={[{ value: 'inside_iraq', label: copy.inside }, { value: 'outside_iraq', label: copy.outside }]} />
            {scope === 'inside_iraq' ? (
              <Select
                label={copy.governorate}
                value={governorateId}
                onChange={setGovernorateId}
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

          <SaveBar sticky saved={saved} error={error} saving={saving} savedLabel={copy.saved} sendLabel={copy.send} sendingLabel={copy.sending} />
        </form>

        <div className="dsr-aside" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SummaryCard
            shot={doorShot(parent || {}) || '/scenes/fashion.jpg'}
            initial={(name || copy.wordmark).trim().charAt(0)}
            kicker={copy.workState}
            status={copy.workStateMap[availability]}
            tone={availability === 'active' ? 'ok' : availability === 'busy' ? 'wait' : 'off'}
            name={name || copy.name}
          >
            <Link href={`/${locale}/studio`} className="btn btn-ghost btn-sm">{copy.studio}</Link>
            <Link href={`/${locale}/talent/${account.id}`} className="btn btn-ghost btn-sm">{copy.viewProfile}</Link>
          </SummaryCard>
        </div>
      </div>
    </RefDashShell>
  );
}
