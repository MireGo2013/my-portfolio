import type { Metadata } from 'next';
import { ProjectListPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Опыт' };

export default function Page() {
  return <ProjectListPage />;
}
