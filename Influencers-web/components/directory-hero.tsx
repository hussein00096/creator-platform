import Link from 'next/link';
import { ArrowIcon, Star } from '@/components/icons';
import { Split } from '@/components/motion';
import { Crumbs, Portrait, Verified } from '@/components/ui';
import { getBq } from '@/lib/copy-bq';
import { getCopy } from '@/lib/copy';
import { getDirectory } from '@/lib/copy-directory';
import { toCard } from '@/lib/people';
import type { Influencer, Locale } from '@/lib/types';

/** Directory hero: crumbs, split headline, live stats, and a shuffling deck of three featured creators. */
export function DirectoryHero({
  locale,
  total,
  fields,
  available,
  deck,
}: {
  locale: Locale;
  total: number | null;
  fields: number;
  available: number | null;
  deck: Influencer[];
}) {
  const copy = getCopy(locale);
  const t = getDirectory(locale);
  const card = getBq(locale).card;
  const cards = deck.slice(0, 3).map((person) => toCard(locale, person));

  return (
    <header className="wrap dh">
      <div className="dh-copy">
        <Crumbs items={[{ label: copy.home, href: `/${locale}` }, { label: copy.directory }]} />
        <Split text={t.title} className="h1 h1-s dh-h1" />
        <p className="lead fd dh-lead" style={{ animationDelay: '.5s' }}>{t.lead}</p>
        <ul className="dh-stats fd" style={{ animationDelay: '.65s' }}>
          {total !== null ? <li><strong className="disp">{total}</strong><span>{t.statTotal}</span></li> : null}
          {fields ? <li><strong className="disp">{fields}</strong><span>{t.statFields}</span></li> : null}
          {available !== null ? <li><i className="live" aria-hidden="true" /><strong className="disp">{available}</strong><span>{t.statLive}</span></li> : null}
        </ul>
      </div>

      <div className="dh-art hide-m" aria-label={cards.length ? t.deckLabel : undefined} role={cards.length ? 'group' : undefined}>
        <svg className="dh-ring spin" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="3 5" />
        </svg>
        <div className="dh-deck">
          {cards.map((person, index) => (
            <article key={person.id} className="dsk" style={{ ['--i' as string]: index }}>
              <Portrait shot={person.shot} tone={person.tone} className="dsk-ph" eager>
                <span className="dsk-shade" aria-hidden="true" />
                <span className="dsk-tags">
                  {person.category ? <span className="tag">{person.category}</span> : null}
                  {person.available ? <span className="tag"><i className="live" aria-hidden="true" />{t.available}</span> : null}
                </span>
              </Portrait>
              <div className="dsk-body">
                <div className="min-w-0">
                  <strong className="cc-name"><span dir="auto">{person.name}</span><Verified label={card.verified} /></strong>
                  {person.place ? <span className="cc-meta">{person.place}</span> : null}
                </div>
                <Link href={`/${locale}/talent/${person.id}`} className="ibtn ibtn-sm dsk-go" aria-label={t.open(person.name)}>
                  <ArrowIcon size={18} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <span className="dh-badge dh-week fl" aria-hidden="true"><Star size={16} color="currentColor" />{t.deckWeek}</span>
        <span className="dh-badge dh-fast fl" style={{ animationDelay: '-3s' }} aria-hidden="true"><span>+</span>{t.deckFast}</span>
      </div>
    </header>
  );
}
