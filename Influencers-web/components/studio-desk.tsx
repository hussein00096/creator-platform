'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { readSession, type Session } from '@/lib/session';
import type { Influencer, Locale } from '@/lib/types';
import { DashShell, DashWait } from './dash-shell';
import { Gate } from './desk';
import { ArrowIcon, Icon } from './icons';
import { FilePick } from './pick';


export function StudioDesk({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const t = getDashboard(locale);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [person, setPerson] = useState<Influencer | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      setReady(true);
      return;
    }
    setToken(session.token);
    setRole(session.user.role);
    setUser(session.user);
    if (session.user.role !== 'influencer') {
      setReady(true);
      return;
    }
    api<Influencer>('/api/v1/me/profile', { token: session.token })
      .then((result) => setPerson(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : copy.offline))
      .finally(() => setReady(true));
  }, [copy.offline]);

  async function send(path: string, method: string, form?: FormData) {
    if (!token) return;
    setError('');
    try {
      const result = await api<Influencer>(path, { method, token, form });
      setPerson(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    }
  }

  async function upload(path: string, field: 'image' | 'images', files: File[]) {
    if (!files.length) return;
    const form = new FormData();
    files.forEach((file) => form.append(field === 'images' ? 'images' : 'image', file));
    await send(path, 'POST', form);
  }

  if (!ready) return <DashWait label={copy.loading} />;
  if (!token) {
    return (
      <Gate eyebrow={copy.studio} title={copy.studioTitle} deck={copy.studioLogin} shot="/scenes/camera.jpg">
        <Link className="btn btn-acc mag" href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/studio`)}`}><span>{copy.enter}</span><ArrowIcon /></Link>
      </Gate>
    );
  }
  if (role !== 'influencer' || !person?.profile) {
    return <Gate eyebrow={copy.studio} title={copy.studioTitle} deck={error || copy.studioOnly} shot="/scenes/camera.jpg" />;
  }

  const profile = person.profile;

  return (
    <DashShell locale={locale} user={user || { id: person.id, name: person.name, role }} page="studio" eyebrow={copy.studio} title={copy.studioTitle} deck={copy.studioDeck}>
      {person.status !== 'approved' ? <p className="ds-note" role="status">{copy.studioPending}</p> : null}
      {error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : null}

      <div className="ds-pair">
        <section className="card ds-slot is-portrait">
          <header className="ds-slot-head">
            <span className="pn-n stroke disp" aria-hidden="true">01</span>
            <h2 className="ds-h2">{copy.avatarLabel}</h2>
          </header>
          <FilePick
            locale={locale}
            label={copy.pickPhoto}
            preview={profile.avatar}
            files={[]}
            frame="portrait"
            onChange={(files) => upload('/api/v1/me/avatar', 'image', files)}
          />
          {profile.avatar ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => send('/api/v1/me/avatar', 'DELETE')}><Icon name="trash" size={18} />{copy.removePhoto}</button> : null}
        </section>
        <section className="card ds-slot is-cover">
          <header className="ds-slot-head">
            <span className="pn-n stroke disp" aria-hidden="true">02</span>
            <h2 className="ds-h2">{copy.coverLabel}</h2>
          </header>
          <FilePick
            locale={locale}
            label={copy.pickPhoto}
            preview={profile.cover}
            files={[]}
            frame="cover"
            onChange={(files) => upload('/api/v1/me/cover', 'image', files)}
          />
          {profile.cover ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => send('/api/v1/me/cover', 'DELETE')}><Icon name="trash" size={18} />{copy.removePhoto}</button> : null}
        </section>
      </div>

      <section className="card ds-slot ds-gal">
        <header className="ds-slot-head">
          <span className="pn-n stroke disp" aria-hidden="true">03</span>
          <div className="min-w-0 flex-1">
            <h2 className="ds-h2">{copy.gallery}</h2>
            <p className="pn-deck">{t.galleryHint}</p>
          </div>
          <span className="ds-gal-n disp" dir="ltr">{String(profile.portfolio.length).padStart(2, '0')}<i>/10</i></span>
        </header>
        <div className="ds-grid">
          {profile.portfolio.map((image) => (
            <figure key={image.id}>
              <img src={image.filePath} alt="" />
              <button type="button" className="ibtn ibtn-sm" onClick={() => send(`/api/v1/me/portfolio/${image.id}`, 'DELETE')} aria-label={copy.removePhoto}><Icon name="close" size={18} /></button>
            </figure>
          ))}
          {profile.portfolio.length < 10 ? (
            <FilePick
              locale={locale}
              label={copy.pickPhotos}
              files={[]}
              multiple
              frame="gallery"
              onChange={(files) => upload('/api/v1/me/portfolio', 'images', files)}
            />
          ) : null}
        </div>
      </section>
    </DashShell>
  );
}
