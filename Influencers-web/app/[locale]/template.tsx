import type { ReactNode } from 'react';
import { Shutter } from '@/components/flair';

export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <Shutter />
      <div className="page">{children}</div>
    </>
  );
}
