import Link from 'next/link';
import { ArrowIcon, Icon, Star, doorIcon, type IconName } from '@/components/icons';
import { JoinCard } from '@/components/join-card';
import { Marquee, Split } from '@/components/motion';
import { SectionHead } from '@/components/ui';
import { Faq } from '@/components/ui-client';
import { getJoin } from '@/lib/copy-join';
import { deco } from '@/lib/people';
import type { Locale } from '@/lib/types';

export type JoinField = { id: number; slug: string; name: string; count: number; href: string };

const perks: IconName[] = ['image', 'lock', 'shield', 'chat'];

/** Join landing (spec 7.6): hero chooser, benefits, timeline, collaboration types, FAQ, CTA. */
export function JoinGate({ locale, fields }: { locale: Locale; fields: JoinField[] }) {
  const t = getJoin(locale);

  return (
    <div className="join">
      {/* Hero */}
      <section className="jn-hero">
        <div className="jn-mq" aria-hidden="true">
          <Marquee slow items={t.marquee} itemClass="jn-mq-i stroke disp" sep={<Star size={56} className="jn-mq-s" />} />
        </div>
        <div className="wrap hero grid grid-cols-[1.25fr_1fr] gap-[clamp(40px,5vw,72px)] items-center relative">
          <div className="min-w-0">
            <span className="eyebrow fd">{t.eyebrow}</span>
            <Split text={t.title} className="h1 h1-s jn-title" delay={0.15} />
            <p className="lead jn-lead fd" style={{ animationDelay: 'calc(var(--pd) + .8s)' }}>{t.lead}</p>
            <ul className="jn-ticks fd" style={{ animationDelay: 'calc(var(--pd) + .95s)' }}>
              {t.ticks.map((tick) => (
                <li key={tick}><span className="jn-tick" aria-hidden="true"><Icon name="check" size={14} /></span>{tick}</li>
              ))}
            </ul>
          </div>
          <div className="fd min-w-0" style={{ animationDelay: 'calc(var(--pd) + .6s)' }}>
            <JoinCard locale={locale} />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow={t.benefitsEyebrow} title={<Split as="span" text={t.benefitsTitle} className="block" delay={0} step={0.06} />} />
          <ul className="grid grid-cols-4 gap-[18px] g4 jn-perks">
            {t.benefits.map((item, index) => (
              <li key={item.title} className="rv">
                <div className="card tilt jn-perk">
                  <span className="jn-perk-n stroke" aria-hidden="true">{deco(index + 1, locale)}</span>
                  <Icon name={perks[index]} size={26} className="ac" />
                  <h3 className="h3">{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Timeline */}
      <section className="paper sec">
        <div className="wrap grid grid-cols-[1fr_1.2fr] gap-[clamp(40px,6vw,96px)] split">
          <div>
            <div className="stk jn-tl-head rv">
              <span className="eyebrow">{t.stepsEyebrow}</span>
              <h2 className="h2"><Split as="span" text={t.stepsTitle} className="block" delay={0} step={0.06} /></h2>
              <p className="lead mt-5 max-w-[420px]">{t.stepsLead}</p>
            </div>
          </div>
          <div className="jn-tl">
            <span className="jn-tl-track" aria-hidden="true"><span className="lfill" /></span>
            <ol>
              {t.steps.map((step, index) => (
                <li key={step.title} className="jn-tl-step rv">
                  <span className="jn-tl-dot" aria-hidden="true" />
                  <span className="jn-tl-n stroke" aria-hidden="true">{deco(index + 1, locale)}</span>
                  <h3 className="h3">{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Collaboration types */}
      {fields.length ? (
        <section className="sec">
          <div className="wrap">
            <SectionHead eyebrow={t.catsEyebrow} title={<Split as="span" text={t.catsTitle} className="block" delay={0} step={0.06} />} />
            <div className="rows">
              {fields.map((item, index) => (
                <Link key={item.id} href={item.href} className="row">
                  <span className="rl">
                    <span className="rn">{deco(index + 1, locale)}</span>
                    <span className="rt">{item.name}</span>
                  </span>
                  <span className="rr">
                    {item.count ? <span className="rn hide-m">{item.count} {t.specialties}</span> : null}
                    <span className="ra" aria-hidden="true"><Icon name={doorIcon[item.slug] || 'arrow'} size={22} /></span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className={`sec${fields.length ? ' !pt-0' : ''}`}>
        <div className="wrap grid grid-cols-[1fr_1.4fr] gap-16 faqw">
          <div className="rv">
            <span className="eyebrow">{t.faqEyebrow}</span>
            <h2 className="h2">{t.faqTitle}</h2>
            <p className="lead mt-5 max-w-[380px]">{t.faqLead}</p>
            <Link href={`/${locale}/contact`} className="btn btn-ghost mt-8">{t.contact}<ArrowIcon /></Link>
          </div>
          <div className="rv"><Faq items={t.faq} /></div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-[clamp(72px,9vw,120px)]">
        <div className="wrap">
          <div className="zoom panel-acc jn-cta">
            <span className="eyebrow">{t.ctaEyebrow}</span>
            <Split as="h2" text={t.ctaTitle} className="h1 h1-s jn-cta-t" delay={0} step={0.08} />
            <p className="jn-cta-p">{t.ctaText}</p>
            <Link href={`/${locale}/join/influencer`} className="btn btn-dark mag self-start">{t.ctaBtn}<ArrowIcon /></Link>
            <Star className="jn-cta-star spin" size={180} color="#0E0D12" />
          </div>
        </div>
      </section>
    </div>
  );
}
