import type { Metadata } from 'next';
import { ExperienceEditPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Проект' };

export default function Page() {
  return <ExperienceEditPage />;
}
