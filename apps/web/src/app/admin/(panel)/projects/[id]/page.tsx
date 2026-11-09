import type { Metadata } from 'next';
import { ExperienceEditPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Проект' };

export default function Page() {
  return <ExperienceEditPage />;
}
