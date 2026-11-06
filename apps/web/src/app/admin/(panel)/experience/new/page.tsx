import type { Metadata } from 'next';
import { ProjectEditPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Новый проект' };

export default function Page() {
  return <ProjectEditPage />;
}
