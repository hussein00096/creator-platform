import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminRequests } from '@/components/admin-requests';
import { getAdmin } from '@/lib/copy-admin';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getAdmin(locale).navRequests };
}

export default function Page() {
  return <Suspense><AdminRequests /></Suspense>;
}
