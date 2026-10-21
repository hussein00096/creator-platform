import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefJoin } from '@/components/ref/join';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { categoryLabel } from '@/lib/names';
import { isLocale, type CategoryNode } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).joinUs };
}

/** Join landing — port of design/reference/join-creator.html with the real categories. */
export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const categories = await api<CategoryNode[]>('/api/v1/categories').then((result) => result.data).catch(() => [] as CategoryNode[]);
  const fields = categories.map((parent) => ({
    id: parent.id,
    slug: parent.slug,
    name: categoryLabel(locale, parent),
    kids: (parent.children || []).slice(0, 3).map((kid) => categoryLabel(locale, kid)),
    // Reference rows lead to sign-up; the modelling field opens the model variant of the creator form.
    href: `/${locale}/join/influencer${parent.slug === 'models-fashion' ? '?as=model' : ''}`,
  }));
  return <RefJoin locale={locale} fields={fields} />;
}
