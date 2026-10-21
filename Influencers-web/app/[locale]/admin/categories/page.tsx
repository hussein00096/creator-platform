import type { Metadata } from 'next';
import { AdminCategories } from '@/components/admin-categories';
import { getAdmin } from '@/lib/copy-admin';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getAdmin(locale).navCategories };
}

export default function Page() {
  return <AdminCategories />;
}
