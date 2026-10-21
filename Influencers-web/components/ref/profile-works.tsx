'use client';

// "الأعمال" grid of design/reference/profile.html over the real portfolio, plus the site's
// full-screen lightbox (same logic as components/gallery.tsx: keys, swipe, thumbnail strip).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowIcon, BackIcon, Icon } from '@/components/icons';
import { lockScroll } from '@/components/motion';
import { Shot, num } from '@/components/ref/parts';
import { getCopy } from '@/lib/copy';
import type { Locale, PortfolioImage } from '@/lib/types';

const T = {
  ar: { photo: 'صورة', view: (n: string) => `عرض الصورة ${n}`, forBrand: 'لصالح', brand: '[اسم العلامة]', empty: 'ما رفع أعمال لحد الآن. ارجع للملف قريباً.' },
  en: { photo: 'Photo', view: (n: string) => `View photo ${n}`, forBrand: 'For', brand: '[Brand name]', empty: 'No work uploaded yet. Check back soon.' },
};

// Card backgrounds of the reference grid, in order.
const BG = ['#3B2F7A', '#6A2F4A', '#4A2F5E', '#2B4C7E', '#7A2E3B', '#24525E'];

export function ProfileWorks({ locale, images }: { locale: Locale; images: PortfolioImage[] }) {
  const t = T[locale];
  const copy = getCopy(locale);
  const [index, setIndex] = useState<number | null>(null);
  const [rtl, setRtl] = useState(false);
  const touch = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const isOpen = index !== null;

  useEffect(() => {
    setRtl(document.documentElement.dir === 'rtl');
  }, []);

  const step = (delta: number) => setIndex((current) => (current === null ? current : (current + images.length + delta) % images.length));

  useEffect(() => {
    if (!isOpen) return undefined;
    lockScroll(true);
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIndex(null);
      if (event.key === 'ArrowLeft') step(rtl ? 1 : -1);
      if (event.key === 'ArrowRight') step(rtl ? -1 : 1);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, rtl, images.length]);

  useEffect(() => {
    if (index === null) return;
    strip.current?.querySelector<HTMLElement>('[data-on="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  if (!images.length) {
    return (
      <div className="card pop" style={{ marginTop: '28px', padding: '40px 28px', borderRadius: '24px', textAlign: 'center', color: '#B1ACBE', fontSize: '16px' }}>{t.empty}</div>
    );
  }

  const open = index === null ? null : images[index];
  const viewer = open ? (
    <div
      className="pf-lb"
      role="dialog"
      aria-modal="true"
      data-lenis-prevent=""
      onClick={() => setIndex(null)}
      onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touch.current === null) return;
        const dx = event.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) < 40) return;
        step((dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
      }}
    >
      <div className="pf-lb-top" onClick={(event) => event.stopPropagation()}>
        <span className="pf-lb-n" dir="ltr">{String((index ?? 0) + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIndex(null)} aria-label={copy.close}>
          {copy.close}
          <Icon name="close" size={18} />
        </button>
      </div>
      <figure className="pf-lb-stage">
        <img key={open.id} src={open.filePath} alt="" onClick={(event) => { event.stopPropagation(); step(1); }} />
      </figure>
      {images.length > 1 ? (
        <>
          <button type="button" className="ibtn pf-lb-arrow is-prev" aria-label={copy.prev} onClick={(event) => { event.stopPropagation(); step(-1); }}>
            <BackIcon />
          </button>
          <button type="button" className="ibtn pf-lb-arrow is-next" aria-label={copy.next} onClick={(event) => { event.stopPropagation(); step(1); }}>
            <ArrowIcon />
          </button>
          <div className="pf-lb-strip" ref={strip} onClick={(event) => event.stopPropagation()}>
            {images.map((image, imageIndex) => (
              <button key={image.id} type="button" data-on={imageIndex === index} onClick={() => setIndex(imageIndex)} aria-label={String(imageIndex + 1)}>
                <img src={image.filePath} alt="" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }} className="g3">
        {images.map((image, i) => (
          <div key={image.id} className="ccard pop" style={{ animationDelay: `${(i * 0.07).toFixed(2)}s`, borderRadius: '24px' }}>
            <div className="ph" onClick={() => setIndex(i)} style={{ height: i % 2 ? '240px' : '320px', background: BG[i % BG.length], cursor: 'pointer' }}>
              <div className="ring" aria-hidden="true"></div>
              <Shot src={image.filePath} />
              <span className="tag" style={{ position: 'absolute', top: '14px', right: '14px' }}>{t.photo} {num(i + 1, locale)}</span>
              {/* The reference's play button opens the item; portfolio items are photos, so it shows a view (eye) glyph and opens the lightbox. */}
              <button type="button" className="ply" aria-label={t.view(String(i + 1))} style={{ position: 'relative' }} onClick={(event) => { event.stopPropagation(); setIndex(i); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
            </div>
            {/* TODO: the API has no brand/client per portfolio item. */}
            <div style={{ padding: '14px 16px', fontSize: '14px', color: '#B1ACBE' }}>{t.forBrand} <span style={{ color: '#F5F2EA', fontWeight: '600' }}>{t.brand}</span></div>
          </div>
        ))}
      </div>
      {viewer && typeof document !== 'undefined' ? createPortal(viewer, document.body) : null}
    </>
  );
}
