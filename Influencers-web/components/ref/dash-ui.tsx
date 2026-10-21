'use client';

// Form pieces for the ported dashboard pages, built only from the reference form classes
// (.lbl, .inp, .seg-w/.seg, .chip, .opt, .btn) of design/reference/assets/site.css.
import { useId, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

export function Field({ label, extra, ...props }: { label: string; extra?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label className="lbl" htmlFor={id}>{label}</label>
      <input id={id} className="inp" {...props} />
      {extra}
    </div>
  );
}

export function Area({ label, extra, ...props }: { label: string; extra?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div>
      <label className="lbl" htmlFor={id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>{label}</span>{extra}</label>
      <textarea id={id} className="inp" {...props} />
    </div>
  );
}

export function Two({ children }: { children: ReactNode }) {
  return <div className="dsr-two">{children}</div>;
}

/** `.seg-w` segmented control (reference filter tabs) used as a radio group. */
export function SegRow<V extends string>({ label, value, onChange, options }: { label?: string; value: V | ''; onChange: (value: V) => void; options: { value: V; label: string }[] }) {
  return (
    <div>
      {label ? <span className="lbl">{label}</span> : null}
      <div className="seg-w" role="radiogroup" aria-label={label} style={{ maxWidth: '100%', flexWrap: 'wrap' }}>
        {options.map((item) => (
          <button key={item.value} type="button" role="radio" aria-checked={value === item.value} className={`seg ${value === item.value ? 'on' : ''}`} style={{ minHeight: '38px', padding: '0 14px', fontSize: '14px' }} onClick={() => onChange(item.value)}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}

/** Native `select.inp` with a chevron (replaces the legacy Pick dropdown). */
export function Select({ label, value, onChange, options, placeholder, required, style }: { label?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder?: string; required?: boolean; style?: CSSProperties }) {
  const id = useId();
  return (
    <div style={style}>
      {label ? <label className="lbl" htmlFor={id}>{label}</label> : null}
      <div className="dsr-sel">
        <select id={id} className="inp" value={value} required={required} aria-label={label ? undefined : placeholder} onChange={(event) => onChange(event.target.value)}>
          {placeholder ? <option value="" disabled>{placeholder}</option> : null}
          {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>
      </div>
    </div>
  );
}

/** Colour swatches (skin / hair / eyes) as round buttons. */
export function Swatch({ label, items, value, onChange, names }: { label: string; items: readonly { id: string; tone: string }[]; value: string; onChange: (value: string) => void; names: Record<string, string> }) {
  const current = items.find((item) => item.id === value);
  return (
    <div>
      <span className="lbl">{label}{current ? <em style={{ fontStyle: 'normal', color: 'var(--acc)', marginInlineStart: '8px' }}>{names[current.id]}</em> : null}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }} role="radiogroup" aria-label={label}>
        {items.map((item) => (
          <button key={item.id} type="button" role="radio" aria-checked={value === item.id} aria-label={names[item.id]} title={names[item.id]} className={`dsr-sw ${value === item.id ? 'on' : ''}`} style={{ background: item.tone }} onClick={() => onChange(item.id)} />
        ))}
      </div>
    </div>
  );
}

export function Note({ children, tone = 'note' }: { children: ReactNode; tone?: 'note' | 'err' | 'ok' }) {
  return <p className={`dsr-msg dsr-${tone}`} dir="auto" role={tone === 'err' ? 'alert' : 'status'}>{children}</p>;
}

/** Save row: status message + accent submit button. */
export function SaveBar({ saved, error, saving, savedLabel, sendLabel, sendingLabel, sticky }: { saved: boolean; error: string; saving: boolean; savedLabel: string; sendLabel: string; sendingLabel: string; sticky?: boolean }) {
  return (
    <div className={`card dsr-save${sticky ? ' is-sticky' : ''}`}>
      <div aria-live="polite" style={{ flex: '1', minWidth: '0' }}>
        {saved ? <Note tone="ok">{savedLabel}</Note> : null}
        {error ? <Note tone="err">{error}</Note> : null}
      </div>
      <button className="btn btn-acc" type="submit" disabled={saving}>{saving ? sendingLabel : sendLabel}</button>
    </div>
  );
}

/** File drop zone (replaces the legacy FilePick; same accept list, single or multiple). */
export function Drop({ label, preview, multiple, frame, onChange, accept = 'image/png,image/jpeg,image/webp' }: { label: string; preview?: string | null; multiple?: boolean; frame: 'portrait' | 'cover' | 'gallery'; onChange: (files: File[]) => void; accept?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  function take(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list);
    onChange(multiple ? next : next.slice(0, 1));
    if (input.current) input.current.value = '';
  }
  return (
    <div className={`dsr-drop is-${frame}${over ? ' over' : ''}`}>
      <input ref={input} type="file" accept={accept} multiple={multiple} onChange={(event) => take(event.target.files)} tabIndex={-1} aria-hidden="true" />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => { event.preventDefault(); setOver(false); take(event.dataTransfer.files); }}
      >
        {preview ? <img src={preview} alt="" /> : null}
        <span className="dsr-drop-l">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>
          {label}
        </span>
      </button>
    </div>
  );
}

/** Side summary card (reference offer-card avatar + status pill styles). */
export function SummaryCard({ initial, shot, kicker, status, tone, name, children }: { initial: string; shot?: string; kicker: string; status: string; tone: 'ok' | 'wait' | 'off'; name: string; children: ReactNode }) {
  const pill: CSSProperties = tone === 'ok'
    ? { background: 'rgba(74,222,128,.14)', color: '#6EE7A0' }
    : tone === 'wait' ? { background: 'rgba(255,154,92,.15)', color: '#FF9A5C' } : { background: '#24212D', color: '#B1ACBE' };
  return (
    <section className="card fd dsr-sum" style={{ borderRadius: '28px', padding: '22px', animationDelay: '.4s' }}>
      {shot ? <img className="dsr-sum-shot" src={shot} alt="" /> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#6A2F4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flex: 'none' }}>{initial}</span>
        <div style={{ flex: '1', minWidth: '0' }}>
          <div style={{ fontWeight: '700', fontSize: '15px', overflowWrap: 'anywhere' }} dir="auto">{name}</div>
          <div style={{ fontSize: '13px', color: '#8A859B' }}>{kicker}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '6px 12px', borderRadius: '999px', whiteSpace: 'nowrap', ...pill }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }}></span>{status}</span>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
    </section>
  );
}
