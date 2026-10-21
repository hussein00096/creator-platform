import Link from 'next/link';
import { ArrowIcon, Star } from '@/components/icons';
import { Reveal, Split } from '@/components/motion';
import { getAbout } from '@/lib/copy-about';
import { getCopy } from '@/lib/copy';
import { deco } from '@/lib/people';
import type { Locale } from '@/lib/types';

/** About page (spec 7.9): manifesto, story collage, real stats, paper values, lit statement, CTA. */
export function AboutStage({
  locale,
  total,
  specialties,
}: {
  locale: Locale;
  total: number;
  specialties: number;
}) {
  const copy = getCopy(locale);
  const t = getAbout(locale).about;
  const phrases = copy.aboutManifesto.split(/(?<=[،,.])\s+/);
  const stats = [
    { value: total, label: copy.approvedCount },
    { value: specialties, label: copy.statsSpecialties },
  ].filter((item) => item.value > 0);

  return (
    <article className="about">
      {/* Manifesto */}
      <header className="ab-hero wrap">
        <Reveal as="span" className="eyebrow" kind="fd">{t.eyebrow}</Reveal>
        <Split as="h1" text={t.title} className="h1 h1-s ab-title mt-5" delay={0.1} />
        <Reveal as="p" className="lead ab-lead" kind="fd" delay={0.8}>{copy.aboutDeck}</Reveal>
        <Star className="ab-star spin" size={56} />
      </header>

      {/* Story split */}
      <section className="sec">
        <div className="wrap grid grid-cols-[1fr_1fr] gap-[clamp(40px,6vw,96px)] items-center split">
          <div className="ab-collage" aria-hidden="true">
            <div className="ab-shot ab-shot-a clip"><img src="/scenes/fashion.jpg" alt="" className="px" /></div>
            <div className="ab-shot ab-shot-b clip"><img src="/scenes/camera.jpg" alt="" className="px" /></div>
            <div className="ab-shot ab-shot-c clip"><img src="/scenes/set.jpg" alt="" className="px" /></div>
          </div>
          <div>
            <div className="rv">
              <span className="eyebrow">{copy.aboutStoryTitle}</span>
              <h2 className="h2">{t.storyTitle}</h2>
            </div>
            <ol className="ab-story">
              {copy.aboutStory.map((item, index) => (
                <li key={item.title} className="rv">
                  <span className="ab-story-n disp" aria-hidden="true">{deco(index + 1, locale)}</span>
                  <div>
                    <h3 className="h3">{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Real stats */}
      {stats.length ? (
        <section className="sec !pt-0" aria-label={t.statsEyebrow}>
          <div className="wrap grid grid-cols-3 gap-[18px] g3">
            {[...stats, { value: 18, label: copy.statsAdult, suffix: '+' }].map((item) => (
              <div key={item.label} className="card ab-stat rv">
                <strong className="disp" dir="ltr">{item.value}{'suffix' in item ? item.suffix : ''}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Values on paper */}
      <section className="paper sec">
        <div className="wrap">
          <div className="sh rv">
            <div>
              <span className="eyebrow">{t.valuesEyebrow}</span>
              <h2 className="h2">{t.valuesTitle}</h2>
            </div>
          </div>
          <ol className="grid grid-cols-3 gap-[18px] g3">
            {t.values.map((item, index) => (
              <li key={item.title} className="rv">
                <div className="card ab-value lift">
                  <span className="ab-value-n stroke" aria-hidden="true">{deco(index + 1, locale)}</span>
                  <h3 className="h3">{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Scroll-lit statement */}
      <section className="sec">
        <div className="wrap">
          <span className="eyebrow rv">{t.statementEyebrow}</span>
          <p className="ab-statement disp">
            {phrases.map((phrase, index) => <span key={index} className="hlv">{phrase} </span>)}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-[clamp(72px,9vw,120px)]">
        <div className="wrap">
          <div className="zoom panel-acc ab-cta">
            <span className="eyebrow">{t.ctaEyebrow}</span>
            <h2 className="h2">{t.ctaTitle}</h2>
            <p className="ab-cta-p">{copy.promise}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${locale}/directory`} className="btn btn-dark mag">{copy.aboutCta}<ArrowIcon /></Link>
              <Link href={`/${locale}/join`} className="btn btn-ghost ab-cta-ghost">{copy.joinUs}</Link>
            </div>
            <Star className="ab-cta-star spin" size={140} color="#0E0D12" />
          </div>
        </div>
      </section>
    </article>
  );
}
