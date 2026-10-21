'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { canOrder, getAccount } from '@/lib/copy-account';
import { getBooking } from '@/lib/copy-booking';
import { getCopy } from '@/lib/copy';
import { categoryLabel } from '@/lib/names';
import { deco } from '@/lib/people';
import { clearSession, readSession, type Session } from '@/lib/session';
import type { Influencer, Locale } from '@/lib/types';
import { Counter, Face, Line, Progress, Sent, Summary } from './booking-parts';
import { Gate } from './desk';
import { Float, FloatArea } from './fields';
import { ArrowIcon, BackIcon, Icon } from './icons';
import { Split } from './motion';
import { MiniHeader } from './ui-client';


const steps = ['idea', 'direction', 'faces', 'review'] as const;

/** Content (UGC) request wizard: idea → direction → faces → review. */
export function RequestForm({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const book = getBooking(locale);
  const acct = getAccount(locale);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [at, setAt] = useState(0);
  const [tried, setTried] = useState(false);
  const [title, setTitle] = useState('');
  const [product, setProduct] = useState('');
  const [execution, setExecution] = useState('');
  const [usage, setUsage] = useState('');
  const [quantity, setQuantity] = useState(6);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Influencer[]>([]);
  const [picked, setPicked] = useState<Influencer[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestNote, setGuestNote] = useState('');
  const [externals, setExternals] = useState<{ name: string; note: string }[]>([]);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      setSession(null);
      return;
    }
    api<{ id: number; name: string; role: string; status: string; phone?: string | null }>('/api/v1/auth/me', { token: saved.token })
      .then((result) => setSession({ token: saved.token, user: result.data }))
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams({ limit: '8' });
      if (query.trim()) params.set('search', query.trim());
      api<Influencer[]>(`/api/v1/influencers?${params}`)
        .then((result) => setFound(result.data))
        .catch(() => setFound([]));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (done) window.scrollTo(0, 0);
  }, [done]);

  const okTitle = title.trim().length >= 3;
  const okProduct = product.trim().length >= 10;
  const okExecution = execution.trim().length >= 10;
  const okUsage = usage.trim().length >= 3;
  const ready = okTitle && okProduct && okExecution && okUsage;
  const loginHref = `/${locale}/login?next=${encodeURIComponent(`/${locale}/request`)}`;
  const joinHref = `/${locale}/join/user?next=${encodeURIComponent(`/${locale}/request`)}`;
  const step = steps[at];
  const sep = locale === 'ar' ? '، ' : ', ';
  const tokens = usage.split(/[،,]/).map((item) => item.trim()).filter(Boolean);

  function toggleTalent(person: Influencer) {
    setPicked((current) => (
      current.some((item) => item.id === person.id)
        ? current.filter((item) => item.id !== person.id)
        : [...current, person]
    ));
  }

  function togglePlatform(label: string) {
    const next = tokens.includes(label) ? tokens.filter((item) => item !== label) : [...tokens, label];
    setUsage(next.join(sep));
  }

  function addGuest() {
    const name = guestName.trim();
    if (name.length < 2) return;
    setExternals((current) => [...current, { name, note: guestNote.trim() }]);
    setGuestName('');
    setGuestNote('');
  }

  function go(index: number) {
    setTried(false);
    setAt(index);
    top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /** Same rules as `ready`, checked one step at a time. */
  function next() {
    if (form.current && !form.current.reportValidity()) return;
    const ok = step === 'idea' ? okTitle && okProduct : step === 'direction' ? okExecution && okUsage : true;
    if (!ok) {
      setTried(true);
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    go(Math.min(steps.length - 1, at + 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session || !ready) return;
    setError('');
    setSaving(true);
    try {
      await api('/api/v1/ugc-requests', {
        method: 'POST',
        token: session.token,
        body: {
          title: title.trim(),
          productDescription: product.trim(),
          executionDetails: execution.trim(),
          usagePlace: usage.trim(),
          quantity,
          influencerIds: picked.map((item) => item.id),
          externalNames: externals.filter((item) => item.name.trim()),
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent) {
    if (step !== 'review') {
      event.preventDefault();
      next();
      return;
    }
    void submit(event);
  }

  if (session === undefined) return <p className="wait">{copy.loading}</p>;

  if (done) return <Sent locale={locale} />;

  if (!session || !canOrder(session.user)) {
    const company = session?.user.role === 'client';
    const titleText = !session ? copy.requestTitle : company ? copy.pendingAccount : acct.noOrderTitle;
    const deck = !session ? acct.guestOrder : company ? acct.companyPending : acct.noOrder;
    return (
      <Gate eyebrow={copy.request} title={titleText} deck={deck} shot="/scenes/content.jpg">
        {!session ? <Link className="btn btn-acc" href={loginHref}><span>{copy.enter}</span><ArrowIcon /></Link> : null}
        {!session ? <Link className="btn btn-ghost" href={joinHref}>{acct.newUser}</Link> : null}
        {session && !company ? (
          <button type="button" className="btn btn-acc" onClick={() => { clearSession(); setSession(null); }}>{copy.leave}</button>
        ) : null}
        {session ? <Link className="btn btn-ghost" href={`/${locale}`}>{copy.back}</Link> : null}
      </Gate>
    );
  }

  const meta = book.steps[at];
  const bad = (ok: boolean) => (tried && !ok) || undefined;

  return (
    <div className="bk">
      <MiniHeader />
      <div className="wrap bk-in" ref={top}>
        <header className="bk-head">
          <span className="eyebrow fd">{copy.request} · <span dir="auto">{session.user.name}</span></span>
          <Split as="h1" text={book.title} className="bk-title" delay={0.1} />
        </header>

        <div className="bk-grid">
          <form id="ugc-form" ref={form} className="bk-main" onSubmit={onSubmit}>
            <Progress locale={locale} at={at} onGo={go} />

            <section className="card bk-step fd" key={step} aria-labelledby="bk-step-h">
              <p className="bk-stepof">{book.stepOf(deco(at + 1, locale), deco(steps.length, locale))}</p>
              <h2 id="bk-step-h" className="h3">{meta.head}</h2>
              <p className="bk-deck">{meta.deck}</p>

              {step === 'idea' ? (
                <div className="bk-fields">
                  <Float
                    label={copy.workTitle}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    dir="auto"
                    required
                    minLength={3}
                    aria-invalid={bad(okTitle)}
                    extra={bad(okTitle) ? <span className="err mt-2">{book.tooShort(3)}</span> : null}
                  />
                  <Write label={copy.product} value={product} onChange={setProduct} min={10} invalid={bad(okProduct)} hint={book.tooShort(10)} />
                </div>
              ) : null}

              {step === 'direction' ? (
                <div className="bk-fields">
                  <Write label={copy.execution} value={execution} onChange={setExecution} min={10} invalid={bad(okExecution)} hint={book.tooShort(10)} />
                  <div>
                    <span className="lbl">{copy.usage}</span>
                    <div className="bk-chips" role="group" aria-label={copy.usage}>
                      {book.platforms.map((item) => {
                        const on = tokens.includes(item);
                        return <button key={item} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => togglePlatform(item)}>{item}</button>;
                      })}
                    </div>
                    <Float
                      label={book.platformsHint}
                      value={usage}
                      onChange={(event) => setUsage(event.target.value)}
                      dir="auto"
                      required
                      minLength={3}
                      aria-invalid={bad(okUsage)}
                      extra={bad(okUsage) ? <span className="err mt-2">{book.tooShort(3)}</span> : null}
                    />
                  </div>
                </div>
              ) : null}

              {step === 'faces' ? (
                <div className="bk-fields">
                  <Counter value={quantity} min={1} max={200} label={copy.quantity} more={copy.requestMore} less={copy.requestLess} onChange={setQuantity} />

                  <div>
                    <span className="lbl">{copy.pickTalent}</span>
                    <p className="hint mb-3">{copy.requestCastHint}</p>
                    <label className="bk-search">
                      <Icon name="search" />
                      <input
                        className="inp"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}
                        dir="auto"
                        placeholder={copy.searchPlaceholder}
                        aria-label={copy.pickTalent}
                      />
                    </label>
                    <div className="bk-faces">
                      {found.map((person) => {
                        const on = picked.some((item) => item.id === person.id);
                        const category = person.profile?.categories[0];
                        return (
                          <button type="button" key={person.id} className={`opt bk-pick${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleTalent(person)}>
                            <Face person={person} size={52} />
                            <span className="min-w-0 flex-1">
                              <b dir="auto">{person.name}</b>
                              {category ? <small>{categoryLabel(locale, category)}</small> : null}
                            </span>
                            <i className="bk-tick" aria-hidden="true"><Icon name="check" size={16} /></i>
                          </button>
                        );
                      })}
                    </div>
                    {!found.length ? <p className="hint">{copy.requestEmptyCast}</p> : null}
                  </div>

                  <div>
                    <span className="lbl">{copy.external}</span>
                    <p className="hint mb-3">{copy.requestGuestHint}</p>
                    <div className="bk-guest">
                      <input className="inp" value={guestName} onChange={(event) => setGuestName(event.target.value)} dir="auto" placeholder={copy.name} aria-label={copy.name} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addGuest(); } }} />
                      <input className="inp" value={guestNote} onChange={(event) => setGuestNote(event.target.value)} dir="auto" placeholder={copy.externalNote} aria-label={copy.externalNote} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addGuest(); } }} />
                      <button type="button" className="btn btn-ghost" onClick={addGuest}><Icon name="plus" size={18} />{copy.addName}</button>
                    </div>
                    {externals.length ? (
                      <div className="bk-guests">
                        {externals.map((item, index) => (
                          <span key={`${item.name}-${index}`} className="chip">
                            <b dir="auto">{item.name}</b>
                            {item.note ? <small dir="auto">{item.note}</small> : null}
                            <button type="button" aria-label={`${copy.remove} ${item.name}`} onClick={() => setExternals((current) => current.filter((_, row) => row !== index))}><Icon name="close" size={16} /></button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 'review' ? (
                <dl className="bk-lines bk-review">
                  <Line label={copy.workTitle}><span dir="auto">{title.trim()}</span><Edit label={book.edit} onClick={() => go(0)} /></Line>
                  <Line label={copy.product}><span dir="auto">{product.trim()}</span><Edit label={book.edit} onClick={() => go(0)} /></Line>
                  <Line label={copy.execution}><span dir="auto">{execution.trim()}</span><Edit label={book.edit} onClick={() => go(1)} /></Line>
                  <Line label={copy.usage}><span dir="auto">{usage.trim()}</span><Edit label={book.edit} onClick={() => go(1)} /></Line>
                  <Line label={copy.quantity}><span dir="ltr">{quantity}</span><Edit label={book.edit} onClick={() => go(2)} /></Line>
                  <Line label={copy.requestPicked}>
                    <span>{picked.length ? picked.map((item) => item.name).join(sep) : book.facesNone}</span>
                    <Edit label={book.edit} onClick={() => go(2)} />
                  </Line>
                  {externals.length ? (
                    <Line label={copy.external}><span dir="auto">{externals.map((item) => item.name).join(sep)}</span><Edit label={book.edit} onClick={() => go(2)} /></Line>
                  ) : null}
                </dl>
              ) : null}
              {step === 'review' && !ready ? <p className="err mt-4">{book.missing}</p> : null}
            </section>

            {error ? <p className="err bk-alert" role="alert" dir="auto">{error}</p> : null}
            <div className="bk-nav">
              {at > 0 ? (
                <button type="button" className="btn btn-ghost" onClick={() => go(at - 1)}><BackIcon />{copy.prev}</button>
              ) : <span />}
              {step !== 'review' ? (
                <button key="next" type="button" className="btn btn-acc" onClick={next}><span>{copy.next}</span><ArrowIcon /></button>
              ) : (
                <button key="send" className="btn btn-acc" type="submit" disabled={!ready || saving}><span>{saving ? copy.sending : copy.requestSend}</span><ArrowIcon /></button>
              )}
            </div>
          </form>

          <Summary locale={locale} title={title} usage={usage} quantity={quantity} picked={picked} externals={externals} />
        </div>
      </div>
    </div>
  );
}

function Write({
  label, value, onChange, min, invalid, hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  invalid?: boolean;
  hint: string;
}) {
  const size = value.trim().length;
  return (
    <FloatArea
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      dir="auto"
      required
      minLength={min}
      rows={5}
      aria-invalid={invalid}
      extra={(
        <span className="bk-meter">
          {invalid ? <span className="err">{hint}</span> : <span />}
          <em data-ok={size >= min} dir="ltr">{size}/{min}</em>
        </span>
      )}
    />
  );
}

function Edit({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="lnk bk-edit" onClick={onClick}>{label}</button>;
}
