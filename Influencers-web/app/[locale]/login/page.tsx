import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefLogin } from '@/components/ref/auth';
import { getCopy } from '@/lib/copy';
import { isLocale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).enter };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  return <RefLogin locale={locale} next={next || ''} />;
}
