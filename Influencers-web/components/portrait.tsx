import Link from 'next/link';
import { getCopy } from '@/lib/copy';
import { categoryLabel, languageLabel, placeLabel } from '@/lib/names';
import type { Influencer, Locale } from '@/lib/types';

export function yearsLabel(locale: Locale, years: number | undefined) {
  if (!years) return '';
  if (locale === 'en') return `${years} ${years === 1 ? 'year' : 'years'}`;
  if (years === 1) return 'سنة واحدة';
  if (years === 2) return 'سنتان';
  if (years <= 10) return `${years} سنوات`;
  return `${years} سنة`;
}

export function Portrait({ person, locale, index }: { person: Influencer; locale: Locale; index?: number }) {
  const copy = getCopy(locale);
  const profile = person.profile;
  const cover = profile?.avatar || profile?.cover || profile?.portfolio?.[0]?.filePath;
  const second = profile?.portfolio?.[1]?.filePath || profile?.cover || null;
  const letter = person.name.trim().charAt(0) || '·';
  const category = profile?.categories?.[0];
  const place = profile?.locationScope === 'inside_iraq'
    ? placeLabel(locale, profile.governorate)
    : placeLabel(locale, profile?.country);
  const years = yearsLabel(locale, profile?.experienceYears);
  const languages = (profile?.languages || []).slice(0, 2).map((item) => languageLabel(locale, item));
  const state = profile?.availability || 'active';
  const n = index ?? 0;

  return (
    <Link
      href={`/${locale}/talent/${person.id}`}
      className="card"
      data-shape={n % 5 === 1 || n % 5 === 3 ? 'tall' : 'base'}
      data-reveal="rise"
      style={{ ['--d' as string]: `${(n % 3) * 0.08}s` }}
    >
      <span className="card-shot">
        {cover ? <img src={cover} alt="" /> : <b className="display" dir="auto">{letter}</b>}
        {second && second !== cover ? <img className="card-alt" src={second} alt="" /> : null}
        <em className="state" data-state={state}><i />{copy.workStateMap[state]}</em>
        <span className="card-num">{String(n + 1).padStart(2, '0')}</span>
      </span>
      <span className="card-body">
        <span className="card-row">
          <strong className="display" dir="auto">{person.name}</strong>
          <span className="card-go" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </span>
        </span>
        <span className="card-meta">
          {category ? <span>{categoryLabel(locale, category)}</span> : null}
          {place ? <span>{place}</span> : null}
          {years ? <span>{years}</span> : null}
          {languages.map((item) => <span key={item}>{item}</span>)}
        </span>
      </span>
    </Link>
  );
}
