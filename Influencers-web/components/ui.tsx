import Link from 'next/link';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { ArrowIcon, Icon } from '@/components/icons';
import type { CardPerson } from '@/lib/people';

/** Placeholder silhouette shown when a creator has no photo yet. */
export function Sil() {
  return (
    <svg className="sil" viewBox="0 0 200 172" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <circle cx="100" cy="62" r="34" fill="currentColor" />
      <path d="M28 172c4-42 34-64 72-64s68 22 72 64z" fill="currentColor" />
    </svg>
  );
}

/** Portrait area: real photo (object-fit cover) or tone + silhouette + dashed ring. */
export function Portrait({
  shot,
  tone,
  className,
  children,
  style,
  eager,
}: {
  shot: string | null;
  tone: string;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  eager?: boolean;
}) {
  return (
    <div className={['ph', shot ? 'dev' : '', className || ''].filter(Boolean).join(' ')} style={{ ['--tone' as string]: tone, ...style }}>
      {shot ? (
        <img className="shot" src={shot} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      ) : (
        <>
          <span className="dring" aria-hidden="true" />
          <Sil />
        </>
      )}
      {children}
    </div>
  );
}

export function Verified({ label }: { label: string }) {
  return (
    <span className="vf" title={label} aria-label={label} role="img">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
    </span>
  );
}

/** Creator card: whole card links to the profile; tilt + hover effects from the motion layer. */
export function CreatorCard({
  person,
  href,
  viewLabel,
  verifiedLabel,
  foot,
  className,
}: {
  person: CardPerson;
  href: string;
  viewLabel: string;
  verifiedLabel: string;
  foot?: ReactNode;
  className?: string;
}) {
  const meta = [person.place, person.platform].filter(Boolean).join(' · ');
  return (
    <Link href={href} className={`ccard tilt${className ? ` ${className}` : ''}`} aria-label={person.name}>
      <Portrait shot={person.shot} tone={person.tone} className="cc-ph">
        {person.category ? <span className="tag ptag">{person.category}</span> : null}
        <span className="ini" aria-hidden="true">{person.initial}</span>
        <span className="view"><span className="btn btn-acc btn-sm">{viewLabel}<ArrowIcon size={18} /></span></span>
      </Portrait>
      <div className="cc-body">
        <strong className="cc-name"><span dir="auto">{person.name}</span><Verified label={verifiedLabel} /></strong>
        {meta ? <span className="cc-meta">{meta}</span> : null}
        {foot ? <div className="cc-foot">{foot}</div> : null}
      </div>
    </Link>
  );
}

/** Trending card: 340px wide, 420px portrait, outlined rank number, play button. */
export function TrendCard({ person, href, rank }: { person: CardPerson; href: string; rank: string }) {
  return (
    <Link href={href} className="tcard" aria-label={person.name}>
      <Portrait shot={person.shot} tone={person.tone}>
        <span className="shade" aria-hidden="true" />
        {person.category ? <span className="tag ptag">{person.category}</span> : null}
        <span className="rank" aria-hidden="true">{rank}</span>
        <span className="ply" aria-hidden="true"><Icon name="play" size={18} /></span>
      </Portrait>
      <div className="tc-body">
        <div className="min-w-0">
          <strong className="cc-name"><span dir="auto">{person.name}</span></strong>
          <span className="cc-meta">{[person.place, person.platform].filter(Boolean).join(' · ')}</span>
        </div>
        <span className="ibtn ibtn-sm" aria-hidden="true"><ArrowIcon size={18} /></span>
      </div>
    </Link>
  );
}

/** Small card for the 3D wall marquee. */
export function WallCard({ person, href, label }: { person: CardPerson; href: string; label?: string }) {
  return (
    <Link href={href} className="wcard" style={{ ['--tone' as string]: person.tone }} aria-label={label || person.name} tabIndex={label ? undefined : -1}>
      <Portrait shot={person.shot} tone={person.tone} />
      <span className="shade" aria-hidden="true" />
      <span className="wn"><span dir="auto">{person.name}</span>{person.category ? <small className="tag">{person.category}</small> : null}</span>
    </Link>
  );
}

/** Model card (paper sections): white card, 3:4 portrait, live tag, "book" reveal on hover. */
export function ModelCard({ person, href, liveLabel, bookLabel }: { person: CardPerson; href: string; liveLabel: string; bookLabel: string }) {
  return (
    <Link href={href} className="mcard" aria-label={person.name}>
      <Portrait shot={person.shot} tone={person.tone}>
        {person.available ? <span className="tag ptag"><i className="live" />{liveLabel}</span> : null}
        <span className="mbook"><span className="btn btn-dark btn-sm">{bookLabel}<ArrowIcon size={18} /></span></span>
      </Portrait>
      <div className="mc-body">
        <strong dir="auto">{person.name}</strong>
        <span>{[person.category, person.place].filter(Boolean).join(' · ')}</span>
      </div>
    </Link>
  );
}

/** Section header: eyebrow + H2, optional lead on the opposite side, optional action. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  as: Tag = 'h2',
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return (
    <header className={`sh rv${className ? ` ${className}` : ''}`}>
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <Tag className="h2">{title}</Tag>
      </div>
      {lead || action ? (
        <div className="flex flex-col items-start gap-5">
          {lead ? <p className="lead">{lead}</p> : null}
          {action}
        </div>
      ) : null}
    </header>
  );
}

/** Breadcrumb for inner pages. */
export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="fd flex flex-wrap items-center gap-2 text-[14px] text-[var(--dim)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {item.href ? <Link href={item.href} className="hover:text-[var(--acc)] no-underline">{item.label}</Link> : <span aria-current="page" className="text-[var(--mut)]">{item.label}</span>}
          {index < items.length - 1 ? <Icon name="chevron" size={14} flip /> : null}
        </span>
      ))}
    </nav>
  );
}

/** Success state: check circle pops in, ten sparkle stars burst outward. */
export function SuccessBurst() {
  return (
    <div className="okb" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <svg key={index} className="burst" viewBox="0 0 24 24" style={{ ['--a' as string]: `${index * 36}deg`, ['--r' as string]: `${90 + index * 20}deg`, animationDelay: `${0.15 + (index % 3) * 0.05}s` }}>
          <path d="M12 1.5C12.6 7.6 16.4 11.4 22.5 12C16.4 12.6 12.6 16.4 12 22.5C11.4 16.4 7.6 12.6 1.5 12C7.6 11.4 11.4 7.6 12 1.5Z" fill="currentColor" />
        </svg>
      ))}
      <span className="okb-c"><Icon name="check" size={44} /></span>
    </div>
  );
}
