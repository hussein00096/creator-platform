'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { HeartBurst } from '@/components/flair';
import { ArrowIcon, Icon } from '@/components/icons';
import { getProfile } from '@/lib/copy-profile';
import type { Locale } from '@/lib/types';

const KEY = 'bq-saved';

function readSaved(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
  } catch {
    return [];
  }
}

/** Save (local only), share and "book" (scrolls to the booking card). */
export function ProfileActions({ locale, id, name }: { locale: Locale; id: number; name: string }) {
  const t = getProfile(locale);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState('');
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    setSaved(readSaved().includes(id));
  }, [id]);

  function toggle() {
    const next = !saved;
    setSaved(next);
    if (next) setBurst((count) => count + 1);
    try {
      const list = readSaved().filter((item) => item !== id);
      localStorage.setItem(KEY, JSON.stringify(next ? [...list, id] : list));
    } catch {
      /* storage blocked: the heart still toggles for this view */
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote(t.linkCopied);
      window.setTimeout(() => setNote(''), 2400);
    } catch {
      setNote(t.copied);
    }
  }

  function book(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById('book');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="pf-act">
      <button type="button" className={`ibtn pf-heart${saved ? ' on' : ''}`} aria-pressed={saved} aria-label={saved ? t.unsave : t.save} title={saved ? t.unsave : t.save} onClick={toggle}>
        <Icon name="heart" />
        {burst ? <HeartBurst key={burst} /> : null}
      </button>
      <button type="button" className="ibtn" aria-label={t.share} title={t.share} onClick={share}>
        <Icon name="share" />
      </button>
      <a href="#book" className="btn btn-acc mag" onClick={book}>
        <span>{t.book}</span><ArrowIcon />
      </a>
      <span className="pf-note" role="status" aria-live="polite">{note}</span>
    </div>
  );
}
