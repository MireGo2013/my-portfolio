import type { Metadata } from 'next';
import { ProjectEditPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Проект' };

export default function Page() {
  return <ProjectEditPage />;
}
