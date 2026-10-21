'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCopy } from '@/lib/copy';
import type { Locale } from '@/lib/types';

export type PickOption = { value: string; label: string };

function useDismiss(open: boolean, onClose: () => void) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function click(event: MouseEvent) {
      const node = event.target as HTMLElement;
      if (root.current?.contains(node) || node.closest('[data-pick-layer]')) return;
      onClose();
    }
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', click);
      document.removeEventListener('keydown', key);
    };
  }, [open, onClose]);
  return root;
}

function placeLayer(anchor: HTMLElement, height: number, minWidth = 280, maxWidth?: number) {
  const box = anchor.getBoundingClientRect();
  const preferred = maxWidth != null ? Math.min(Math.max(minWidth, box.width), maxWidth) : Math.max(box.width, minWidth);
  const width = Math.min(preferred, window.innerWidth - 16);
  const gap = 8;
  const spaceBelow = window.innerHeight - box.bottom - gap;
  const spaceAbove = box.top - gap;
  const openAbove = spaceBelow < height && spaceAbove > spaceBelow;
  const room = Math.max(160, openAbove ? spaceAbove : spaceBelow);
  const top = openAbove ? Math.max(8, box.top - Math.min(height, room) - gap) : box.bottom + gap;
  let left = document.documentElement.dir === 'rtl' ? box.right - width : box.left;
  left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
  return { top, left, width, maxHeight: room };
}

function useLayer(open: boolean, anchor: HTMLElement | null, height: number, minWidth?: number, maxWidth?: number) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  useEffect(() => {
    if (!open || !anchor) {
      setPos(null);
      return;
    }
    function place() {
      if (!anchor) return;
      setPos(placeLayer(anchor, height, minWidth, maxWidth));
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, height, minWidth, maxWidth]);
  return pos;
}

export function Pick({
  value,
  onChange,
  options,
  name,
  placeholder,
  required,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PickOption[];
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useDismiss(open, () => setOpen(false));
  const current = options.find((item) => item.value === value);
  const pos = useLayer(open, root.current, Math.min(16 * 16, 56 + options.length * 44), 220);

  const menu = open && pos ? (
    <ul className="pick-menu" data-pick-layer data-lenis-prevent="" role="listbox" style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}>
      {options.map((item) => (
        <li key={item.value}>
          <button
            type="button"
            role="option"
            aria-selected={item.value === value}
            data-on={item.value === value || undefined}
            onClick={() => {
              onChange(item.value);
              setOpen(false);
            }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className="pick" ref={root} data-open={open || undefined}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        className="pick-face"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        data-empty={!current || undefined}
      >
        <span>{current?.label || placeholder || ''}</span>
        <i aria-hidden="true" />
      </button>
      {required && !value ? <input className="pick-required" tabIndex={-1} required value="" onChange={() => undefined} /> : null}
      {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  );
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: 1 };
}

function shiftYear(year: number, month: number, delta: number) {
  return { year: year + delta, month, day: 1 };
}

function yearWindow(year: number) {
  const start = year - ((year % 12) + 12) % 12;
  return Array.from({ length: 12 }, (_, index) => start + index);
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

export function DatePick({
  locale,
  value,
  onChange,
  label,
  name,
  min,
  max,
  required,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  label: string;
  name?: string;
  min?: string;
  max?: string;
  required?: boolean;
}) {
  const copy = getCopy(locale);
  const parsed = parseIso(value);
  const cap = parseIso(max || '') || { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };
  const [open, setOpen] = useState(false);
  const [yearsOpen, setYearsOpen] = useState(false);
  const [cursor, setCursor] = useState(() => parsed || cap);
  const root = useDismiss(open, () => { setOpen(false); setYearsOpen(false); });
  const pos = useLayer(open, root.current, yearsOpen ? 280 : 360, 280, 340);
  const minYear = min ? Number(min.slice(0, 4)) : 1920;
  const maxYear = max ? Number(max.slice(0, 4)) : new Date().getFullYear();
  const years = yearWindow(cursor.year);

  function toggleCal() {
    if (open) {
      setOpen(false);
      setYearsOpen(false);
      return;
    }
    setCursor(parsed || cap);
    setYearsOpen(false);
    setOpen(true);
  }

  const days = useMemo(() => {
    const first = new Date(cursor.year, cursor.month - 1, 1);
    const start = (first.getDay() + 1) % 7;
    const count = new Date(cursor.year, cursor.month, 0).getDate();
    const cells: (number | null)[] = [...Array(start).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [cursor.year, cursor.month]);

  const shown = parsed
    ? locale === 'ar'
      ? `${parsed.day} ${copy.calMonths[parsed.month - 1]} ${parsed.year}`
      : `${copy.calMonths[parsed.month - 1]} ${parsed.day}, ${parsed.year}`
    : '';

  function pick(day: number) {
    const next = iso(cursor.year, cursor.month, day);
    if (min && next < min) return;
    if (max && next > max) return;
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="pick pick-date" ref={root} data-open={open || undefined}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button type="button" className="pick-face date-face" onClick={toggleCal} data-empty={!value || undefined} aria-expanded={open}>
        <span>{shown || ' '}</span>
        <b>{label}</b>
        <i className="date-ico" aria-hidden="true" />
      </button>
      {required && !value ? <input className="pick-required" tabIndex={-1} required value="" onChange={() => undefined} /> : null}
      {open && pos && typeof document !== 'undefined' ? createPortal((
        <div className="cal" data-pick-layer data-lenis-prevent="" style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}>
          <header>
            <div className="cal-nav">
              <button type="button" aria-label={copy.calPrevYear} disabled={cursor.year <= minYear} onClick={() => setCursor((current) => shiftYear(current.year, current.month, yearsOpen ? -12 : -1))}>«</button>
              {yearsOpen ? null : <button type="button" aria-label={copy.calPrev} onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}>‹</button>}
            </div>
            <button type="button" className="cal-title" onClick={() => setYearsOpen((current) => !current)}>
              {yearsOpen ? `${years[0]} – ${years[11]}` : `${copy.calMonths[cursor.month - 1]} ${cursor.year}`}
            </button>
            <div className="cal-nav">
              {yearsOpen ? null : <button type="button" aria-label={copy.calNext} onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}>›</button>}
              <button type="button" aria-label={copy.calNextYear} disabled={cursor.year >= maxYear} onClick={() => setCursor((current) => shiftYear(current.year, current.month, yearsOpen ? 12 : 1))}>»</button>
            </div>
          </header>
          {yearsOpen ? (
            <div className="cal-years">
              {years.map((year) => (
                <button
                  type="button"
                  key={year}
                  data-on={year === cursor.year || undefined}
                  disabled={year < minYear || year > maxYear}
                  onClick={() => {
                    setCursor((current) => ({ ...current, year, day: 1 }));
                    setYearsOpen(false);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="cal-week">
                {copy.calDays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="cal-grid">
                {days.map((day, index) => {
                  if (!day) return <span key={`e-${index}`} />;
                  const stamp = iso(cursor.year, cursor.month, day);
                  const off = (min && stamp < min) || (max && stamp > max);
                  return (
                    <button
                      type="button"
                      key={stamp}
                      data-on={stamp === value || undefined}
                      disabled={Boolean(off)}
                      onClick={() => pick(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ), document.body) : null}
    </div>
  );
}

export function FilePick({
  locale,
  label,
  hint,
  accept = 'image/png,image/jpeg,image/webp',
  multiple,
  files,
  onChange,
  preview,
  frame,
}: {
  locale: Locale;
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  preview?: string | null;
  frame?: 'portrait' | 'cover' | 'gallery';
}) {
  const copy = getCopy(locale);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const names = files.map((file) => file.name).join(locale === 'ar' ? '، ' : ', ');
  const slot = frame === 'portrait' || frame === 'cover';
  const title = preview
    ? copy.changePhoto
    : names || (slot ? copy.pickPhotoAdd : multiple ? copy.pickPhotosAdd : label);

  function take(list: FileList | File[] | null) {
    if (!list) return;
    const next = Array.from(list);
    onChange(multiple ? next : next.slice(0, 1));
    if (input.current) input.current.value = '';
  }

  return (
    <div className="file-pick">
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => take(event.target.files)}
      />
      <button
        type="button"
        className="file-face"
        data-frame={frame || undefined}
        data-over={over || undefined}
        data-has={preview || names ? 'on' : undefined}
        onClick={() => input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files);
        }}
      >
        {preview ? <img src={preview} alt="" /> : null}
        {!preview ? (
          <span className="file-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4.5 8.2A2.2 2.2 0 0 1 6.7 6h2.1l.8-1.6A1.2 1.2 0 0 1 10.7 3.8h2.6c.44 0 .84.24 1.05.63L15.2 6h2.1A2.2 2.2 0 0 1 19.5 8.2v8.6A2.2 2.2 0 0 1 17.3 19H6.7A2.2 2.2 0 0 1 4.5 16.8V8.2Z" />
              <circle cx="12" cy="12.4" r="3.1" />
            </svg>
          </span>
        ) : null}
        <span className="file-copy">
          <b>{title}</b>
          <small>{hint || copy.pickPhotoHint}</small>
        </span>
      </button>
    </div>
  );
}

export function Swatches({
  label,
  items,
  value,
  onChange,
  names,
}: {
  label: string;
  items: readonly { id: string; tone: string }[];
  value: string;
  onChange: (value: string) => void;
  names: Record<string, string>;
}) {
  const current = items.find((item) => item.id === value);
  return (
    <div className="swatches">
      <p className="legend">{label}{current ? <em>{names[current.id]}</em> : null}</p>
      <div className="swatch-row">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            data-on={value === item.id}
            onClick={() => onChange(item.id)}
            style={{ ['--tone' as string]: item.tone }}
            aria-label={names[item.id]}
            title={names[item.id]}
          />
        ))}
      </div>
    </div>
  );
}
