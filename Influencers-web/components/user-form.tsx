'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { getAccount } from '@/lib/copy-account';
import { getCopy } from '@/lib/copy';
import { deco } from '@/lib/people';
import { safeNext } from '@/lib/reach';
import { saveSession } from '@/lib/session';
import type { Account, Locale } from '@/lib/types';
import { AuthSection, AuthShell } from './auth-shell';
import { Float } from './fields';
import { ArrowIcon } from './icons';

/** Normal account sign-up: name, phone and/or e-mail, password. Signs in and redirects on success. */
export function UserForm({ locale, next = '' }: { locale: Locale; next?: string }) {
  const copy = getCopy(locale);
  const a = getAccount(locale);
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length ? 1 : 0;

  function check() {
    if (name.trim().length < 2) return a.needName;
    const tel = phone.replace(/[\s\-()]/g, '');
    const mail = email.trim();
    if (!tel && !mail) return a.needId;
    if (tel && !/^\+?\d{7,15}$/.test(tel)) return a.badPhone;
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return a.badEmail;
    if (password.length < 8) return a.needPassword;
    return '';
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = check();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const result = await api<{ token: string; user: Account }>('/api/v1/auth/register/user', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          password,
        },
      });
      saveSession(result.data.token, result.data.user);
      router.push(safeNext(next, locale) || `/${locale}/account`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
      setSaving(false);
    }
  }

  return (
    <AuthShell locale={locale} mode="user">
      <form className="au-form" onSubmit={submit} noValidate>
        <AuthSection index={deco(1, locale)} title={a.userTitle} deck={a.userDeck}>
          <Float label={copy.name} value={name} onChange={(event) => setName(event.target.value)} dir="auto" required minLength={2} autoComplete="name" />
        </AuthSection>
        <AuthSection index={deco(2, locale)} title={a.idTitle} deck={a.idDeck}>
          <div className="au-two">
            <Float label={copy.phone} value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" inputMode="tel" autoComplete="tel" />
            <Float label={copy.email} value={email} onChange={(event) => setEmail(event.target.value)} type="email" dir="ltr" autoComplete="email" autoCapitalize="none" />
          </div>
          <Float
            label={copy.password}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={8}
            dir="ltr"
            autoComplete="new-password"
            aria-describedby="au-pass-hint"
            extra={(
              <>
                <b className="au-strength" data-n={strength} aria-hidden="true"><s /><s /><s /></b>
                <span className="hint" id="au-pass-hint">{copy.joinPasswordHint}</span>
              </>
            )}
          />
          <p className="hint au-hint">{a.privacy}</p>
        </AuthSection>
        {error ? <p className="err au-err" role="alert" dir="auto">{error}</p> : null}
        <button className="btn btn-acc btn-block" type="submit" disabled={saving}>
          <span>{saving ? copy.sending : a.create}</span><ArrowIcon />
        </button>
      </form>
    </AuthShell>
  );
}
