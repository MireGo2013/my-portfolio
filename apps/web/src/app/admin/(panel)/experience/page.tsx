import type { Metadata } from 'next';
import { ProjectListPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Опыт' };

export default function Page() {
  return <ProjectListPage />;
}
