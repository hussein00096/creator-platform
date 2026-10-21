'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';

/** Tabs with an underline that scales in under the active tab. */
export function ProfileTabs({ label, items }: { label: string; items: { id: string; label: string; count?: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const base = useId();

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === active);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let next = index;
    if (event.key === 'ArrowRight') next = index + (rtl ? -1 : 1);
    else if (event.key === 'ArrowLeft') next = index + (rtl ? 1 : -1);
    else return;
    event.preventDefault();
    const item = items[(next + items.length) % items.length];
    setActive(item.id);
    document.getElementById(`${base}-t-${item.id}`)?.focus();
  }

  return (
    <div>
      <div className="pf-tabs" role="tablist" aria-label={label} onKeyDown={onKey}>
        {items.map((item) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              id={`${base}-t-${item.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${base}-p-${item.id}`}
              tabIndex={on ? 0 : -1}
              className="pf-tab"
              onClick={() => setActive(item.id)}
            >
              {item.label}
              {item.count ? <small>{item.count}</small> : null}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${base}-p-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-t-${item.id}`}
          hidden={item.id !== active}
          className="pf-panel"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
