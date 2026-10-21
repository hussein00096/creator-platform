import Link from 'next/link';
import type { ReactNode } from 'react';
import { getBooking } from '@/lib/copy-booking';
import { getCopy } from '@/lib/copy';
import { deco, toneFor } from '@/lib/people';
import type { Influencer, Locale } from '@/lib/types';
import { ArrowIcon, Icon } from './icons';
import { Split } from './motion';
import { SuccessBurst } from './ui';
import { MiniHeader } from './ui-client';

export function shotOf(person: Influencer) {
  return person.profile?.avatar || person.profile?.portfolio[0]?.filePath || '';
}

/** Round face: photo, or the initial on the creator tone. */
export function Face({ person, size = 44 }: { person: Influencer; size?: number }) {
  const shot = shotOf(person);
  return (
    <span className="bk-face" style={{ width: size, height: size, background: toneFor(person.id) }} aria-hidden="true">
      {shot ? <img src={shot} alt="" /> : <span className="disp">{person.name.trim().charAt(0)}</span>}
    </span>
  );
}

/** Segmented progress bars; finished steps can be revisited. */
export function Progress({ locale, at, onGo }: { locale: Locale; at: number; onGo: (index: number) => void }) {
  const book = getBooking(locale);
  return (
    <nav className="bk-prog" aria-label={book.stepOf(deco(at + 1, locale), deco(book.steps.length, locale))}>
      <ol>
        {book.steps.map((item, index) => (
          <li key={item.label}>
            <button
              type="button"
              data-state={index < at ? 'done' : index === at ? 'now' : 'next'}
              aria-current={index === at ? 'step' : undefined}
              disabled={index > at}
              onClick={() => onGo(index)}
            >
              <i aria-hidden="true"><s /></i>
              <span><small>{deco(index + 1, locale)}</small>{item.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** − value + counter. */
export function Counter({
  value, min, max, label, more, less, onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  more: string;
  less: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="bk-count">
      <span className="lbl">{label}</span>
      <div className="bk-count-dial">
        <button type="button" className="ibtn" aria-label={less} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" /></button>
        <b className="disp" dir="ltr" aria-live="polite">{value}</b>
        <button type="button" className="ibtn" aria-label={more} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Icon name="plus" /></button>
      </div>
    </div>
  );
}

/** One summary line: label + value. */
export function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bk-line">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Sticky side card that mirrors the request as it is written. */
export function Summary({
  locale, title, usage, quantity, picked, externals,
}: {
  locale: Locale;
  title: string;
  usage: string;
  quantity: number;
  picked: Influencer[];
  externals: { name: string; note: string }[];
}) {
  const copy = getCopy(locale);
  const book = getBooking(locale);
  return (
    <aside className="side stk bk-side">
      <div className="card bk-sum">
        <span className="eyebrow">{book.summary}</span>
        <strong className="bk-sum-title disp" dir="auto" data-empty={!title.trim() || undefined}>{title.trim() || book.untitled}</strong>
        <dl className="bk-lines">
          <Line label={copy.quantity}><span dir="ltr">{quantity}</span></Line>
          {usage.trim() ? <Line label={copy.usage}><span dir="auto">{usage.trim()}</span></Line> : null}
          {externals.length ? <Line label={book.guests}><span dir="ltr">{externals.length}</span></Line> : null}
        </dl>
        <div className="bk-sum-faces">
          <span className="lbl">{copy.requestPicked}</span>
          {picked.length ? (
            <ul>
              {picked.map((person) => (
                <li key={person.id}><Face person={person} size={36} /><span dir="auto">{person.name}</span></li>
              ))}
            </ul>
          ) : <p className="small">{book.facesNone}</p>}
        </div>
        <p className="bk-note"><Icon name="shield" size={18} /><span>{book.note}</span></p>
      </div>
    </aside>
  );
}

/** Sent: sparkle burst + next moves. */
export function Sent({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const book = getBooking(locale);
  return (
    <div className="bk">
      <MiniHeader />
      <div className="wrap bk-done">
        <div className="card bk-done-card">
          <SuccessBurst />
          <Split as="h1" text={book.doneTitle} className="bk-done-title" delay={0.2} />
          <p className="lead fd" style={{ animationDelay: '.5s' }}>{copy.pendingRequest} {copy.ordersDeck}</p>
          <div className="bk-done-actions fd" style={{ animationDelay: '.65s' }}>
            <Link className="btn btn-acc" href={`/${locale}/orders`}><span>{copy.orders}</span><ArrowIcon /></Link>
            <Link className="btn btn-ghost" href={`/${locale}/directory`}>{book.browse}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
