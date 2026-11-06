import type { Metadata } from 'next';
import { ExperienceEditPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Новый проект' };

export default function Page() {
  return <ExperienceEditPage />;
}
