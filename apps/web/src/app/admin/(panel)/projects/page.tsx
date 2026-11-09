import type { Metadata } from 'next';
import { WorkListPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Проекты' };

export default function Page() {
  return <WorkListPage />;
}
