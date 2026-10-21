'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowIcon, Icon, Star } from '@/components/icons';
import { Portrait, Verified } from '@/components/ui';
import { getBq } from '@/lib/copy-bq';
import { getDirectory } from '@/lib/copy-directory';
import { categoryLabel } from '@/lib/names';
import { toCard, type CardPerson } from '@/lib/people';
import type { CategoryNode, Influencer, Locale } from '@/lib/types';

/** Same key as the profile page heart (components/profile-actions.tsx). */
const KEY = 'bq-saved';

function readSaved(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
  } catch {
    return [];
  }
}

/** Saved creator ids (local only) and a toggle. */
export function useSaved() {
  const [saved, setSaved] = useState<number[]>([]);
  useEffect(() => setSaved(readSaved()), []);
  const toggle = useCallback((id: number) => {
    const list = readSaved().filter((item) => item !== id);
    const next = saved.includes(id) ? list : [...list, id];
    setSaved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: the heart still toggles for this view */
    }
  }, [saved]);
  return { saved, toggle };
}

type Row = { person: Influencer; card: CardPerson };

export function toRow(locale: Locale, person: Influencer): Row {
  return { person, card: toCard(locale, person) };
}

const profileHref = (locale: Locale, id: number) => `/${locale}/talent/${id}`;

function Thumbs({ person, className }: { person: Influencer; className: string }) {
  const shots = (person.profile?.portfolio || []).slice(0, 3);
  if (!shots.length) return null;
  return (
    <span className={className} aria-hidden="true">
      {shots.map((item) => <img key={item.id} src={item.filePath} alt="" loading="lazy" decoding="async" />)}
    </span>
  );
}

/** Grid card: stretched link on the name, heart and "book" as separate controls, hover tilt + portfolio strip. */
export function DirCard({ locale, row, saved, onSave }: { locale: Locale; row: Row; saved: boolean; onSave: (id: number) => void }) {
  const t = getDirectory(locale);
  const card = getBq(locale).card;
  const { person, card: c } = row;
  const skills = (person.profile?.categories || []).slice(0, 2);
  const meta = [c.place, c.platform].filter(Boolean).join(' · ');
  return (
    <article className="ccard tilt dcard">
      <Portrait shot={c.shot} tone={c.tone} className="dc-ph">
        <span className="dc-shade" aria-hidden="true" />
        {c.category ? <span className="tag ptag">{c.category}</span> : null}
        {c.available ? <span className="tag dc-live"><i className="live" aria-hidden="true" />{t.available}</span> : null}
        <Thumbs person={person} className="dc-strip" />
      </Portrait>
      <button type="button" className={`dc-save${saved ? ' on' : ''}`} aria-pressed={saved} aria-label={`${saved ? t.unsave : t.save}: ${c.name}`} onClick={() => onSave(c.id)}>
        <Icon name="heart" size={20} />
      </button>
      <div className="cc-body dc-body">
        <strong className="cc-name">
          <Link href={profileHref(locale, c.id)} className="dc-link"><span dir="auto">{c.name}</span></Link>
          <Verified label={card.verified} />
        </strong>
        {meta ? <span className="cc-meta dc-meta"><Icon name="pin" size={15} />{meta}</span> : null}
        {skills.length ? (
          <span className="dc-skills">
            {skills.map((item) => <span key={item.id} className="tag-l">{categoryLabel(locale, item)}</span>)}
          </span>
        ) : null}
        <div className="dc-foot">
          {/* TODO: no price data in the API yet */}
          <span>{t.startsFrom} <b>{t.price}</b></span>
          <Link href={`${profileHref(locale, c.id)}#book`} className="btn btn-ghost btn-sm dc-book">{t.book}</Link>
        </div>
      </div>
    </article>
  );
}

/** Wide "pick of the week" card spanning two grid columns. */
export function FeatureCard({ locale, row }: { locale: Locale; row: Row }) {
  const t = getDirectory(locale);
  const card = getBq(locale).card;
  const { person, card: c } = row;
  const shots = (person.profile?.portfolio || []).slice(0, 3);
  return (
    <article className="dfeat">
      <Link href={profileHref(locale, c.id)} className="df-img" tabIndex={-1} aria-hidden="true">
        <Portrait shot={c.shot} tone={c.tone} className="df-ph" eager>
          <span className="df-badge"><Star size={14} color="currentColor" />{t.weekPick}</span>
        </Portrait>
      </Link>
      <div className="df-body">
        <div className="df-tags">
          {c.category ? <span className="tag-l">{c.category}</span> : null}
          {c.place ? <span className="tag-l"><Icon name="pin" size={14} />{c.place}</span> : null}
          {c.available ? <span className="tag-l"><i className="live" aria-hidden="true" />{t.available}</span> : null}
        </div>
        <h3 className="df-name"><span dir="auto">{c.name}</span><Verified label={card.verified} /></h3>
        {person.profile?.bio ? <p className="df-bio" dir="auto">{person.profile.bio}</p> : null}
        {shots.length ? (
          <div className="df-shots" aria-hidden="true">
            {shots.map((item) => <img key={item.id} src={item.filePath} alt="" loading="lazy" decoding="async" />)}
          </div>
        ) : null}
        <div className="df-act">
          <Link href={`${profileHref(locale, c.id)}#book`} className="btn btn-acc mag"><span>{t.bookCollab}</span><ArrowIcon /></Link>
          <Link href={profileHref(locale, c.id)} className="btn btn-ghost">{t.viewProfile}</Link>
        </div>
      </div>
    </article>
  );
}

/** List view row. */
export function ListRow({ locale, row, parents }: { locale: Locale; row: Row; parents: Map<number, CategoryNode> }) {
  const t = getDirectory(locale);
  const card = getBq(locale).card;
  const { person, card: c } = row;
  const first = person.profile?.categories?.[0];
  const field = first?.parentId ? parents.get(first.parentId) : null;
  const meta = [c.place, c.platform, field ? categoryLabel(locale, field) : ''].filter(Boolean).join(' · ');
  return (
    <Link href={profileHref(locale, c.id)} className="drow">
      <Portrait shot={c.shot} tone={c.tone} className="dr-ph" />
      <span className="dr-main">
        <span className="dr-top">
          <strong className="cc-name"><span dir="auto">{c.name}</span><Verified label={card.verified} /></strong>
          {c.category ? <span className="tag-l">{c.category}</span> : null}
          {c.available ? <span className="dr-live"><i className="live" aria-hidden="true" />{t.available}</span> : null}
        </span>
        {meta ? <span className="cc-meta">{meta}</span> : null}
      </span>
      {/* TODO: no price data in the API yet */}
      <span className="dr-price">{t.price}</span>
      <span className="ibtn ibtn-sm dr-go" aria-hidden="true"><ArrowIcon size={18} /></span>
    </Link>
  );
}

/** Gold "join as a creator" card placed inside the grid. */
export function PromoCard({ locale }: { locale: Locale }) {
  const t = getDirectory(locale);
  return (
    <aside className="dpromo">
      <Star size={170} className="dp-star" color="#0E0D12" />
      <span className="dp-eye">{t.promoEyebrow}</span>
      <strong className="disp dp-title">{t.promoTitle}</strong>
      <Link href={`/${locale}/join/influencer`} className="btn btn-dark mag dp-btn"><span>{t.promoBtn}</span><ArrowIcon /></Link>
    </aside>
  );
}
