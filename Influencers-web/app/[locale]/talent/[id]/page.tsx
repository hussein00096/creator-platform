import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefProfile } from '@/components/ref/profile';
import { ApiError, api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type Influencer, type Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^\d+$/.test(id)) return { title: getCopy(locale).directory };
  try {
    const person = (await api<Influencer>(`/api/v1/influencers/${id}`)).data;
    return { title: person.name };
  } catch {
    return { title: getCopy(locale).directory };
  }
}

/** Creator profile — 1:1 port of design/reference/profile.html (components/ref/profile.tsx). */
export default async function TalentPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw) || !/^\d+$/.test(id)) notFound();
  const locale: Locale = raw;
  const copy = getCopy(locale);

  let person: Influencer;
  try {
    person = (await api<Influencer>(`/api/v1/influencers/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <div className="wrap sec"><p className="empty">{copy.offline}</p></div>;
  }

  const profile = person.profile;
  if (!profile) notFound();

  // One extra read-only call: people from the first category, minus this person.
  const first = profile.categories[0];
  const similar = first
    ? await api<Influencer[]>(`/api/v1/influencers?categoryId=${first.id}&limit=9`)
      .then((result) => result.data.filter((item) => item.id !== person.id && item.profile))
      .catch(() => [] as Influencer[])
    : [];

  return <RefProfile locale={locale} person={person} similar={similar} />;
}
