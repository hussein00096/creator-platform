import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefContact } from '@/components/ref/about';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type Contact, type Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).contact };
}

/** Contact — the contact section of design/reference/about.html, filled from /api/v1/platform-contact. */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const contact = await api<Contact | null>('/api/v1/platform-contact').then((result) => result.data).catch(() => null);
  return <RefContact locale={locale} contact={contact} />;
}
