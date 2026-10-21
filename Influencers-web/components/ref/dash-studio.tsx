'use client';

// /studio in the ported dashboard shell (design/reference/dashboard.html). Uploads, deletes, gating and
// the 10-photo cap are the existing StudioDesk logic (components/studio-desk.tsx).
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashWait } from '@/components/dash-shell';
import { Gate } from '@/components/desk';
import { ArrowIcon } from '@/components/icons';
import { DashCard, RefDashShell, digits } from '@/components/ref/dash-shell';
import { Drop, Note } from '@/components/ref/dash-ui';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { getDashboard } from '@/lib/copy-dashboard';
import { readSession, type Session } from '@/lib/session';
import type { Influencer, Locale } from '@/lib/types';

const TRASH = 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13';

export function RefStudio({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const t = getDashboard(locale);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [person, setPerson] = useState<Influencer | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      const result = await api<Influencer>(path, { method, token, form });
      setPerson(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setBusy(false);
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
  const remove = (path: string) => (
    <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => send(path, 'DELETE')}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TRASH}></path></svg>
      {copy.removePhoto}
    </button>
  );

  return (
    <RefDashShell locale={locale} user={user || { id: person.id, name: person.name, role }} page="studio">
      <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {person.status !== 'approved' ? <Note>{copy.studioPending}</Note> : null}
        {error ? <Note tone="err">{error}</Note> : null}

        <div className="split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '24px', alignItems: 'start' }}>
          <DashCard title={copy.avatarLabel} delay={0.2}>
            <Drop label={profile.avatar ? copy.changePhoto : copy.pickPhotoAdd} preview={profile.avatar} frame="portrait" onChange={(files) => upload('/api/v1/me/avatar', 'image', files)} />
            {profile.avatar ? remove('/api/v1/me/avatar') : null}
          </DashCard>
          <DashCard title={copy.coverLabel} delay={0.3}>
            <Drop label={profile.cover ? copy.changePhoto : copy.pickPhotoAdd} preview={profile.cover} frame="cover" onChange={(files) => upload('/api/v1/me/cover', 'image', files)} />
            {profile.cover ? remove('/api/v1/me/cover') : null}
          </DashCard>
        </div>

        <DashCard
          title={copy.gallery}
          deck={t.galleryHint}
          delay={0.4}
          aside={<span className="disp" dir="ltr" style={{ fontSize: '28px', fontWeight: '900', lineHeight: '1' }}>{digits(profile.portfolio.length, locale)}<span style={{ fontSize: '16px', color: '#8A859B' }}>/{digits(10, locale)}</span></span>}
        >
          <div className="dsr-grid">
            {profile.portfolio.map((image) => (
              <figure key={image.id}>
                <img src={image.filePath} alt="" />
                <button type="button" className="ibtn" style={{ width: '40px', height: '40px' }} disabled={busy} onClick={() => send(`/api/v1/me/portfolio/${image.id}`, 'DELETE')} aria-label={copy.removePhoto}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
                </button>
              </figure>
            ))}
            {profile.portfolio.length < 10 ? (
              <Drop label={copy.pickPhotosAdd} multiple frame="gallery" onChange={(files) => upload('/api/v1/me/portfolio', 'images', files)} />
            ) : null}
          </div>
        </DashCard>
      </div>
    </RefDashShell>
  );
}
