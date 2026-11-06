import type { Metadata } from 'next';
import { ExperienceListPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Проекты' };

export default function Page() {
  return <ExperienceListPage />;
}
