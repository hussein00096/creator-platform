import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefStudio } from '@/components/ref/dash-studio';
import { getCopy } from '@/lib/copy';
import { isLocale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).studio };
}

export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <RefStudio locale={locale} />;
}
