'use client';

import { usePathname } from 'next/navigation';
import { ArrowIcon, Logo } from '@/components/icons';
import { getAbout } from '@/lib/copy-about';
import { getCopy } from '@/lib/copy';

/** Unmatched URLs render outside the locale layout (no navbar), so this page carries its own logo. */
export default function NotFound() {
  const path = usePathname() || '';
  const locale = path.startsWith('/en') ? 'en' : 'ar';
  const copy = getCopy(locale);
  const t = getAbout(locale).lost;
  const home = `/${locale}`;
  return (
    <main className="lost-page" dir={locale === 'en' ? 'ltr' : 'rtl'} lang={locale}>
      <header className="wrap lost-top">
        <a href={home} className="logo"><Logo /><span>{copy.wordmark}</span></a>
      </header>
      <section className="lost wrap">
        <span className="lost-code stroke" aria-hidden="true">404</span>
        <span className="eyebrow">{t.eyebrow}</span>
        <h1 className="h2 lost-title">{copy.missing}</h1>
        <p className="lead lost-lead">{t.lead}</p>
        <div className="lost-actions">
          <a className="btn btn-acc mag" href={home}>{copy.back}<ArrowIcon /></a>
          <a className="btn btn-ghost" href={`${home}/directory`}>{t.directory}</a>
        </div>
      </section>
    </main>
  );
}
