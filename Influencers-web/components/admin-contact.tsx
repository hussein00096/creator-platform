'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { getAdmin } from '@/lib/copy-admin';
import { getCopy } from '@/lib/copy';
import type { Contact } from '@/lib/types';
import { AdminHead, AdminWait, errText, useAdmin } from './admin-shell';

const BASICS: (keyof Contact)[] = ['companyName', 'phone', 'whatsapp', 'email', 'website', 'address'];
const SOCIAL: (keyof Contact)[] = ['instagram', 'tiktok', 'facebook', 'snapchat', 'xAccount'];
const LTR = new Set<keyof Contact>(['phone', 'whatsapp', 'email', 'website', 'instagram', 'tiktok', 'facebook', 'snapchat', 'xAccount']);
const TYPE: Partial<Record<keyof Contact, string>> = { phone: 'tel', whatsapp: 'tel', email: 'email' };

const EMPTY: Contact = {
  companyName: '', phone: '', whatsapp: '', email: '', address: '', website: '',
  instagram: '', tiktok: '', facebook: '', snapchat: '', xAccount: '',
};

/** Platform contact form → PUT /admin/platform-contact. */
export function AdminContact() {
  const { locale, token } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const [form, setForm] = useState<Contact | null>(null);
  const [saved, setSaved] = useState<Contact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api<Contact | null>('/api/v1/platform-contact')
      .then((result) => {
        const value = { ...EMPTY, ...Object.fromEntries(Object.entries(result.data || {}).map(([k, v]) => [k, v ?? ''])) } as Contact;
        setForm(value);
        setSaved(value);
      })
      .catch((err) => setError(errText(err, copy.offline)));
  }, [copy.offline]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setError('');
    setOk(false);
    try {
      const result = await api<Contact>('/api/v1/admin/platform-contact', { method: 'PUT', token, body: form });
      const value = { ...EMPTY, ...result.data };
      setForm(value);
      setSaved(value);
      setOk(true);
    } catch (err) {
      setError(errText(err, copy.offline));
    } finally {
      setBusy(false);
    }
  }

  const dirty = !!form && !!saved && (Object.keys(EMPTY) as (keyof Contact)[]).some((key) => form[key] !== saved[key]);

  const field = (key: keyof Contact) => (
    <div className={`fld${key === 'address' ? ' ad-wide' : ''}`} key={key}>
      <label className="lbl" htmlFor={`ad-c-${key}`}>{t.contactFields[key]}</label>
      {key === 'address' ? (
        <textarea id={`ad-c-${key}`} className="inp ad-area-in" rows={2} maxLength={500} value={form?.[key] || ''} dir="auto" onChange={(event) => { setForm((prev) => prev && { ...prev, [key]: event.target.value }); setOk(false); }} />
      ) : (
        <input
          id={`ad-c-${key}`}
          className="inp"
          type={TYPE[key] || 'text'}
          maxLength={500}
          value={form?.[key] || ''}
          dir={LTR.has(key) ? 'ltr' : 'auto'}
          onChange={(event) => { setForm((prev) => prev && { ...prev, [key]: event.target.value }); setOk(false); }}
        />
      )}
    </div>
  );

  return (
    <>
      <AdminHead eyebrow={t.navContact} title={t.contactTitle} deck={t.contactDeck} />
      {!form ? (
        error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : <AdminWait label={copy.loading} />
      ) : (
        <form className="ds-form" onSubmit={submit}>
          <section className="card ds-panel">
            <header className="ds-panel-head"><h2 className="ds-h2">{t.groupBasics}</h2></header>
            <div className="ad-grid">{BASICS.map(field)}</div>
          </section>
          <section className="card ds-panel">
            <header className="ds-panel-head"><h2 className="ds-h2">{t.groupSocial}</h2></header>
            <div className="ad-grid">{SOCIAL.map(field)}</div>
          </section>
          <div className="ds-save is-sticky">
            <div className="ds-save-msg" aria-live="polite">
              {error ? <p className="err" dir="auto" role="alert">{error}</p> : ok ? <p className="ok-msg">{t.saved}</p> : null}
            </div>
            <button type="submit" className="btn btn-acc" disabled={busy || !dirty}>{busy ? t.saving : t.saveContact}</button>
          </div>
        </form>
      )}
    </>
  );
}
