import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefAbout } from '@/components/ref/about';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type CategoryNode, type Contact, type Influencer, type Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).about };
}

/** About — port of design/reference/about.html with real counts and platform contact. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const [list, tree, contact] = await Promise.all([
    api<Influencer[]>('/api/v1/influencers?limit=1').catch(() => null),
    api<CategoryNode[]>('/api/v1/categories').then((result) => result.data).catch(() => [] as CategoryNode[]),
    api<Contact | null>('/api/v1/platform-contact').then((result) => result.data).catch(() => null),
  ]);
  const specialties = tree.reduce((sum, parent) => sum + (parent.children || []).length, 0);
  return <RefAbout locale={locale} total={list?.meta?.total ?? 0} specialties={specialties} contact={contact} />;
}
