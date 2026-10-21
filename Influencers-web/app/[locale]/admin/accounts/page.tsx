import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminAccounts } from '@/components/admin-accounts';
import { getAdmin } from '@/lib/copy-admin';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getAdmin(locale).navAccounts };
}

export default function Page() {
  return <Suspense><AdminAccounts /></Suspense>;
}
