import type { ReactNode } from 'react';
import { Star } from '@/components/icons';
import { Reveal, Split } from '@/components/motion';
import { MiniHeader } from '@/components/ui-client';

/** Inner-page opening: eyebrow, split H1, lead, optional extra and clip-revealed image. */
export function PageHead({
  eyebrow,
  title,
  deck,
  shot,
  children,
  align = 'split',
}: {
  eyebrow: ReactNode;
  title: string;
  deck?: string;
  shot?: string;
  children?: ReactNode;
  align?: 'split' | 'stack';
}) {
  return (
    <header className={`ph-head wrap${shot ? ' has-shot' : ''} is-${align}`}>
      <div className="ph-head-copy">
        <Reveal as="span" className="eyebrow" kind="fd">{eyebrow}</Reveal>
        <Split as="h1" text={title} className="h1 h1-s mt-4" delay={0.1} />
        {deck ? <Reveal as="p" className="lead mt-6 max-w-[620px]" kind="fd" delay={0.5}>{deck}</Reveal> : null}
        {children ? <Reveal className="mt-8" kind="fd" delay={0.6}>{children}</Reveal> : null}
      </div>
      {shot ? (
        <div className="ph-head-shot clip">
          <img src={shot} alt="" className="pxs" />
        </div>
      ) : null}
    </header>
  );
}

/**
 * Split work surface (auth / forms / dashboard settings): minimal header,
 * a sticky story panel on one side and the form on the other.
 */
export function Desk({
  eyebrow,
  title,
  deck,
  shot,
  aside,
  children,
}: {
  eyebrow: ReactNode;
  title: string;
  deck?: string;
  shot: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="dk">
      <MiniHeader />
      <article className="dk-in wrap">
        <aside className="dk-aside">
          <div className="dk-story">
            <Reveal as="span" className="eyebrow" kind="fd">{eyebrow}</Reveal>
            <Split as="h1" text={title} className="dk-title mt-4" delay={0.1} />
            {deck ? <Reveal as="p" className="lead mt-5" kind="fd" delay={0.45}>{deck}</Reveal> : null}
            {aside ? <Reveal className="mt-8" kind="fd" delay={0.55}>{aside}</Reveal> : null}
          </div>
          <div className="dk-shot clip hide-m">
            <img src={shot} alt="" />
            <Star className="dk-star spin" size={64} />
          </div>
        </aside>
        <div className="dk-main">{children}</div>
      </article>
    </div>
  );
}

/** Full-screen state: sign-in needed, pending, sent. */
export function Gate({
  eyebrow,
  title,
  deck,
  shot,
  children,
}: {
  eyebrow: ReactNode;
  title: string;
  deck?: string;
  shot: string;
  children?: ReactNode;
}) {
  return (
    <section className="gate">
      <MiniHeader />
      <div className="wrap gate-in">
        <div className="gate-card">
          <img src={shot} alt="" className="gate-shot" />
          <span className="gate-shade" />
          <div className="gate-copy">
            <Star className="spin" size={40} />
            <Reveal as="span" className="eyebrow mt-6" kind="fd">{eyebrow}</Reveal>
            <Split as="h1" text={title} className="gate-title mt-3" delay={0.1} />
            {deck ? <Reveal as="p" className="lead mt-5 max-w-[560px]" kind="fd" delay={0.4}>{deck}</Reveal> : null}
            {children ? <Reveal className="gate-actions" kind="fd" delay={0.5}>{children}</Reveal> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A numbered form section. */
export function Panel({ index, title, deck, children, aside }: { index: string; title: string; deck?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="pn card rv">
      <header className="pn-head">
        <span className="pn-n stroke" aria-hidden="true">{index}</span>
        <div className="min-w-0 flex-1">
          <h2 className="h3">{title}</h2>
          {deck ? <p className="pn-deck">{deck}</p> : null}
        </div>
        {aside}
      </header>
      <div className="pn-body">{children}</div>
    </section>
  );
}
