// Small pieces repeated across the ported reference pages (design/reference/*.html).
import type { CSSProperties } from 'react';

export const STAR = 'M12 1.5C12.6 7.6 16.4 11.4 22.5 12C16.4 12.6 12.6 16.4 12 22.5C11.4 16.4 7.6 12.6 1.5 12C7.6 11.4 11.4 7.6 12 1.5Z';

/** `.sil` placeholder silhouette, exactly as in the reference. */
export function Sil() {
  return (
    <svg className="sil" viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><circle cx="100" cy="86" r="44" fill="rgba(255,255,255,.2)"></circle><path d="M14 230c4-62 42-100 86-100s82 38 86 100z" fill="rgba(255,255,255,.2)"></path></svg>
  );
}

/** Real photo inside `.ph` (fills it, zooms on card hover like `.sil`), or the silhouette fallback. */
export function Shot({ src }: { src: string | null }) {
  return src ? <img className="rph" src={src} alt="" loading="lazy" decoding="async" /> : <Sil />;
}

/** `.vf` verified badge. */
export function Vf() {
  return (
    <span className="vf"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></span>
  );
}

/** The "forward" arrow used inside buttons (`.arr`). */
export function Arr({ size = 20, sw = '2.2' }: { size?: number; sw?: string }) {
  return (
    <svg className="arr" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g className="back" style={{ transformOrigin: 'center' }}><path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path></g></svg>
  );
}

export function Logo({ locale, word }: { locale: string; word: string }) {
  return (
    <a className="logo" href={`/${locale}`}>
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} fill="var(--acc)"></path></svg>
      <span className="disp" style={{ fontSize: '28px', fontWeight: '900' }}>{word}</span>
    </a>
  );
}

/** Eastern Arabic digits, zero-padded to two (decorative numbers in the reference). */
export function num(value: number, locale: string) {
  const text = String(value).padStart(2, '0');
  return locale === 'ar' ? text.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : text;
}

export const bg = (color: string): CSSProperties => ({ background: color });
