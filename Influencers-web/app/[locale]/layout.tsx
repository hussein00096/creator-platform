import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Frame } from '@/components/frame';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type Contact } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = getCopy(locale);
  return { title: { default: copy.wordmark, template: `%s — ${copy.wordmark}` } };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Footer contact column; the page still renders if the API is down.
  const contact = await api<Contact | null>('/api/v1/platform-contact').then((result) => result.data).catch(() => null);
  return (
    <Suspense fallback={<main>{children}</main>}>
      <Frame locale={locale} contact={contact}>{children}</Frame>
    </Suspense>
  );
}
