'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useRef, useState, type ReactNode } from 'react';
import { ArrowIcon, BackIcon, Icon, Star } from '@/components/icons';
import { getCopy } from '@/lib/copy';

/** Minimal header for focused pages (auth, booking, states): logo + leave link. */
export function MiniHeader({ action }: { action?: ReactNode }) {
  const pathname = usePathname() || '/ar';
  const locale = pathname.startsWith('/en') ? 'en' : 'ar';
  const copy = getCopy(locale);
  return (
    <header className="mini">
      <div className="wrap mini-in">
        <Link href={`/${locale}`} className="logo" aria-label={copy.wordmark}>
          <Star size={26} />
          <span>{copy.wordmark}</span>
        </Link>
        {action ?? (
          <Link href={`/${locale}`} className="btn btn-ghost btn-sm">
            {locale === 'en' ? 'Cancel' : 'إلغاء'}<Icon name="close" size={16} />
          </Link>
        )}
      </div>
    </header>
  );
}

/** FAQ accordion: plus icon rotates 45° and fills accent when open. */
export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <div className="faq">
      {items.map((item, index) => {
        const on = open === index;
        return (
          <div key={item.q} className="faq-item">
            <button
              type="button"
              className="faq-q"
              aria-expanded={on}
              aria-controls={`${base}-${index}`}
              id={`${base}-q${index}`}
              onClick={() => setOpen(on ? null : index)}
            >
              <span>{item.q}</span>
              <span className={`pl${on ? ' open' : ''}`} aria-hidden="true"><Icon name="plus" size={18} /></span>
            </button>
            <div className={`faq-a${on ? ' open' : ''}`} id={`${base}-${index}`} role="region" aria-labelledby={`${base}-q${index}`}>
              <div><p>{item.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Segmented control: pill track, active segment slides in. */
export function SegControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={`seg-w${className ? ` ${className}` : ''}`} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={`seg${option.value === value ? ' on' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Horizontal scroll-snap slider with prev/next round buttons (direction-aware). */
export function Slider({
  children,
  head,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode;
  head?: ReactNode;
  prevLabel: string;
  nextLabel: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  function go(step: 1 | -1) {
    const node = track.current;
    if (!node) return;
    const first = node.firstElementChild as HTMLElement | null;
    const amount = (first?.offsetWidth || 320) + 22;
    const rtl = getComputedStyle(node).direction === 'rtl';
    node.scrollBy({ left: step * amount * (rtl ? -1 : 1), behavior: 'smooth' });
  }
  return (
    <div>
      <div className="wrap flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">{head}</div>
        <div className="flex gap-3 mb-10">
          <button type="button" className="ibtn" data-self="" onClick={() => go(-1)} aria-label={prevLabel}><BackIcon /></button>
          <button type="button" className="ibtn" data-self="" onClick={() => go(1)} aria-label={nextLabel}><ArrowIcon /></button>
        </div>
      </div>
      <div className="hsc" ref={track} data-lenis-prevent-wheel="">
        {children}
      </div>
    </div>
  );
}
