'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { adultDate, isAdult, selectionNeedsLook } from '@/lib/look';
import { categoryLabel, languageOptions, placeLabel } from '@/lib/names';
import { doorShot } from '@/lib/scenes';
import { saveSession, type Session } from '@/lib/session';
import type { Availability, CategoryNode, Locale, OwnAccount, Place } from '@/lib/types';
import { DashShell } from './dash-shell';
import { Panel } from './desk';
import { Float, FloatArea, Seg } from './fields';
import { ArrowIcon, Icon } from './icons';
import { DatePick, Pick, Swatches } from './pick';


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

export function TalentEdit({
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
    <DashShell locale={locale} user={session.user} page="account" eyebrow={copy.account} title={copy.accountTitle} deck={copy.accountDeckTalent} onLeave={onLeave}>
      <div className="ds-split">
        <form className="ds-form" onSubmit={submit}>
          {session.user.status === 'pending' ? <p className="ds-note" role="status">{copy.pendingAccount}</p> : null}
          <Panel index="01" title={copy.workState} deck={copy.workStateDeck}>
            <Seg value={availability} onChange={setAvailability} options={workStates} />
          </Panel>

          <Panel index="02" title={copy.joinYouTitle} deck={copy.joinPhoneHint}>
            <Float label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
            <Float label={copy.phone} value={account.phone || ''} dir="ltr" disabled readOnly />
            <p className="ds-legend">{copy.gender}</p>
            <Seg value={gender} onChange={setGender} options={[{ value: 'female', label: copy.genderMap.female }, { value: 'male', label: copy.genderMap.male }]} />
            <DatePick locale={locale} value={birth} onChange={setBirth} label={copy.birth} max={adultDate()} required />
            <Float label={copy.passwordOptional} value={password} onChange={(event) => setPassword(event.target.value)} type="password" dir="ltr" autoComplete="new-password" />
          </Panel>

          <Panel index="03" title={copy.joinPickService} deck={copy.joinPickSpecialty}>
            <div className="ds-tiles">
              {tree.map((item) => {
                const count = (item.children || []).filter((child) => categoryIds.includes(child.id)).length;
                const shot = doorShot(item);
                return (
                  <button type="button" key={item.id} className="opt ds-tile" data-on={group === item.id} aria-pressed={group === item.id} onClick={() => setGroup(item.id)}>
                    {shot ? <img src={shot} alt="" /> : <span className="disp ds-tile-l" aria-hidden="true">{categoryLabel(locale, item).charAt(0)}</span>}
                    <b>{categoryLabel(locale, item)}</b>
                    {count ? <em dir="ltr">{count}</em> : null}
                  </button>
                );
              })}
            </div>
            <div className="ds-chips" key={group || 0}>
              {(parent?.children || []).map((child) => (
                <button type="button" key={child.id} className="chip chip-sm" data-on={categoryIds.includes(child.id)} aria-pressed={categoryIds.includes(child.id)} onClick={() => toggleCategory(child.id)}>
                  {categoryLabel(locale, child)}
                </button>
              ))}
            </div>
            {categoryIds.length ? (
              <p className={needsLook ? 'ds-note' : 'hint'}>
                {needsLook ? copy.joinLookDeck : copy.joinLookSkip}
              </p>
            ) : null}
          </Panel>

          {needsLook ? (
            <Panel index="04" title={copy.joinLookTitle} deck={copy.joinLookDeck}>
              {showHijab ? (
                <>
                  <p className="ds-legend">{copy.hijab}</p>
                  <Seg value={hijab as 'yes' | 'no' | ''} onChange={setHijab} options={[{ value: 'yes', label: copy.hijabMap.yes }, { value: 'no', label: copy.hijabMap.no }]} />
                </>
              ) : null}
              <div className="ds-two">
                <Float label={`${copy.height} · ${copy.cm}`} value={height} onChange={(event) => setHeight(event.target.value)} inputMode="numeric" dir="ltr" />
                <Float label={`${copy.weight} · ${copy.kg}`} value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="numeric" dir="ltr" />
              </div>
              <Swatches label={copy.skin} items={skins} value={skin} onChange={setSkin} names={copy.skinMap} />
              {showHair ? <Swatches label={copy.hair} items={hairs} value={hair} onChange={setHair} names={copy.hairMap} /> : null}
              <Swatches label={copy.eyes} items={eyes} value={eye} onChange={setEye} names={copy.eyeMap} />
            </Panel>
          ) : null}

          <Panel index={needsLook ? '05' : '04'} title={copy.joinWorkTitle} deck={copy.joinBioHint}>
            <Float label={copy.experience} value={years} onChange={(event) => setYears(event.target.value)} inputMode="numeric" dir="ltr" />
            <p className="ds-legend">{copy.languages}</p>
            <div className="ds-chips">
              {languageOptions.map((item) => (
                <button type="button" key={item.value} className="chip chip-sm" data-on={languages.includes(item.value)} aria-pressed={languages.includes(item.value)} onClick={() => toggleLanguage(item.value)}>
                  {locale === 'en' ? item.en : item.ar}
                </button>
              ))}
            </div>
            <FloatArea
              label={copy.bio}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              required
              minLength={20}
              dir="auto"
              extra={<em className="ds-count" data-ok={bio.trim().length >= 20} dir="ltr">{bio.trim().length}/20</em>}
            />
            <p className="ds-legend">{copy.accounts}</p>
            {socials.map((item, index) => (
              <div className="ds-social" key={`${item.platform}-${index}`}>
                <Pick
                  value={item.platform}
                  onChange={(platform) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, platform } : row)))}
                  options={platforms.map((platform) => ({ value: platform, label: copy.platforms[platform] }))}
                />
                <input className="inp" dir="ltr" value={item.handle} placeholder={copy.handle} aria-label={copy.handle} onChange={(event) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, handle: event.target.value } : row)))} />
                <button type="button" className="ibtn" aria-label={copy.remove} onClick={() => setSocials((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Icon name="close" size={18} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm ds-add" onClick={() => setSocials((current) => [...current, { platform: 'instagram', handle: '' }])}><Icon name="plus" size={18} />{copy.addSocial}</button>
            <p className="ds-legend">{copy.sectionReach}</p>
            <div className="ds-two">
              <Float label={copy.whatsapp} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} dir="ltr" inputMode="tel" />
              <Float label={copy.email} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} type="email" dir="ltr" autoComplete="email" />
            </div>
          </Panel>

          <Panel index={needsLook ? '06' : '05'} title={copy.joinPlaceTitle}>
            <Seg value={scope} onChange={setScope} options={[{ value: 'inside_iraq', label: copy.inside }, { value: 'outside_iraq', label: copy.outside }]} />
            {scope === 'inside_iraq' ? (
              <Pick
                value={governorateId}
                onChange={setGovernorateId}
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

          <div className="ds-save is-sticky">
            <div className="ds-save-msg" aria-live="polite">
              {saved ? <p className="ok-msg" dir="auto"><Icon name="check" size={16} />{copy.saved}</p> : null}
              {error ? <p className="err" dir="auto" role="alert">{error}</p> : null}
            </div>
            <button className="btn btn-acc" type="submit" disabled={saving}><span>{saving ? copy.sending : copy.send}</span><ArrowIcon /></button>
          </div>
        </form>

        <aside className="ds-aside">
          <div className="card ds-sum">
            <img className="ds-sum-shot" src={doorShot(parent || {}) || '/scenes/fashion.jpg'} alt="" />
            <p className="ds-sum-top"><span>{copy.workState}</span><b className={`pill ${availability === 'active' ? 'pill-active' : availability === 'busy' ? 'pill-pending' : 'pill-done'}`}>{copy.workStateMap[availability]}</b></p>
            <strong className="disp" dir="auto" data-empty={!name || undefined}>{name || copy.name}</strong>
            <div className="ds-sum-links">
              <Link href={`/${locale}/studio`} className="btn btn-ghost btn-sm btn-block"><Icon name="image" size={18} />{copy.studio}</Link>
              <Link href={`/${locale}/talent/${account.id}`} className="btn btn-ghost btn-sm btn-block">{copy.viewProfile}<ArrowIcon size={18} /></Link>
            </div>
          </div>
        </aside>
      </div>
    </DashShell>
  );
}
