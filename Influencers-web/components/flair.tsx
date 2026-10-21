'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowIcon, BackIcon, Icon } from '@/components/icons';
import type { CardPerson } from '@/lib/people';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = () => document.documentElement.classList.contains('still');
const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const STAR = 'M12 1.5C12.6 7.6 16.4 11.4 22.5 12C16.4 12.6 12.6 16.4 12 22.5C11.4 16.4 7.6 12.6 1.5 12C7.6 11.4 11.4 7.6 12 1.5Z';

type Spark = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; life: number; max: number };

/**
 * Gold sparkle stars (the brand mark) trailing the cursor over areas marked `data-sparkle`.
 * Canvas + rAF only while particles are alive; off on touch, reduced motion and the motion switch.
 */
export function SparkleTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !fine() || reduced()) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const star = new Path2D(STAR);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#FFC23D';
    const parts: Spark[] = [];
    let last = { x: -999, y: -999 };
    let frame = 0;
    let prev = 0;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function tick(now: number) {
      const dt = Math.min(48, now - (prev || now));
      prev = now;
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.max) {
          parts.splice(i, 1);
          continue;
        }
        const k = dt / 16;
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.vy += 0.012 * k;
        p.rot += p.vr * k;
        const t = p.life / p.max;
        const scale = (p.r / 12) * (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8);
        ctx!.save();
        ctx!.globalAlpha = 1 - t * t;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.scale(scale, scale);
        ctx!.translate(-12, -12);
        ctx!.fillStyle = color;
        ctx!.fill(star);
        ctx!.restore();
      }
      if (parts.length) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        prev = 0;
      }
    }

    function move(event: PointerEvent) {
      if (still()) return;
      const target = event.target instanceof Element ? event.target.closest('[data-sparkle]') : null;
      if (!target) return;
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      if (dx * dx + dy * dy < 22 * 22) return;
      last = { x: event.clientX, y: event.clientY };
      parts.push({
        x: event.clientX + (Math.random() - 0.5) * 10,
        y: event.clientY + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.4 - Math.random() * 0.7,
        r: 5 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.08,
        life: 0,
        max: 700 + Math.random() * 400,
      });
      if (parts.length > 50) parts.shift();
      if (!frame) frame = requestAnimationFrame(tick);
    }

    size();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  return <canvas ref={ref} className="sparkles" aria-hidden="true" />;
}

/**
 * Camera viewfinder over the hero creator wall: corner brackets, blinking REC with a running
 * timecode, and a focus square that follows the pointer. Writes to the DOM directly (no re-renders).
 */
export function Viewfinder({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = root.current;
    const host = node?.parentElement;
    if (!node || !host) return undefined;
    const start = performance.now();
    const pad = (value: number) => String(value).padStart(2, '0');
    const timer = window.setInterval(() => {
      if (!code.current) return;
      const ms = performance.now() - start;
      const total = Math.floor(ms / 1000);
      code.current.textContent = `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}:${pad(Math.floor((ms % 1000) / (1000 / 24)))}`;
    }, reduced() ? 1000 : 1000 / 24);

    function move(event: PointerEvent) {
      if (reduced() || still()) return;
      const box = host!.getBoundingClientRect();
      node!.style.setProperty('--fx', `${event.clientX - box.left}px`);
      node!.style.setProperty('--fy', `${event.clientY - box.top}px`);
      node!.dataset.focus = 'on';
    }
    function leave() {
      delete node!.dataset.focus;
    }
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      window.clearInterval(timer);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div className="vfx" ref={root} aria-hidden="true">
      <i className="vfx-c is-tl" /><i className="vfx-c is-tr" /><i className="vfx-c is-bl" /><i className="vfx-c is-br" />
      <span className="vfx-rec"><b />REC <span ref={code} dir="ltr">00:00:00:00</span></span>
      <span className="vfx-meta" dir="ltr">{label}</span>
      <span className="vfx-focus"><i /><i /><i /><i /></span>
      <span className="vfx-cross" />
    </div>
  );
}

let lastPath: string | null = null;

/** Camera-aperture iris that opens on every page change (not on the first load). */
export function Shutter() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (lastPath === null || lastPath === pathname) {
      lastPath = pathname;
      return;
    }
    lastPath = pathname;
    if (reduced() || still()) return;
    setOn(true);
  }, [pathname]);

  if (!on) return null;
  return (
    <div className="shutter" aria-hidden="true">
      <i onAnimationEnd={() => setOn(false)} />
    </div>
  );
}

/** Hearts that float up from a button when something is liked/saved. Re-key it to replay. */
export function HeartBurst() {
  const hearts = useRef(Array.from({ length: 9 }, (_, index) => ({
    x: Math.round((Math.random() - 0.5) * 90),
    d: (index % 3) * 0.06 + Math.random() * 0.08,
    s: 0.7 + Math.random() * 0.6,
    r: Math.round((Math.random() - 0.5) * 50),
  })));
  return (
    <span className="hb" aria-hidden="true">
      {hearts.current.map((item, index) => (
        <svg key={index} viewBox="0 0 24 24" style={{ ['--x' as string]: `${item.x}px`, ['--s' as string]: String(item.s), ['--r' as string]: `${item.r}deg`, animationDelay: `${item.d}s` }}>
          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

/**
 * A phone playing through real creators like stories: progress bars, Ken Burns portrait,
 * name + field, and a link to the profile. Hover pauses; tap the sides to step.
 */
export function ReelPhone({
  people,
  hrefFor,
  labels,
}: {
  people: CardPerson[];
  hrefFor: (person: CardPerson) => string;
  labels: { view: string; prev: string; next: string; region: string };
}) {
  const [index, setIndex] = useState(0);
  const go = (step: number) => setIndex((current) => (current + step + people.length) % people.length);
  const person = people[index];

  return (
    <div className="reel" role="region" aria-roledescription="carousel" aria-label={labels.region}>
      <div className="reel-screen">
        {people.map((item, i) => (
          <div key={item.id} className={`reel-shot${i === index ? ' on' : ''}`} style={{ ['--tone' as string]: item.tone }} aria-hidden={i !== index}>
            {item.shot ? <img src={item.shot} alt="" loading={i === 0 ? 'eager' : 'lazy'} /> : null}
          </div>
        ))}
        <span className="reel-shade" aria-hidden="true" />
        <div className="reel-bars" aria-hidden="true">
          {people.map((item, i) => (
            <i key={item.id} className={i < index ? 'done' : i === index ? 'on' : undefined}>
              {i === index ? <b key={index} onAnimationEnd={() => go(1)} /> : <b />}
            </i>
          ))}
        </div>
        <div className="reel-top" aria-hidden="true">
          <span className="reel-ava" style={{ ['--tone' as string]: person.tone }}>{person.shot ? <img src={person.shot} alt="" /> : person.initial}</span>
          <b dir="auto">{person.name}</b>
        </div>
        <button type="button" className="reel-tap is-prev" onClick={() => go(-1)} aria-label={labels.prev}><BackIcon size={18} /></button>
        <button type="button" className="reel-tap is-next" onClick={() => go(1)} aria-label={labels.next}><ArrowIcon size={18} /></button>
        <div className="reel-info" aria-live="polite">
          {person.category ? <span className="tag">{person.category}</span> : null}
          <strong dir="auto">{person.name}</strong>
          {person.place ? <span className="reel-place"><Icon name="pin" size={14} />{person.place}</span> : null}
          <Link href={hrefFor(person)} className="btn btn-acc btn-sm">{labels.view}<ArrowIcon size={16} /></Link>
        </div>
      </div>
      <span className="reel-notch" aria-hidden="true" />
    </div>
  );
}
