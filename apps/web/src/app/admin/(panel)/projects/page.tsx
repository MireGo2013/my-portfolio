import type { Metadata } from 'next';
import { ExperienceListPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Проекты' };

export default function Page() {
  return <ExperienceListPage />;
}
