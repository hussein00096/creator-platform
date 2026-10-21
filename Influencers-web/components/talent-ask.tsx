'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { canOrder, getAccount } from '@/lib/copy-account';
import { getProfile } from '@/lib/copy-profile';
import { whatsappLink } from '@/lib/reach';
import { clearSession, readSession, type Session } from '@/lib/session';
import type { Availability, Contact, Locale } from '@/lib/types';
import { Float, FloatArea } from './fields';
import { ArrowIcon, Icon } from './icons';
import { SuccessBurst } from './ui';

/** Sticky booking card: login gate, account-state verdicts, the service request form and the team's contact lines. */
export function TalentAsk({
  locale,
  talentId,
  talentName,
  availability,
  shot,
  tone,
}: {
  locale: Locale;
  talentId: number;
  talentName: string;
  availability?: Availability;
  shot?: string | null;
  tone?: string;
}) {
  const copy = getCopy(locale);
  const t = getProfile(locale);
  const acct = getAccount(locale);
  const here = encodeURIComponent(`/${locale}/talent/${talentId}`);
  const loginHref = `/${locale}/login?next=${here}`;
  const joinHref = `/${locale}/join/user?next=${here}`;
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!session) return;
    api<Contact>('/api/v1/platform-contact')
      .then((result) => setContact(result.data))
      .catch(() => setContact(null));
  }, [session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await api('/api/v1/service-requests', {
        method: 'POST',
        token: session.token,
        body: {
          influencerUserId: talentId,
          title: String(form.get('title') || '').trim() || talentName,
          details: String(form.get('details') || '').trim(),
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  const company = contact && (contact.phone || contact.whatsapp || contact.email) ? (
    <section className="pf-reach">
      <span className="eyebrow">{copy.studioReach}</span>
      <p>{copy.studioReachDeck}</p>
      <div className="pf-reach-l">
        {contact.phone ? <a href={`tel:${contact.phone}`}><Icon name="phone" size={18} /><span><small>{copy.phone}</small><b dir="ltr">{contact.phone}</b></span><ArrowIcon size={18} /></a> : null}
        {contact.whatsapp ? <a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noreferrer"><Icon name="chat" size={18} /><span><small>{copy.whatsapp}</small><b dir="ltr">{contact.whatsapp}</b></span><ArrowIcon size={18} /></a> : null}
        {contact.email ? <a href={`mailto:${contact.email}`}><Icon name="mail" size={18} /><span><small>{copy.email}</small><b dir="ltr">{contact.email}</b></span><ArrowIcon size={18} /></a> : null}
      </div>
    </section>
  ) : null;

  const top = (
    <header className="pf-bk-top">
      <span className="pf-bk-av" style={{ ['--tone' as string]: tone || 'var(--card2)' }} aria-hidden="true">
        {shot ? <img src={shot} alt="" /> : <b>{talentName.trim().charAt(0) || '·'}</b>}
      </span>
      <span className="min-w-0">
        <span className="eyebrow">{copy.service}</span>
        <strong dir="auto">{talentName}</strong>
      </span>
    </header>
  );

  const notes = (
    <ul className="pf-bk-notes">
      <li><Icon name="shield" size={18} /><span>{t.noteTeam(copy.wordmark)}</span></li>
      <li><Icon name="coin" size={18} /><span>{t.notePrice}</span></li>
    </ul>
  );

  if (session === undefined) {
    return (
      <div className="card pf-bk">
        {top}
        <p className="wait" role="status"><i /><i /><i /><span className="sr-only">{copy.loading}</span></p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card pf-bk">
        {top}
        <h2 className="pf-bk-h">{t.loginTitle}</h2>
        <p className="pf-bk-deck">{acct.guestOrder}</p>
        <Link className="btn btn-acc btn-block" href={loginHref}>
          <span>{t.loginBtn}</span><ArrowIcon />
        </Link>
        <Link className="btn btn-ghost btn-block" href={joinHref}>{acct.newUser}</Link>
        {notes}
      </div>
    );
  }

  return (
    <div className="card pf-bk">
      {top}
      {availability === 'paused' ? (
        <p className="pf-verdict"><Icon name="pause" size={20} /><span>{copy.pausedAsk}</span></p>
      ) : session.user.role === 'client' && !canOrder(session.user) ? (
        <p className="pf-verdict"><Icon name="clock" size={20} /><span>{acct.companyPending}</span></p>
      ) : !canOrder(session.user) ? (
        <p className="pf-verdict"><Icon name="info" size={20} /><span>{acct.noOrder}</span></p>
      ) : done ? (
        <div className="pf-done" role="status">
          <SuccessBurst />
          <p className="pf-bk-h">{copy.pendingRequest}</p>
          <Link className="btn btn-ghost btn-block" href={`/${locale}/orders`}>
            <span>{t.ordersBtn}</span><ArrowIcon />
          </Link>
        </div>
      ) : (
        <form className="pf-form" onSubmit={submit}>
          <h2 className="pf-bk-h">{copy.serviceTitle}</h2>
          <p className="pf-bk-deck">{copy.serviceDeck}</p>
          <Float label={copy.workTitle} name="title" required dir="auto" defaultValue={talentName} />
          <FloatArea label={copy.serviceDetails} name="details" required minLength={10} dir="auto" />
          {error ? <p className="err" role="alert" dir="auto">{error}</p> : null}
          <button className="btn btn-acc btn-block" type="submit" disabled={saving}>
            <span>{saving ? copy.sending : t.book}</span><ArrowIcon />
          </button>
          {notes}
        </form>
      )}
      {company}
    </div>
  );
}
