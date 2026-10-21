'use client';

// Creator / model sign-up on the design/reference/auth.html split screen. All logic is the
// site's existing influencer-form.tsx: steps, validation, guest registration and the signed-in
// normal-user upgrade (POST /api/v1/me/become-influencer).
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { DatePick, Pick, Swatches } from '@/components/pick';
import { Arr, num } from '@/components/ref/parts';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getAuth } from '@/lib/copy-auth';
import { getCopy } from '@/lib/copy';
import { adultDate, isAdult, selectionNeedsLook } from '@/lib/look';
import { categoryLabel, languageOptions } from '@/lib/names';
import { doorShot } from '@/lib/scenes';
import { clearSession, readSession, saveSession, type Session } from '@/lib/session';
import type { Account, CategoryNode, Locale, OwnAccount, Place } from '@/lib/types';
import { Err, In, RefAuth, RefForm, RefPlace, RefSec, RefSeg, Strength, Terms, plainText } from './auth';

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

export function RefCreatorJoin({
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

  // Keep the active step visible in the scrolling rail (small screens).
  useEffect(() => {
    const root = rail.current;
    const active = root?.querySelector<HTMLElement>('.seg.on');
    if (!root || !active || root.scrollWidth <= root.clientWidth) return;
    const box = root.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    root.scrollBy({ left: item.left + item.width / 2 - (box.left + box.width / 2), behavior: 'smooth' });
  }, [step, steps, viewer]);

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

  const actions = (children: ReactNode) => (
    <div className="fd" style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px', animationDelay: '.35s' }}>{children}</div>
  );
  const wide = { width: '100%', minHeight: '56px' };

  if (done && upgrade) {
    return (
      <RefAuth locale={locale} mode={mode} plain title={a.upDoneTitle} lead={a.upDoneDeck}>
        {actions(
          <>
            <Link className="btn btn-acc mag" href={`/${locale}/studio`} style={wide}>{a.upPhotos}<Arr /></Link>
            <Link className="btn btn-ghost" href={`/${locale}/account`} style={wide}>{a.upAccount}</Link>
          </>,
        )}
      </RefAuth>
    );
  }

  if (done) {
    return (
      <RefAuth locale={locale} mode={mode} plain title={copy.pendingAccount} lead={copy.studioPending}>
        {actions(<Link className="btn btn-acc mag" href={`/${locale}`} style={wide}>{copy.back}<Arr /></Link>)}
      </RefAuth>
    );
  }

  if (viewer === undefined) {
    return (
      <RefAuth locale={locale} mode={mode} plain title={a.becomeCreator} lead={copy.loading}>
        <span role="status" aria-label={copy.loading} />
      </RefAuth>
    );
  }

  if (viewer && !upgrade) {
    return (
      <RefAuth locale={locale} mode={mode} plain title={a.upGateTitle} lead={viewer.user.role === 'influencer' ? a.upGateTalent : a.upGateOther}>
        {actions(<Link className="btn btn-acc mag" href={`/${locale}/account`} style={wide}>{a.upAccount}<Arr /></Link>)}
      </RefAuth>
    );
  }

  const heading = step === 'craft' ? copy.joinCraftTitle : step === 'you' ? copy.joinYouTitle : step === 'look' ? copy.joinLookTitle : step === 'work' ? copy.joinWorkTitle : copy.joinPlaceTitle;
  const deck = step === 'craft' ? copy.joinCraftDeck : step === 'look' ? copy.joinLookDeck : step === 'you' ? copy.joinAdult : step === 'work' ? copy.joinBioHint : copy.joinDeck;

  // Caption box of the visual side: live step / name / picked specialties (reference box styles).
  const caption = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#B1ACBE', fontSize: '14px' }}>
        <span>{t.step} · {stepName[step]}</span>
        <b dir="ltr" style={{ color: 'var(--acc)' }}>{String(stepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</b>
      </div>
      <div className="disp" dir="auto" style={{ marginTop: '10px', fontSize: '30px', fontWeight: '900', lineHeight: '1.3', color: name.trim() ? '#F5F2EA' : '#8A859B', overflowWrap: 'anywhere' }}>{name.trim() || copy.name}</div>
      {pickedNames.length ? (
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {pickedNames.slice(0, 4).map((item) => <span key={item} className="tag">{item}</span>)}
        </div>
      ) : null}
      <div className="ra-bar"><i style={{ transform: `scaleX(${(stepIndex + 1) / steps.length})` }} /></div>
    </>
  );

  return (
    <RefAuth
      locale={locale}
      mode={mode}
      plain={upgrade}
      title={upgrade ? plainText(a.upTitle) : undefined}
      lead={upgrade ? a.upDeck : undefined}
      caption={caption}
    >
      <RefForm onSubmit={submit}>
        <div className="seg-w ra-steps" ref={rail} data-lenis-prevent="" aria-label={t.step}>
          {steps.map((item, itemIndex) => (
            <button
              key={item}
              type="button"
              className={`seg ${step === item ? 'on' : ''} ${itemIndex < stepIndex ? 'done' : ''}`}
              aria-current={step === item ? 'step' : undefined}
              onClick={() => go(item)}
            >
              <small>{num(itemIndex + 1, locale)}</small>{stepName[item]}
            </button>
          ))}
        </div>

        <div key={step} className="fd" style={{ animationDelay: '0s' }}>
          {step === 'you' ? (
            <RefSec n={stepIndex + 1} locale={locale} title={heading} deck={deck}>
              <In locale={locale} label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" extra={upgrade ? <p className="ra-hint">{a.upNameDeck}</p> : null} />
              {upgrade ? null : (
                <>
                  <div className="ra-two">
                    <In locale={locale} ltr label={copy.phone} value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" autoComplete="tel" />
                    <In locale={locale} ltr label={copy.password} type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" extra={<Strength password={password} />} />
                  </div>
                  <p className="ra-hint" style={{ margin: 0 }}>{copy.joinPhoneHint}</p>
                </>
              )}
              <div>
                <span className="lbl">{copy.gender}</span>
                <RefSeg value={gender} onChange={setGender} label={copy.gender} options={[{ value: 'female', label: copy.genderMap.female }, { value: 'male', label: copy.genderMap.male }]} />
              </div>
              <div>
                <span className="lbl" aria-hidden="true">{copy.birth}</span>
                <DatePick locale={locale} value={birth} onChange={setBirth} label={copy.birth} max={adultDate()} required />
              </div>
            </RefSec>
          ) : null}

          {step === 'craft' ? (
            <RefSec n={stepIndex + 1} locale={locale} title={heading} deck={deck}>
              <div>
                <span className="lbl">{copy.joinPickService}</span>
                <div className="ra-tiles">
                  {tree.map((item) => {
                    const count = (item.children || []).filter((child) => categoryIds.includes(child.id)).length;
                    const shot = doorShot(item);
                    const on = group === item.id;
                    return (
                      <button type="button" key={item.id} className={`opt ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setGroup(item.id)}>
                        <span className="ra-tp">{shot ? <img src={shot} alt="" /> : <span className="disp">{categoryLabel(locale, item).charAt(0)}</span>}</span>
                        <b>{categoryLabel(locale, item)}</b>
                        {count ? <em>{num(count, locale).replace(/^[0٠](?=.)/, '')}</em> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="lbl">{copy.joinPickSpecialty}</span>
                <div className="ra-chips" key={group || 0}>
                  {(parent?.children || []).map((child) => {
                    const on = categoryIds.includes(child.id);
                    return (
                      <button type="button" key={child.id} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleCategory(child.id)}>
                        {categoryLabel(locale, child)}
                      </button>
                    );
                  })}
                </div>
              </div>
              {categoryIds.length ? (
                <p className="ra-note">
                  <Icon name="info" size={18} />
                  <span>{needsLook ? copy.joinLookDeck : copy.joinLookSkip}</span>
                </p>
              ) : null}
            </RefSec>
          ) : null}

          {step === 'look' ? (
            <RefSec n={stepIndex + 1} locale={locale} title={heading} deck={deck}>
              {showHijab ? (
                <div>
                  <span className="lbl">{copy.hijab}</span>
                  <RefSeg value={hijab as 'yes' | 'no' | ''} onChange={setHijab} label={copy.hijab} options={[{ value: 'yes', label: copy.hijabMap.yes }, { value: 'no', label: copy.hijabMap.no }]} />
                </div>
              ) : null}
              <div className="ra-two">
                <In locale={locale} ltr label={`${copy.height} · ${copy.cm}`} value={height} onChange={(event) => setHeight(event.target.value)} inputMode="numeric" />
                <In locale={locale} ltr label={`${copy.weight} · ${copy.kg}`} value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="numeric" />
              </div>
              <Swatches label={copy.skin} items={skins} value={skin} onChange={setSkin} names={copy.skinMap} />
              {showHair ? <Swatches label={copy.hair} items={hairs} value={hair} onChange={setHair} names={copy.hairMap} /> : null}
              <Swatches label={copy.eyes} items={eyes} value={eye} onChange={setEye} names={copy.eyeMap} />
            </RefSec>
          ) : null}

          {step === 'work' ? (
            <RefSec n={stepIndex + 1} locale={locale} title={heading} deck={deck}>
              <In locale={locale} ltr label={copy.experience} value={years} onChange={(event) => setYears(event.target.value)} inputMode="numeric" />
              <div>
                <span className="lbl">{copy.languages}</span>
                <div className="ra-chips">
                  {languageOptions.map((item) => {
                    const on = languages.includes(item.value);
                    return (
                      <button type="button" key={item.value} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleLanguage(item.value)}>
                        {locale === 'en' ? item.en : item.ar}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label style={{ display: 'block' }}>
                <span className="lbl">{copy.bio}</span>
                <textarea className="inp" value={bio} onChange={(event) => setBio(event.target.value)} required minLength={20} dir="auto" rows={5} />
                <span className="ra-hint" dir="ltr" style={{ display: 'block', color: bio.trim().length >= 20 ? '#5BD68A' : '#8A859B' }}>{bio.trim().length}/20</span>
              </label>
              <div>
                <span className="lbl">{copy.accounts}</span>
                {socials.map((item, rowKey) => (
                  <div className="ra-social" key={`${item.platform}-${rowKey}`}>
                    <Pick
                      value={item.platform}
                      onChange={(platform) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === rowKey ? { ...row, platform } : row)))}
                      options={platforms.map((platform) => ({ value: platform, label: copy.platforms[platform] }))}
                    />
                    <input className="inp" dir="ltr" value={item.handle} placeholder={copy.handle} aria-label={copy.handle} onChange={(event) => setSocials((current) => current.map((row, rowIndex) => (rowIndex === rowKey ? { ...row, handle: event.target.value } : row)))} />
                    <button type="button" className="ibtn" aria-label={copy.remove} onClick={() => setSocials((current) => current.filter((_, rowIndex) => rowIndex !== rowKey))}><Icon name="close" size={18} /></button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '10px' }} onClick={() => setSocials((current) => [...current, { platform: 'instagram', handle: '' }])}><Icon name="plus" size={18} />{copy.addSocial}</button>
              </div>
            </RefSec>
          ) : null}

          {step === 'place' ? (
            <RefSec n={stepIndex + 1} locale={locale} title={heading} deck={deck}>
              <RefPlace locale={locale} scope={scope} setScope={setScope} governorates={governorates} countries={countries} govId={governorateId} setGovId={setGovernorateId} countryId={countryId} setCountryId={setCountryId} />
            </RefSec>
          ) : null}
        </div>

        <Err>{hint}</Err>
        <Err>{error}</Err>

        <div className="ra-nav">
          {stepIndex > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(steps[stepIndex - 1])}>{copy.prev}</button>
          ) : null}
          {step !== 'place' ? (
            <button type="button" className="btn btn-acc mag" onClick={() => go(steps[stepIndex + 1])}>{copy.next}<Arr /></button>
          ) : (
            <button className="btn btn-acc mag" type="submit" disabled={saving}>{saving ? copy.sending : upgrade ? a.upSend : copy.joinSend}<Arr /></button>
          )}
        </div>
        {upgrade ? null : <Terms locale={locale} />}
      </RefForm>
    </RefAuth>
  );
}
