import type { Metadata } from 'next';
import { AdminOverview } from '@/components/admin-overview';
import { getAdmin } from '@/lib/copy-admin';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getAdmin(locale).navOverview };
}

export default function Page() {
  return <AdminOverview />;
}
