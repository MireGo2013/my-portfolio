import type { Metadata } from 'next';
import { ProjectEditPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Проект' };

export default function Page() {
  return <ProjectEditPage />;
}
