import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefAccount } from '@/components/ref/dash-account';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type CategoryNode, type Locale, type Place } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).account };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const copy = getCopy(locale);
  try {
    const [tree, governorates, countries] = await Promise.all([
      api<CategoryNode[]>('/api/v1/categories'),
      api<Place[]>('/api/v1/governorates'),
      api<Place[]>('/api/v1/countries'),
    ]);
    return <RefAccount locale={locale} tree={tree.data} governorates={governorates.data} countries={countries.data} />;
  } catch {
    return <p className="empty disp">{copy.offline}</p>;
  }
}
