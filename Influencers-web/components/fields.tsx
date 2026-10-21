import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="fld">
      <span className="lbl">{label}</span>
      {children}
    </label>
  );
}

/** Labelled input (label 14px/600 above a 54px field). */
export function Float({ label, extra, placeholder, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; extra?: ReactNode }) {
  return (
    <label className="fld">
      <span className="lbl">{label}</span>
      <input className="inp" placeholder={placeholder && placeholder.trim() ? placeholder : undefined} {...props} />
      {extra}
    </label>
  );
}

export function FloatArea({ label, extra, placeholder, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; extra?: ReactNode }) {
  return (
    <label className="fld">
      <span className="lbl">{label}</span>
      <textarea className="inp" placeholder={placeholder && placeholder.trim() ? placeholder : undefined} {...props} />
      {extra}
    </label>
  );
}

/** Two or three mutually exclusive choices (segmented control). */
export function Seg<T extends string>({ value, onChange, options }: { value: T | ''; onChange: (value: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="seg-w seg-fill" role="radiogroup">
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          role="radio"
          aria-checked={item.value === value}
          className={`seg${item.value === value ? ' on' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Word({ on, children, onClick }: { on: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
