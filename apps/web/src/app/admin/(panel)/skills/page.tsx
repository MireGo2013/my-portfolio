import type { Metadata } from 'next';
import { SkillsListPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Стек' };

export default function Page() {
  return <SkillsListPage />;
}
