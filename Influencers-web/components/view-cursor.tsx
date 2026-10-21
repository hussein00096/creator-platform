'use client';

import { useEffect, useState } from 'react';

export function ViewCursor({ label }: { label: string }) {
  const [point, setPoint] = useState({ x: 0, y: 0, on: false });

  useEffect(() => {
    function move(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target.closest('[data-view]') : null;
      setPoint({ x: event.clientX, y: event.clientY, on: Boolean(target) });
    }
    function leave() {
      setPoint((current) => ({ ...current, on: false }));
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('blur', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', leave);
    };
  }, []);

  if (!point.on) return null;
  return (
    <span className="view-tag" style={{ left: point.x, top: point.y }}>
      {label}
    </span>
  );
}
