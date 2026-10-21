import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefCreatorJoin } from '@/components/ref/auth-creator';
import { Gate } from '@/components/desk';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type CategoryNode, type Locale, type Place } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).joinTalent };
}

export default async function JoinInfluencerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const { locale: raw } = await params;
  const { as } = await searchParams;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const copy = getCopy(locale);
  try {
    const [tree, governorates, countries] = await Promise.all([
      api<CategoryNode[]>('/api/v1/categories'),
      api<Place[]>('/api/v1/governorates'),
      api<Place[]>('/api/v1/countries'),
    ]);
    return (
      <RefCreatorJoin
        locale={locale}
        tree={tree.data}
        governorates={governorates.data}
        countries={countries.data}
        mode={as === 'model' ? 'model' : 'influencer'}
      />
    );
  } catch {
    return <Gate eyebrow={copy.joinTalent} title={copy.offline} shot="/scenes/fashion.jpg" />;
  }
}
