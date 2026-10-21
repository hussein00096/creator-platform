import type { Metadata } from 'next';
import { AdminContact } from '@/components/admin-contact';
import { getAdmin } from '@/lib/copy-admin';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getAdmin(locale).navContact };
}

export default function Page() {
  return <AdminContact />;
}
