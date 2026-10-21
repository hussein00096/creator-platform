'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/copy-auth';
import { getCopy } from '@/lib/copy';
import { safeNext } from '@/lib/reach';
import { saveSession } from '@/lib/session';
import type { Account, Locale } from '@/lib/types';
import { AuthShell } from './auth-shell';
import { Float } from './fields';
import { ArrowIcon } from './icons';

export function LoginForm({ locale, next = '' }: { locale: Locale; next?: string }) {
  const copy = getCopy(locale);
  const t = getAuth(locale);
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await api<{ token: string; user: Account }>('/api/v1/auth/login', {
        method: 'POST',
        body: { phone, password },
      });
      saveSession(result.data.token, result.data.user);
      const target = safeNext(next, locale);
      const role = result.data.user.role;
      if (target) router.push(target);
      else if (role === 'admin') router.push(`/${locale}/admin`);
      else if (role === 'influencer') router.push(`/${locale}/studio`);
      else router.push(`/${locale}/account`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.offline);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell locale={locale} mode="login">
      <form className="au-form" onSubmit={submit}>
        <Float
          label={t.loginId}
          name="username"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          dir="ltr"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="au-phone-hint"
          extra={<span className="hint" id="au-phone-hint">{t.phoneHint}</span>}
        />
        <Float label={copy.password} value={password} onChange={(event) => setPassword(event.target.value)} type="password" required dir="ltr" autoComplete="current-password" />
        {error ? <p className="err au-err" role="alert" dir="auto">{error}</p> : null}
        <button className="btn btn-acc btn-block" type="submit" disabled={saving}>
          <span>{saving ? copy.sending : copy.enter}</span><ArrowIcon />
        </button>
      </form>
    </AuthShell>
  );
}
