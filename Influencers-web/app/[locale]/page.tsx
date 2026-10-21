import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefHome } from '@/components/ref/home';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { categoryLabel } from '@/lib/names';
import { toCard } from '@/lib/people';
import { isLocale, type CategoryNode, type Contact, type Influencer, type Locale } from '@/lib/types';

const chipSlugs = ['fashion-model', 'photography', 'ugc-content-creation', 'video-editing', 'voice-over'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: { absolute: getCopy(locale).wordmark } };
}

/** Home — port of design/reference/index.html with real data. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const [categories, listed, popular, contact] = await Promise.all([
    api<CategoryNode[]>('/api/v1/categories').then((result) => result.data).catch(() => [] as CategoryNode[]),
    api<Influencer[]>('/api/v1/influencers?limit=24').catch(() => null),
    api<Influencer[]>('/api/v1/influencers?sort=popular&limit=8').catch(() => null),
    api<Contact | null>('/api/v1/platform-contact').then((result) => result.data).catch(() => null),
  ]);

  const people = (listed?.data || []).filter((person) => person.profile).map((person) => toCard(locale, person));
  const trending = (popular?.data || []).filter((person) => person.profile).map((person) => toCard(locale, person));
  const children = categories.flatMap((parent) => parent.children || []);

  const fields = categories.map((parent) => {
    const kids = parent.children || [];
    const inField = people.filter((person) => person.parentIds.includes(parent.id) || person.categoryIds.some((id) => kids.some((kid) => kid.id === id)));
    return {
      id: parent.id,
      name: categoryLabel(locale, parent),
      href: `/${locale}/directory?categoryId=${parent.id}&group=${parent.slug}`,
      people: inField.map((person) => person.id),
      minis: inField.slice(0, 3).map((person) => ({ shot: person.shot, tone: person.tone })),
    };
  });

  const chips = chipSlugs.flatMap((slug) => {
    const match = children.find((item) => item.slug === slug);
    return match ? [{ name: categoryLabel(locale, match), href: `/${locale}/directory?categoryId=${match.id}` }] : [];
  });

  const modelsParent = categories.find((parent) => parent.slug === 'models-fashion');
  const models = modelsParent
    ? people.filter((person) => person.available && fields.find((field) => field.id === modelsParent.id)?.people.includes(person.id)).slice(0, 4)
    : [];

  return <RefHome locale={locale} people={people} trending={trending} models={models} fields={fields} chips={chips} contact={contact} />;
}
