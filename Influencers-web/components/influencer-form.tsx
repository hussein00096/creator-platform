'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getAuth } from '@/lib/copy-auth';
import { getCopy } from '@/lib/copy';
import { adultDate, isAdult, selectionNeedsLook } from '@/lib/look';
import { categoryLabel, languageOptions, placeLabel } from '@/lib/names';
import { deco } from '@/lib/people';
import { doorShot } from '@/lib/scenes';
import { clearSession, readSession, saveSession, type Session } from '@/lib/session';
import type { Account, CategoryNode, Locale, OwnAccount, Place } from '@/lib/types';
import { AuthSection, AuthShell } from './auth-shell';
import { Gate } from './desk';
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

type Step = 'craft' | 'you' | 'look' | 'work' | 'place';

export function InfluencerForm({
  locale,
  tree,
  governorates,
  countries,
  mode = 'influencer',
}: {
  locale: Locale;
  tree: CategoryNode[];
  governorates: Place[];
  countries: Place[];
  mode?: 'influencer' | 'model';
}) {
  const copy = getCopy(locale);
  const t = getAuth(locale);
  const a = getAccount(locale);
  // undefined = resolving; null = guest (direct sign-up); otherwise the signed-in account.
  const [viewer, setViewer] = useState<Session | null | undefined>(undefined);
  const upgrade = viewer?.user.role === 'user';
  const [step, setStep] = useState<Step>('you');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [birth, setBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [skin, setSkin] = useState('');
  const [hair, setHair] = useState('');
  const [eye, setEye] = useState('');
  const [hijab, setHijab] = useState('');
  const [years, setYears] = useState('0');
  const [bio, setBio] = useState('');
  const [scope, setScope] = useState<'inside_iraq' | 'outside_iraq'>('inside_iraq');
  const [governorateId, setGovernorateId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [languages, setLanguages] = useState<string[]>(['العربية']);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [group, setGroup] = useState<number | null>(tree[0]?.id || null);
  const [socials, setSocials] = useState<{ platform: string; handle: string }[]>([{ platform: 'instagram', handle: '' }]);
  const [hint, setHint] = useState('');
  const rail = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ x: 0, w: 0 });

  const needsLook = selectionNeedsLook(tree, categoryIds);
  const showHijab = needsLook && gender === 'female';
  const showHair = needsLook && (gender === 'male' || hijab === 'no');
  const steps = useMemo<Step[]>(() => (needsLook ? ['you', 'craft', 'look', 'work', 'place'] : ['you', 'craft', 'work', 'place']), [needsLook]);
  const stepIndex = Math.max(0, steps.indexOf(step));
  const stepName: Record<Step, string> = {
    you: copy.joinSteps[0],
    craft: copy.joinSteps[1],
    look: copy.joinSteps[2],
    work: copy.joinSteps[3],
    place: copy.joinSteps[4],
  };
  const parent = tree.find((item) => item.id === group) || tree[0];
  const pickedNames = tree.flatMap((item) => (item.children || []).filter((child) => categoryIds.includes(child.id)).map((child) => categoryLabel(locale, child)));
  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length ? 1 : 0;

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      setViewer(null);
      return;
    }
    api<Account>('/api/v1/auth/me', { token: saved.token })
      .then((result) => {
        setViewer({ token: saved.token, user: result.data });
        if (result.data.role === 'user') setName(result.data.name || '');
      })
      .catch(() => {
        clearSession();
        setViewer(null);
      });
  }, []);

  useEffect(() => {
    if (gender === 'male') setHijab('not_applicable');
    if (gender === 'female' && hijab === 'not_applicable') setHijab('');
  }, [gender, hijab]);

  useEffect(() => {
    if (hijab === 'yes') setHair('');
  }, [hijab]);

  useEffect(() => {
    if (step === 'look' && !needsLook) setStep('work');
  }, [step, needsLook]);

  useEffect(() => {
    const root = rail.current;
    if (!root) return;
    const active = root.querySelector<HTMLButtonElement>('[data-on="true"]');
    if (!active) return;
    setThumb({ x: active.offsetLeft, w: active.offsetWidth });
    if (root.scrollWidth > root.clientWidth) {
      const target = active.offsetLeft - (root.clientWidth - active.offsetWidth) / 2;
      const rtl = getComputedStyle(root).direction === 'rtl';
      root.scrollTo({ left: rtl ? target - (root.scrollWidth - root.clientWidth) : target, behavior: 'smooth' });
    }
  }, [step, steps, done, viewer]);

  function toggleCategory(id: number) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setHint('');
  }

  function toggleLanguage(value: string) {
    setLanguages((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function validate(current: Step) {
    if (current === 'craft' && !categoryIds.length) return copy.joinNeedSpecialty;
    if (current === 'you') {
      if (name.trim().length < 2) return copy.name;
      if (!upgrade && phone.replace(/\D/g, '').length < 8) return copy.joinPhoneHint;
      if (!upgrade && password.length < 8) return copy.joinPasswordHint;
      if (!isAdult(birth)) return copy.joinAdult;
    }
    if (current === 'look' && needsLook) {
      if (!height || !weight || !skin || !eye) return copy.joinNeedLook;
      if (showHijab && !hijab) return copy.joinNeedHijab;
      if (showHair && !hair) return copy.joinNeedHair;
    }
    if (current === 'work') {
      if (!languages.length) return copy.joinNeedLanguage;
      if (bio.trim().length < 20) return copy.joinBioHint;
      if (!socials.some((item) => item.handle.trim().length >= 2)) return copy.joinNeedSocial;
    }
    if (current === 'place') {
      if (scope === 'inside_iraq' && !governorateId) return copy.governorate;
      if (scope === 'outside_iraq' && !countryId) return copy.country;
    }
    return '';
  }

  function go(next: Step) {
    const target = steps.indexOf(next);
    if (target > stepIndex) {
      for (let index = stepIndex; index < target; index += 1) {
        const message = validate(steps[index]);
        if (message) {
          setHint(message);
          setStep(steps[index]);
          return;
        }
      }
    }
    setHint('');
    setStep(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    for (const item of steps) {
      const message = validate(item);
      if (message) {
        setStep(item);
        setHint(message);
        return;
      }
    }
    setError('');
    setSaving(true);
    const profile = {
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
    };
    try {
      if (upgrade && viewer) {
        const result = await api<OwnAccount>('/api/v1/me/become-influencer', {
          method: 'POST',
          token: viewer.token,
          body: { ...profile, name: name.trim() },
        });
        const { id, name: fresh, role, email, phone: tel, status } = result.data;
        saveSession(viewer.token, { id, name: fresh, role, email, phone: tel, status });
      } else {
        await api('/api/v1/auth/register/influencer', {
          method: 'POST',
          body: { name: name.trim(), phone, password, ...profile },
        });
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }


  if (done && upgrade) {
    return (
      <Gate eyebrow={a.becomeCreator} title={a.upDoneTitle} deck={a.upDoneDeck} shot="/scenes/fashion.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}/studio`}><span>{a.upPhotos}</span><ArrowIcon /></Link>
        <Link className="btn btn-ghost" href={`/${locale}/account`}>{a.upAccount}</Link>
      </Gate>
    );
  }

  if (done) {
    return (
      <Gate eyebrow={copy.joinTalent} title={copy.pendingAccount} deck={copy.studioPending} shot="/scenes/fashion.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}`}><span>{copy.back}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  if (viewer === undefined) return <p className="wait" role="status" aria-label={copy.loading}><i /><i /><i /></p>;

  if (viewer && !upgrade) {
    return (
      <Gate eyebrow={a.becomeCreator} title={a.upGateTitle} deck={viewer.user.role === 'influencer' ? a.upGateTalent : a.upGateOther} shot="/scenes/fashion.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}/account`}><span>{a.upAccount}</span><ArrowIcon /></Link>
      </Gate>
    );
  }

  const heading = step === 'craft' ? copy.joinCraftTitle : step === 'you' ? copy.joinYouTitle : step === 'look' ? copy.joinLookTitle : step === 'work' ? copy.joinWorkTitle : copy.joinPlaceTitle;
  const deck = step === 'craft' ? copy.joinCraftDeck : step === 'look' ? copy.joinLookDeck : step === 'you' ? copy.joinAdult : step === 'work' ? copy.joinBioHint : copy.joinDeck;
  const index = deco(stepIndex + 1, locale);

  return (
    <AuthShell
      locale={locale}
      mode={mode}
      plain={upgrade}
      title={upgrade ? a.upTitle : undefined}
      deck={upgrade ? a.upDeck : undefined}
      caption={(
        <div className="au-slate">
          <p className="au-slate-top"><span>{t.step} · {stepName[step]}</span><b dir="ltr">{String(stepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</b></p>
          <strong className="disp" dir="auto" data-empty={!name.trim() || undefined}>{name.trim() || copy.name}</strong>
          {pickedNames.length ? (
            <div className="au-slate-tags">
              {pickedNames.slice(0, 4).map((item) => <span key={item} className="tag">{item}</span>)}
            </div>
          ) : null}
          <div className="au-slate-bar"><i style={{ transform: `scaleX(${(stepIndex + 1) / steps.length})` }} /></div>
        </div>
      )}
    >
      <form className="au-form" onSubmit={submit}>
        <div className="au-steps" ref={rail} data-lenis-prevent="">
          <i style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w || 0 }} />
          {steps.map((item, itemIndex) => (
            <button
              key={item}
              type="button"
              data-on={step === item}
              data-done={itemIndex < stepIndex || undefined}
              aria-current={step === item ? 'step' : undefined}
              onClick={() => go(item)}
            >
              <small>{deco(itemIndex + 1, locale)}</small>{stepName[item]}
            </button>
          ))}
        </div>

        <div className="au-step" key={step}>
          {step === 'you' ? (
            <AuthSection index={index} title={heading} deck={deck}>
              <Float label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
              {upgrade ? <p className="hint au-hint">{a.upNameDeck}</p> : null}
              {upgrade ? null : (
                <div className="au-two">
                  <Float label={copy.phone} value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" required inputMode="tel" autoComplete="tel" />
                  <Float
                    label={copy.password}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    required
                    minLength={8}
                    dir="ltr"
                    autoComplete="new-password"
                    extra={<b className="au-strength" data-n={strength} aria-hidden="true"><s /><s /><s /></b>}
                  />
                </div>
              )}
              {upgrade ? null : <p className="hint au-hint">{copy.joinPhoneHint}</p>}
              <div>
                <p className="lbl">{copy.gender}</p>
                <Seg value={gender} onChange={setGender} options={[{ value: 'female', label: copy.genderMap.female }, { value: 'male', label: copy.genderMap.male }]} />
              </div>
              <div>
                <p className="lbl" aria-hidden="true">{copy.birth}</p>
                <DatePick locale={locale} value={birth} onChange={setBirth} label={copy.birth} max={adultDate()} required />
              </div>
            </AuthSection>
          ) : null}

          {step === 'craft' ? (
            <AuthSection index={index} title={heading} deck={deck}>
              <p className="lbl au-lbl">{copy.joinPickService}</p>
              <div className="au-tiles">
                {tree.map((item) => {
                  const count = (item.children || []).filter((child) => categoryIds.includes(child.id)).length;
                  const shot = doorShot(item);
                  return (
                    <button type="button" key={item.id} className="opt au-tile" data-on={group === item.id} aria-pressed={group === item.id} onClick={() => setGroup(item.id)}>
                      <span className="au-tile-ph">{shot ? <img src={shot} alt="" /> : <span className="disp">{categoryLabel(locale, item).charAt(0)}</span>}</span>
                      <b>{categoryLabel(locale, item)}</b>
                      {count ? <em>{count}</em> : null}
                    </button>
                  );
                })}
              </div>
              <p className="lbl au-lbl">{copy.joinPickSpecialty}</p>
              <div className="au-chips" key={group || 0}>
                {(parent?.children || []).map((child) => (
                  <button type="button" key={child.id} className="chip" data-on={categoryIds.includes(child.id)} aria-pressed={categoryIds.includes(child.id)} onClick={() => toggleCategory(child.id)}>
                    {categoryLabel(locale, child)}
                  </button>
                ))}
              </div>
              {categoryIds.length ? (
                <p className="au-note" data-tone={needsLook ? 'need' : 'skip'}>
                  <Icon name="info" size={18} />
                  <span>{needsLook ? copy.joinLookDeck : copy.joinLookSkip}</span>
                </p>
              ) : null}
            </AuthSection>
          ) : null}

          {step === 'look' ? (
            <AuthSection index={index} title={heading} deck={deck}>
              {showHijab ? (
                <div>
                  <p className="lbl">{copy.hijab}</p>
                  <Seg value={hijab as 'yes' | 'no' | ''} onChange={setHijab} options={[{ value: 'yes', label: copy.hijabMap.yes }, { value: 'no', label: copy.hijabMap.no }]} />
                </div>
              ) : null}
              <div className="au-two">
                <Float label={`${copy.height} · ${copy.cm}`} value={height} onChange={(event) => setHeight(event.target.value)} inputMode="numeric" dir="ltr" />
                <Float label={`${copy.weight} · ${copy.kg}`} value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="numeric" dir="ltr" />
              </div>
              <Swatches label={copy.skin} items={skins} value={skin} onChange={setSkin} names={copy.skinMap} />
              {showHair ? <Swatches label={copy.hair} items={hairs} value={hair} onChange={setHair} names={copy.hairMap} /> : null}
              <Swatches label={copy.eyes} items={eyes} value={eye} onChange={setEye} names={copy.eyeMap} />
            </AuthSection>
          ) : null}

          {step === 'work' ? (
            <AuthSection index={index} title={heading} deck={deck}>
              <Float label={copy.experience} value={years} onChange={(event) => setYears(event.target.value)} inputMode="numeric" dir="ltr" />
              <div>
                <p className="lbl">{copy.languages}</p>
                <div className="au-chips">
                  {languageOptions.map((item) => (
                    <button type="button" key={item.value} className="chip" data-on={languages.includes(item.value)} aria-pressed={languages.includes(item.value)} onClick={() => toggleLanguage(item.value)}>
                      {locale === 'en' ? item.en : item.ar}
                    </button>
                  ))}
                </div>
              </div>
              <FloatArea
                label={copy.bio}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                required
                minLength={20}
                dir="auto"
                rows={5}
                extra={<em className="au-count" data-ok={bio.trim().length >= 20} dir="ltr">{bio.trim().length}/20</em>}
              />
              <div>
                <p className="lbl">{copy.accounts}</p>
                <div className="au-socials">
                  {socials.map((item, rowKey) => (
                    <div className="au-social" key={`${item.platform}-${rowKey}`}>
                      <Pick
                        value={item.platform}
                        onChange={(platform) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === rowKey ? { ...row, platform } : row)))}
                        options={platforms.map((platform) => ({ value: platform, label: copy.platforms[platform] }))}
                      />
                      <input className="inp" dir="ltr" value={item.handle} placeholder={copy.handle} aria-label={copy.handle} onChange={(event) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === rowKey ? { ...row, handle: event.target.value } : row)))} />
                      <button type="button" className="ibtn au-x" aria-label={copy.remove} onClick={() => setSocials((current) => current.filter((_, rowIndex) => rowIndex !== rowKey))}><Icon name="close" size={18} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-ghost btn-sm au-add" onClick={() => setSocials((current) => [...current, { platform: 'instagram', handle: '' }])}><Icon name="plus" size={18} />{copy.addSocial}</button>
              </div>
            </AuthSection>
          ) : null}

          {step === 'place' ? (
            <AuthSection index={index} title={heading} deck={deck}>
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
            </AuthSection>
          ) : null}
        </div>

        {hint ? <p className="err au-err" role="alert" dir="auto">{hint}</p> : null}
        {error ? <p className="err au-err" role="alert" dir="auto">{error}</p> : null}

        <div className="au-nav">
          {stepIndex > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(steps[stepIndex - 1])}>{copy.prev}</button>
          ) : null}
          {step !== 'place' ? (
            <button type="button" className="btn btn-acc" onClick={() => go(steps[stepIndex + 1])}><span>{copy.next}</span><ArrowIcon /></button>
          ) : (
            <button className="btn btn-acc" type="submit" disabled={saving}><span>{saving ? copy.sending : upgrade ? a.upSend : copy.joinSend}</span><ArrowIcon /></button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
