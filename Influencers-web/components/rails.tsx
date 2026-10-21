'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A pinned section whose track slides sideways while the page scrolls down.
 * The section is made tall enough to cover the track's travel.
 */
export function SideRail({ children, className, head }: { children: ReactNode; className?: string; head?: ReactNode }) {
  const shell = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      const node = shell.current;
      const rail = track.current;
      if (!node || !rail) return;
      const travel = Math.max(0, rail.scrollWidth - window.innerWidth);
      node.style.setProperty('--travel', `${travel}px`);
      node.style.height = window.matchMedia('(max-width: 760px)').matches ? '' : `${travel + window.innerHeight}px`;
    }
    measure();
    const observer = new ResizeObserver(measure);
    if (track.current) observer.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section ref={shell} className={className ? `rail ${className}` : 'rail'} data-progress="">
      <div className="rail-pin">
        {head}
        <div className="rail-track" ref={track}>{children}</div>
      </div>
    </section>
  );
}

export type HoverRow = {
  key: string | number;
  href: string;
  index: string;
  title: string;
  meta: string;
  aside?: string;
  shot: string | null;
};

/** A typographic list; the hovered row's photo floats after the cursor. */
export function HoverList({ rows, cursor }: { rows: HoverRow[]; cursor: string }) {
  const float = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const node = float.current;
    if (!node) return undefined;
    const point = { x: 0, y: 0 };
    const lag = { x: 0, y: 0 };
    let frame = 0;
    const loop = () => {
      lag.x += (point.x - lag.x) * 0.12;
      lag.y += (point.y - lag.y) * 0.12;
      const tilt = Math.max(-12, Math.min(12, (point.x - lag.x) * 0.08));
      node.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0) rotate(${tilt}deg)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    function move(event: PointerEvent) {
      point.x = event.clientX;
      point.y = event.clientY;
    }
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  return (
    <div className="hover-list" onPointerLeave={() => setActive(null)}>
      <div className="fx-layer is-float" aria-hidden="true">
        <div className="hover-float" ref={float} data-on={active !== null || undefined}>
          {rows.map((row, index) => (
            row.shot
              ? <img key={row.key} src={row.shot} alt="" data-on={index === active || undefined} />
              : <span key={row.key} className="hover-letter" data-on={index === active || undefined}>{row.title.trim().charAt(0)}</span>
          ))}
        </div>
      </div>
      <ol>
        {rows.map((row, index) => (
          <li key={row.key} data-reveal="line" style={{ ['--d' as string]: `${index * 0.06}s` }}>
            <Link
              href={row.href}
             
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              data-dim={active !== null && active !== index ? 'true' : undefined}
            >
              <small>{row.index}</small>
              <span className="hover-thumb">{row.shot ? <img src={row.shot} alt="" /> : <b>{row.title.trim().charAt(0)}</b>}</span>
              <strong dir="auto">{row.title}</strong>
              <em dir="auto">{row.meta}</em>
              {row.aside ? <i dir="auto">{row.aside}</i> : null}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export type ReelCard = {
  key: string | number;
  href: string;
  name: string;
  meta: string;
  place: string;
  shot: string | null;
};

/** A horizontal reel of tall portrait cards with arrow controls. */
export function FaceReel({ cards, prev, next, endHref, endLabel, head, action }: { cards: ReelCard[]; prev: string; next: string; endHref: string; endLabel: string; head?: ReactNode; action?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const node = track.current;
    if (!node) return undefined;
    function measure() {
      const n = track.current;
      if (!n) return;
      const max = n.scrollWidth - n.clientWidth;
      const pos = Math.abs(n.scrollLeft);
      setEdge({ start: pos < 4, end: pos > max - 4 });
    }
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      node.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  function move(direction: 1 | -1) {
    const node = track.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>('.face-card');
    const step = (card?.offsetWidth || 300) + 16;
    const rtl = getComputedStyle(node).direction === 'rtl';
    node.scrollBy({ left: direction * step * (rtl ? -1 : 1), behavior: 'smooth' });
  }

  return (
    <div className="face-reel">
      <div className="face-head">
        {head}
        <div className="face-controls">
          {action}
        <button type="button" onClick={() => move(-1)} disabled={edge.start} aria-label={prev}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button type="button" onClick={() => move(1)} disabled={edge.end} aria-label={next}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        </div>
      </div>
      <div className="face-track" ref={track} data-lenis-prevent="">
        {cards.map((card, index) => (
          <Link key={card.key} href={card.href} className="face-card" data-reveal="rise" style={{ ['--d' as string]: `${Math.min(index, 5) * 0.08}s` }}>
            <span className="face-photo">
              {card.shot ? <img src={card.shot} alt="" /> : <b dir="auto">{card.name.trim().charAt(0)}</b>}
            </span>
            <span className="face-num">{String(index + 1).padStart(2, '0')}</span>
            <span className="face-go" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </span>
            <span className="face-info">
              <strong dir="auto">{card.name}</strong>
              <em dir="auto">{[card.meta, card.place].filter(Boolean).join(' · ')}</em>
            </span>
          </Link>
        ))}
        <Link href={endHref} className="face-card is-end">
          <span className="display">{endLabel}</span>
          <span className="face-go is-on" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
