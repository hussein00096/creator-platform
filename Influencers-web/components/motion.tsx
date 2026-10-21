'use client';

import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { SparkleTrail } from '@/components/flair';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => typeof document !== 'undefined' && document.documentElement.classList.contains('still');
const fine = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | null = null;

export function lockScroll(locked: boolean) {
  if (locked) {
    document.documentElement.dataset.lock = 'true';
    lenis?.stop();
  } else {
    delete document.documentElement.dataset.lock;
    lenis?.start();
  }
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

/** Turns all motion on or off for this visitor (the `.still` switch). */
export function setStill(on: boolean) {
  document.documentElement.classList.toggle('still', on);
  try {
    localStorage.setItem('bq-still', on ? '1' : '0');
  } catch {
    /* storage blocked: the switch still applies to this page view */
  }
  window.dispatchEvent(new Event('bq-still'));
}

/**
 * 1:1 port of design/reference/assets/motion.js, mounted once in the root layout:
 * 1. custom cursor (--cx/--cy on .bq), 2. magnetic .mag, 3. 3D tilt + glare .tilt,
 * 4. reveal fallback (.io + IntersectionObserver) where CSS scroll timelines are missing,
 * 5. slider prev/next buttons, 6. Lenis smooth scroll (npm package instead of the CDN).
 * Uses event delegation and re-scans on every route change, so late-rendered elements get the effects.
 */
export function Motion() {
  const pathname = usePathname();

  // 1–3, 5: delegated listeners, bound once.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.bq');
    if (!root) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cleanups: (() => void)[] = [];

    // 1. Custom cursor
    if (finePointer) {
      let cx = 0;
      let cy = 0;
      let pending = false;
      const onMove = (event: MouseEvent) => {
        cx = event.clientX;
        cy = event.clientY;
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => {
            root.style.setProperty('--cx', `${cx}px`);
            root.style.setProperty('--cy', `${cy}px`);
            pending = false;
          });
        }
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      cleanups.push(() => window.removeEventListener('mousemove', onMove));
    }

    if (!reduce) {
      // 2 + 3. Magnetic buttons (30% x / 45% y) and 3D tilt (±7deg) with glare.
      if (finePointer) {
        let mag: HTMLElement | null = null;
        let tilt: HTMLElement | null = null;
        const onMove = (event: MouseEvent) => {
          if (still()) return;
          const target = event.target instanceof Element ? event.target : null;
          const nextMag = target?.closest<HTMLElement>('.mag') || null;
          if (nextMag !== mag) {
            if (mag) {
              mag.style.setProperty('--mx', '0px');
              mag.style.setProperty('--my', '0px');
            }
            mag = nextMag;
          }
          if (mag) {
            const r = mag.getBoundingClientRect();
            mag.style.setProperty('--mx', `${(event.clientX - r.left - r.width / 2) * 0.3}px`);
            mag.style.setProperty('--my', `${(event.clientY - r.top - r.height / 2) * 0.45}px`);
          }
          const nextTilt = target?.closest<HTMLElement>('.tilt') || null;
          if (nextTilt !== tilt) {
            if (tilt) {
              tilt.style.setProperty('--rx', '0deg');
              tilt.style.setProperty('--ry', '0deg');
            }
            tilt = nextTilt;
          }
          if (tilt) {
            const r = tilt.getBoundingClientRect();
            const x = (event.clientX - r.left) / r.width;
            const y = (event.clientY - r.top) / r.height;
            tilt.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
            tilt.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
            tilt.style.setProperty('--gx', `${x * 100}%`);
            tilt.style.setProperty('--gy', `${y * 100}%`);
          }
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        cleanups.push(() => window.removeEventListener('mousemove', onMove));
      }

      // 5. Horizontal slider prev/next (sliders that scroll themselves opt out with data-self).
      const onClick = (event: MouseEvent) => {
        const button = event.target instanceof Element ? event.target.closest<HTMLElement>('.ibtn[aria-label="التالي"], .ibtn[aria-label="السابق"]') : null;
        if (!button || button.hasAttribute('data-self')) return;
        const section = button.closest('section');
        const track = section?.querySelector('.hsc');
        if (track) track.scrollBy({ left: button.getAttribute('aria-label') === 'التالي' ? -380 : 380, behavior: 'smooth' });
      };
      document.addEventListener('click', onClick);
      cleanups.push(() => document.removeEventListener('click', onClick));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  // 6. Smooth scrolling (Lenis); restarted when the site's motion switch changes.
  useEffect(() => {
    let frame = 0;
    function stop() {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    }
    function start() {
      stop();
      if (reduced() || still()) return;
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    }
    start();
    window.addEventListener('bq-still', start);
    return () => {
      window.removeEventListener('bq-still', start);
      stop();
    };
  }, []);

  // 4. Scroll reveals fallback, re-scanned on every route change and whenever content renders later.
  useEffect(() => {
    if (reduced() || (window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'))) return undefined;
    document.documentElement.classList.add('io');
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    const scan = () => document.querySelectorAll('.rv,.clip,.zoom,.hlv,.hlvd,.lfill').forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}

/**
 * Site extras on top of the reference motion layer: scroll to top on navigation,
 * the sparkle cursor trail, and marquee bands that lean with scroll speed.
 */
export function MotionEngine() {
  const pathname = usePathname();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  // Marquee bands lean with scroll speed (written straight to the two band elements).
  useEffect(() => {
    if (reduced()) return undefined;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let skew = 0;
    let frame = 0;
    function apply() {
      document.querySelectorAll<HTMLElement>('.band').forEach((band) => band.style.setProperty('--sk', `${skew.toFixed(2)}deg`));
    }
    function settle() {
      skew *= 0.88;
      if (Math.abs(skew) < 0.05) skew = 0;
      apply();
      frame = skew ? requestAnimationFrame(settle) : 0;
    }
    function onScroll() {
      if (still()) return;
      const now = performance.now();
      const velocity = (window.scrollY - lastY) / Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      skew = Math.max(-9, Math.min(9, velocity * -4));
      apply();
      if (!frame) frame = requestAnimationFrame(settle);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <SparkleTrail />;
}

type Seg = { text: string; mark?: 'hl' | 'ac' };

/** Parses "اكتشف [[نجوم]] / المحتوى في {العراق}" — " / " breaks lines, [[x]] = highlighter, {x} = accent. */
function parse(text: string): Seg[][] {
  return text.split(' / ').map((line) => {
    const out: Seg[] = [];
    const re = /\[\[(.+?)\]\]|\{(.+?)\}|(\S+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line))) {
      if (match[1]) match[1].split(/\s+/).forEach((word) => out.push({ text: word, mark: 'hl' }));
      else if (match[2]) match[2].split(/\s+/).forEach((word) => out.push({ text: word, mark: 'ac' }));
      else out.push({ text: match[3] });
    }
    return out;
  });
}

export function plain(text: string) {
  return text.replace(/\[\[|\]\]|\{|\}/g, '').replace(/ \/ /g, ' ');
}

/**
 * Split headline: every word in its own mask, rising one after another (100ms stagger).
 * Waits for the preloader through `--pd`. Lines are separated by " / ".
 */
export function Split({
  text,
  as: Tag = 'h1',
  className,
  delay = 0.1,
  step = 0.1,
  dir,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  step?: number;
  dir?: string;
}) {
  const lines = parse(text);
  let index = 0;
  return (
    <Tag className={className} aria-label={plain(text)} dir={dir}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.map((seg, wi) => {
            const d = delay + index++ * step;
            const inner = seg.mark === 'hl' ? <span className="hl">{seg.text}</span> : seg.mark === 'ac' ? <span className="ac">{seg.text}</span> : seg.text;
            return (
              <Fragment key={wi}>
                <span className="wm"><span className="w" style={{ animationDelay: `calc(var(--pd) + ${d.toFixed(2)}s)` }}>{inner}</span></span>
                {wi < line.length - 1 ? ' ' : null}
              </Fragment>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/** Fade-up on load (`fd`) or reveal-on-scroll (`rv`). */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  kind = 'rv',
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  kind?: 'rv' | 'fd' | 'clip' | 'rise' | 'fade' | 'scale' | 'line';
  style?: CSSProperties;
}) {
  const cls = kind === 'fd' || kind === 'fade' ? 'fd' : kind === 'clip' ? 'clip' : 'rv';
  const extra: CSSProperties = cls === 'fd' ? { animationDelay: `calc(var(--pd) + ${delay}s)` } : {};
  return (
    <Tag className={className ? `${cls} ${className}` : cls} style={{ ...style, ...extra }}>
      {children}
    </Tag>
  );
}

/** Seamless loop: content is duplicated, the copy hidden from assistive tech. */
export function Marquee({
  items,
  reverse,
  slow,
  className,
  itemClass = 'band-item',
  sep,
}: {
  items: ReactNode[];
  reverse?: boolean;
  slow?: boolean;
  className?: string;
  itemClass?: string;
  sep?: ReactNode;
}) {
  const row = (hidden: boolean) => (
    <div className="mq-row" aria-hidden={hidden || undefined} inert={hidden || undefined}>
      {items.map((item, index) => (
        <span key={index} className={itemClass}>{item}{sep}</span>
      ))}
    </div>
  );
  return (
    <div className={`mq-hold mq-clip${className ? ` ${className}` : ''}`}>
      <div className={`mq${reverse ? ' mq-rev' : ''}${slow ? ' mq-slow' : ''}`}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Kept for existing callers: renders the number as-is (data numbers are not animated). */
export function Count({ value }: { value: number }) {
  return <span>{value}</span>;
}
