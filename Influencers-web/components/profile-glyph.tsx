import type { ReactNode } from 'react';

const paths: Record<string, ReactNode> = {
  instagram: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h0" /></>,
  youtube: <><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V2a5 5 0 0 0 5 5" />,
  snapchat: <path d="M12 3c3 0 5 2.2 5 5.2V11l2 .6-.6 1.6-1.8.2c.6 2 2 3.2 3.4 3.6l-.4 1.3-2.5.4-.6 1.5c-1.6-.4-2.8.8-4.5.8s-2.9-1.2-4.5-.8l-.6-1.5-2.5-.4-.4-1.3c1.4-.4 2.8-1.6 3.4-3.6l-1.8-.2-.6-1.6L7 11V8.2C7 5.2 9 3 12 3z" />,
  x: <path d="M4 4l16 16M20 4 4 20" />,
};

/** Lucide-style glyph for a social platform; falls back to a globe. */
export function PlatformGlyph({ platform, size = 22 }: { platform: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[platform] || <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>}
    </svg>
  );
}
