import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefClientJoin } from '@/components/ref/auth';
import { Gate } from '@/components/desk';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type Locale, type Place } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).joinClient };
}

export default async function JoinClientPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const copy = getCopy(locale);
  try {
    const [governorates, countries] = await Promise.all([
      api<Place[]>('/api/v1/governorates'),
      api<Place[]>('/api/v1/countries'),
    ]);
    return <RefClientJoin locale={locale} governorates={governorates.data} countries={countries.data} />;
  } catch {
    return <Gate eyebrow={copy.joinClient} title={copy.offline} shot="/scenes/campaign.jpg" />;
  }
}
