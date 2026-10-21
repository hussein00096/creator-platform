'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowIcon } from '@/components/icons';
import { getAbout } from '@/lib/copy-about';
import { getCopy } from '@/lib/copy';

export default function NotFound() {
  const path = usePathname() || '/ar';
  const locale = path.startsWith('/en') ? 'en' : 'ar';
  const copy = getCopy(locale);
  const t = getAbout(locale).lost;
  return (
    <section className="lost wrap">
      <span className="lost-code stroke" aria-hidden="true">404</span>
      <span className="eyebrow">{t.eyebrow}</span>
      <h1 className="h2 lost-title">{copy.missing}</h1>
      <p className="lead lost-lead">{t.lead}</p>
      <div className="lost-actions">
        <Link className="btn btn-acc mag" href={`/${locale}`}>{copy.back}<ArrowIcon /></Link>
        <Link className="btn btn-ghost" href={`/${locale}/directory`}>{t.directory}</Link>
      </div>
    </section>
  );
}
