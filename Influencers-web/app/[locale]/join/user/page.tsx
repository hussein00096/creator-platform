import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefUserJoin } from '@/components/ref/auth';
import { getAuth } from '@/lib/copy-auth';
import { isLocale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getAuth(locale).roles.user.title };
}

export default async function JoinUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  return <RefUserJoin locale={locale} next={next || ''} />;
}
