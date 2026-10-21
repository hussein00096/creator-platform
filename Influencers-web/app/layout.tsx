import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Motion } from '@/components/motion';
import { themeBoot } from '@/lib/boot';
import './globals.css';
// Reference design (design/reference/assets/site.css), copied unchanged. Loaded right after the
// base styles so its values win, exactly like the reference pages' <link> order.
import './styles/reference/site.css';
import './styles/shared.css';
import './styles/home.css';
import './styles/directory.css';
import './styles/profile.css';
import './styles/booking.css';
import './styles/auth.css';
import './styles/join.css';
import './styles/dashboard.css';
import './styles/about.css';
import './styles/admin.css';
import './styles/flair.css';
import './styles/reference/pages.css';
import './styles/reference/profile.css';
import './styles/reference/booking.css';
import './styles/reference/join.css';
import './styles/reference/auth.css';
import './styles/reference/dashboard.css';
import './styles/reference/about.css';

export const metadata: Metadata = { title: 'بريق' };
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0E0D12',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Same families and weights as the reference pages' <head>. */}
        <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="bq" style={{ '--acc': '#FFC23D' } as CSSProperties}>
          <div className="prog" aria-hidden="true" />
          <div className="cur-ring" aria-hidden="true" />
          <div className="cur-dot" aria-hidden="true" />
          <svg className="grain" aria-hidden="true"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={3} stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#gr)" /></svg>
          {children}
          <Motion />
        </div>
      </body>
    </html>
  );
}
