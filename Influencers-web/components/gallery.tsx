'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowIcon, BackIcon, Icon } from '@/components/icons';
import { lockScroll } from '@/components/motion';
import type { PortfolioImage } from '@/lib/types';

/** Portfolio masonry + full-screen lightbox (keys, swipe, thumbnail strip). */
export function Gallery({
  images,
  prev,
  next,
  close,
  view,
}: {
  images: PortfolioImage[];
  prev: string;
  next: string;
  close: string;
  view?: string;
}) {
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
      // Arrow keys follow the reading direction.
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

  if (!images.length) return null;
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
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIndex(null)} aria-label={close}>
          {close}
          <Icon name="close" size={18} />
        </button>
      </div>

      <figure className="pf-lb-stage">
        <img key={open.id} src={open.filePath} alt="" onClick={(event) => { event.stopPropagation(); step(1); }} />
      </figure>

      {images.length > 1 ? (
        <>
          <button type="button" className="ibtn pf-lb-arrow is-prev" aria-label={prev} onClick={(event) => { event.stopPropagation(); step(-1); }}>
            <BackIcon />
          </button>
          <button type="button" className="ibtn pf-lb-arrow is-next" aria-label={next} onClick={(event) => { event.stopPropagation(); step(1); }}>
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
      <div className="pf-gal">
        {images.map((image, imageIndex) => (
          <div key={image.id} className="pf-shot-w rv">
            <button type="button" className="pf-shot" onClick={() => setIndex(imageIndex)} aria-label={`${view || ''} ${imageIndex + 1}`.trim()}>
              <img src={image.filePath} alt="" loading="lazy" decoding="async" />
              <small className="tag" dir="ltr">{String(imageIndex + 1).padStart(2, '0')}</small>
              <span className="pf-zoom" aria-hidden="true"><Icon name="eye" size={20} /></span>
            </button>
          </div>
        ))}
      </div>
      {viewer && typeof document !== 'undefined' ? createPortal(viewer, document.body) : null}
    </>
  );
}
