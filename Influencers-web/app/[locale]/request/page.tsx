import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefBooking } from '@/components/ref/booking';
import { getCopy } from '@/lib/copy';
import { isLocale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).request };
}

export default async function RequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <RefBooking locale={locale} />;
}
