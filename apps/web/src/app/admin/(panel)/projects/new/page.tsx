import type { Metadata } from 'next';
import { WorkEditPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Новый проект' };

export default function Page() {
  return <WorkEditPage />;
}
