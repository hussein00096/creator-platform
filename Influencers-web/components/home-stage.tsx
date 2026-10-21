'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { ArrowIcon, Icon, Star, doorIcon } from '@/components/icons';
import { Marquee, Split } from '@/components/motion';
import { CreatorCard, ModelCard, SectionHead, TrendCard, WallCard } from '@/components/ui';
import { Faq, SegControl, Slider } from '@/components/ui-client';
import { ReelPhone, Viewfinder } from '@/components/flair';
import { getCopy } from '@/lib/copy';
import { getBq } from '@/lib/copy-bq';
import { deco, type CardPerson } from '@/lib/people';
import type { Locale } from '@/lib/types';

export type HomeField = {
  id: number;
  slug: string;
  name: string;
  count: number;
  href: string;
  people: number[];
  minis: { shot: string | null; tone: string }[];
};
export type HomeChip = { name: string; href: string };

export function HomeStage({
  locale,
  offline,
  people,
  fields,
  chips,
  models,
  modelsHref,
}: {
  locale: Locale;
  offline: boolean;
  people: CardPerson[];
  fields: HomeField[];
  chips: HomeChip[];
  models: CardPerson[];
  modelsHref: string;
}) {
  const copy = getCopy(locale);
  const t = getBq(locale).home;
  const card = getBq(locale).card;
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [field, setField] = useState<number | 'all'>('all');
  const [mode, setMode] = useState<'brands' | 'creators'>('brands');
  const href = (person: CardPerson) => `/${locale}/talent/${person.id}`;

  function search(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    router.push(`/${locale}/directory${params.toString() ? `?${params}` : ''}`);
  }

  // The wall needs enough cards to fill two rows; repeat real creators if there are few.
  const wall = useMemo(() => {
    if (!people.length) return [[], []] as CardPerson[][];
    const filled: CardPerson[] = [];
    while (filled.length < 16) filled.push(...people);
    const half = Math.ceil(filled.length / 2);
    return [filled.slice(0, half), filled.slice(half, half * 2)];
  }, [people]);

  const pickFields = fields.filter((item) => item.people.length);
  const reel = people.filter((person) => person.shot).slice(0, 8);
  const reelChips = [...new Set(reel.map((person) => person.category).filter(Boolean))].slice(0, 3);
  const picked = (field === 'all' ? people : people.filter((person) => fields.find((item) => item.id === field)?.people.includes(person.id))).slice(0, 8);
  const steps = mode === 'brands' ? t.brandSteps : t.creatorSteps;

  return (
    <div className="home">
      {/* Hero */}
      <section className="hm-hero" data-sparkle="">
        <div className="wrap text-center flex flex-col items-center">
          <span className="hm-pill fd" style={{ animationDelay: 'calc(var(--pd) + 0s)' }}><i className="live" />{t.pill}</span>
          <Split text={t.title} className="h1 hm-title" delay={0.15} />
          <p className="lead hm-lead fd" style={{ animationDelay: 'calc(var(--pd) + .9s)' }}>{t.lead}</p>
          <form className="hm-search fd" style={{ animationDelay: 'calc(var(--pd) + 1.05s)' }} onSubmit={search} role="search">
            <Icon name="search" className="hm-search-i" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPh} aria-label={t.searchLabel} dir="auto" />
            <button type="submit" className="btn btn-acc mag">{t.searchBtn}</button>
          </form>
          {chips.length ? (
            <div className="hm-chips fd" style={{ animationDelay: 'calc(var(--pd) + 1.2s)' }}>
              <span>{t.popular}</span>
              {chips.map((chip) => <Link key={chip.href} href={chip.href} className="chip chip-sm">{chip.name}</Link>)}
            </div>
          ) : null}
        </div>
        <Star className="hm-star spin" size={44} />
        <span className="hm-ring spin" aria-hidden="true" />
      </section>

      {/* 3D creator wall */}
      {people.length ? (
        <section className="hm-wall-w fd" style={{ animationDelay: 'calc(var(--pd) + 1.1s)' }} aria-label={copy.directory}>
          <div className="wall hm-wall">
            <div className="wall-in">
              <Marquee items={wall[0].map((person, index) => <WallCard key={`${person.id}-${index}`} person={person} href={href(person)} label={index < people.length ? person.name : undefined} />)} itemClass="contents" />
              <Marquee reverse items={wall[1].map((person, index) => <WallCard key={`${person.id}-b${index}`} person={person} href={href(person)} />)} itemClass="contents" />
            </div>
          </div>
          <Viewfinder label={t.viewfinder} />
        </section>
      ) : offline ? (
        <p className="empty">{t.offline}</p>
      ) : null}

      {/* Trending */}
      {people.length ? (
        <section className="sec">
          {/* TODO: no "trending" data in the API yet — this shows the API's default order. */}
          <Slider
            prevLabel={t.prev}
            nextLabel={t.next}
            head={<SectionHead eyebrow={t.trendEyebrow} title={t.trendTitle} className="!mb-10" />}
          >
            {people.slice(0, 8).map((person, index) => (
              <TrendCard key={person.id} person={person} href={href(person)} rank={deco(index + 1, locale)} />
            ))}
          </Slider>
        </section>
      ) : null}

      {/* Phone reel: profiles played like stories */}
      {reel.length >= 2 ? (
        <section className="sec !pt-0">
          <div className="wrap hm-reel">
            <div className="rv">
              <span className="eyebrow">{t.reelEyebrow}</span>
              <Split as="h2" text={t.reelTitle} className="h2" delay={0} step={0.06} />
              <p className="lead mt-6 max-w-[520px]">{t.reelLead}</p>
              <ul className="hm-reel-points">
                {t.reelPoints.map((point) => <li key={point}><span className="vf" aria-hidden="true"><Icon name="check" size={12} /></span>{point}</li>)}
              </ul>
              <Link href={`/${locale}/directory`} className="btn btn-ghost mag mt-9">{t.reelCta}<ArrowIcon /></Link>
            </div>
            <div className="hm-reel-stage" data-sparkle="">
              <span className="hm-reel-ring spin" aria-hidden="true" />
              {reelChips.map((chip, index) => (
                <span key={chip} className={`hm-reel-chip fl ${['is-a', 'is-b', 'is-c'][index]}`} aria-hidden="true"><span>{index === 1 ? <Star size={16} color="#0E0D12" /> : null}{chip}</span></span>
              ))}
              <ReelPhone people={reel} hrefFor={href} labels={{ view: card.view, prev: t.prev, next: t.next, region: t.reelRegion }} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Category index rows */}
      {fields.length ? (
        <section className="sec !pt-0">
          <div className="wrap">
            <SectionHead eyebrow={t.catsEyebrow} title={t.catsTitle} />
            <div className="rows">
              {fields.map((item, index) => (
                <Link key={item.id} href={item.href} className="row">
                  <span className="rl">
                    <span className="rn">{deco(index + 1, locale)}</span>
                    <span className="rt">{item.name}</span>
                  </span>
                  <span className="rr">
                    <span className="rn hide-m">{item.count} {t.specialties}</span>
                    {item.minis.length ? (
                      <span className="rp" aria-hidden="true">
                        {item.minis.map((mini, mi) => (
                          <span key={mi} style={{ ['--tone' as string]: mini.tone }}>{mini.shot ? <img src={mini.shot} alt="" loading="lazy" /> : null}</span>
                        ))}
                      </span>
                    ) : null}
                    <span className="ra" aria-hidden="true"><Icon name={doorIcon[item.slug] || 'arrow'} size={22} /></span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Models on paper */}
      {models.length ? (
        <section className="paper sec">
          <div className="wrap">
            <SectionHead
              eyebrow={t.modelsEyebrow}
              title={t.modelsTitle}
              action={<Link href={modelsHref} className="btn btn-ghost">{t.modelsAll}<ArrowIcon /></Link>}
            />
            <div className="cgrid">
              {models.map((person) => (
                <div key={person.id} className="clip">
                  <ModelCard person={person} href={href(person)} liveLabel={t.modelsLive} bookLabel={t.modelsBook} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Pick the face */}
      {people.length ? (
        <section className="sec">
          <div className="wrap">
            <SectionHead eyebrow={t.pickEyebrow} title={<Split as="span" text={t.pickTitle} className="block" delay={0} step={0.06} />} />
            {pickFields.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-8 hm-filter" role="group" aria-label={t.pickEyebrow}>
                <button type="button" className={`chip${field === 'all' ? ' on' : ''}`} aria-pressed={field === 'all'} onClick={() => setField('all')}>{t.pickAll}</button>
                {pickFields.map((item) => (
                  <button key={item.id} type="button" className={`chip${field === item.id ? ' on' : ''}`} aria-pressed={field === item.id} onClick={() => setField(item.id)}>{item.name}</button>
                ))}
              </div>
            ) : null}
            {picked.length ? (
              <div className="cgrid" key={String(field)}>
                {picked.map((person, index) => (
                  <div key={person.id} className="pop" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CreatorCard person={person} href={href(person)} viewLabel={card.view} verifiedLabel={card.verified} />
                  </div>
                ))}
              </div>
            ) : <p className="empty">{t.pickEmpty}</p>}
            <div className="flex justify-center mt-12">
              <Link href={`/${locale}/directory`} className="btn btn-ghost mag">{t.seeAll}<ArrowIcon /></Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Bands */}
      <section className="hm-bands" aria-hidden="true">
        <div className="band band-acc">
          <Marquee items={(fields.length ? fields.map((item) => item.name) : t.services).map((name) => <>{name}</>)} sep={<Star size={26} color="#0E0D12" />} />
        </div>
        <div className="band band-dark">
          <Marquee reverse slow items={t.services.map((name) => <>{name}</>)} sep={<Star size={26} />} />
        </div>
      </section>

      {/* How it works */}
      <section className="paper sec">
        <div className="wrap">
          <div className="sh rv">
            <div>
              <span className="eyebrow">{t.howEyebrow}</span>
              <h2 className="h2">{t.howTitle}</h2>
            </div>
            <SegControl value={mode} onChange={setMode} label={t.howLabel} options={[{ value: 'brands', label: t.howBrands }, { value: 'creators', label: t.howCreators }]} />
          </div>
          <ol className="grid grid-cols-3 gap-[18px] steps" key={mode}>
            {steps.map((step, index) => (
              <li key={step.title} className="card hm-step pop" style={{ animationDelay: `${index * 0.1}s` }}>
                <span className="hm-step-n stroke" aria-hidden="true">{deco(index + 1, locale)}</span>
                <h3 className="h3">{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Services bento */}
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow={t.bentoEyebrow} title={<Split as="span" text={t.bentoTitle} className="block" delay={0} step={0.06} />} />
          <div className="bento">
            <article className="card hm-b hm-b-big rv">
              <div>
                <Icon name="megaphone" size={28} className="ac" />
                <h3 className="h3 mt-5">{t.bento.campaigns.title}</h3>
                <p className="lead text-[16px] mt-2">{t.bento.campaigns.text}</p>
              </div>
              <div className="hm-camp" aria-label={t.bento.demo}>
                <small>{t.bento.demo}</small>
                {t.bento.campaignRows.map((row, index) => (
                  <div key={row.name}>
                    <span>{row.name}</span>
                    <span className={`pill ${['pill-active', 'pill-pending', 'pill-done'][index]}`}>{row.state}</span>
                  </div>
                ))}
              </div>
            </article>
            <Link href={modelsHref} className="hm-b hm-b-acc panel-acc rv">
              <Icon name="hanger" size={30} />
              <div>
                <h3 className="h3">{t.bento.models.title}</h3>
                <p className="mt-2 text-[16px] leading-[1.7]">{t.bento.models.text}</p>
              </div>
              <span className="ibtn !border-[#0E0D12] !text-[#0E0D12] self-end" aria-hidden="true"><ArrowIcon /></span>
            </Link>
            <article className="card hm-b rv">
              <div className="hm-bars" aria-hidden="true">
                {[46, 72, 58, 90, 66, 100].map((value, index) => <i key={index} className="bar" style={{ height: `${value}%`, animationDelay: `${index * 0.2}s` }} />)}
              </div>
              <h3 className="h3">{t.bento.reports.title}</h3>
              <p className="lead text-[16px] mt-2">{t.bento.reports.text}</p>
            </article>
            <article className="card hm-b rv">
              <Icon name="shield" size={28} className="ac" />
              <h3 className="h3 mt-auto">{t.bento.contracts.title}</h3>
              <p className="lead text-[16px] mt-2">{t.bento.contracts.text}</p>
            </article>
            <article className="card hm-b rv">
              <Icon name="camera" size={28} className="ac" />
              <h3 className="h3 mt-auto">{t.bento.production.title}</h3>
              <p className="lead text-[16px] mt-2">{t.bento.production.text}</p>
            </article>
          </div>
        </div>
      </section>

      {/* Scroll-lit statement */}
      <section className="sec">
        <div className="wrap">
          <p className="hm-statement disp">
            {t.statement.map((phrase) => <span key={phrase} className="hlv">{phrase} </span>)}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec !pt-0">
        <div className="wrap grid grid-cols-[1fr_1.4fr] gap-16 faqw">
          <div className="rv">
            <span className="eyebrow">{t.faqEyebrow}</span>
            <h2 className="h2">{t.faqTitle}</h2>
            <p className="lead mt-5 max-w-[380px]">{t.faqLead}</p>
            <Link href={`/${locale}/contact`} className="btn btn-ghost mt-8">{getBq(locale).nav.contact}<ArrowIcon /></Link>
          </div>
          <div className="rv"><Faq items={t.faq} /></div>
        </div>
      </section>

      {/* CTA panels */}
      <section className="pb-[clamp(72px,9vw,120px)]">
        <div className="wrap grid grid-cols-2 gap-[18px] cta2">
          <div className="zoom panel-acc hm-cta" data-sparkle="">
            <span className="eyebrow">{t.ctaBrandEyebrow}</span>
            <h2 className="h2 !text-[clamp(32px,3.6vw,52px)]">{t.ctaBrandTitle}</h2>
            <Link href={`/${locale}/request`} className="btn btn-dark mag self-start">{t.ctaBrandBtn}<ArrowIcon /></Link>
            <Star className="hm-cta-star spin" size={120} color="#0E0D12" />
          </div>
          <div className="zoom panel-dark hm-cta" data-sparkle="">
            <span className="eyebrow">{t.ctaCreatorEyebrow}</span>
            <h2 className="h2 !text-[clamp(32px,3.6vw,52px)]">{t.ctaCreatorTitle}</h2>
            <Link href={`/${locale}/join/influencer`} className="btn btn-acc mag self-start">{t.ctaCreatorBtn}<ArrowIcon /></Link>
            <Star className="hm-cta-star spin" size={120} />
          </div>
        </div>
      </section>
    </div>
  );
}
