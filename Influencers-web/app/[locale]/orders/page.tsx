import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefOrders } from '@/components/ref/dash-orders';
import { getCopy } from '@/lib/copy';
import { isLocale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).orders };
}

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <RefOrders locale={locale} />;
}
