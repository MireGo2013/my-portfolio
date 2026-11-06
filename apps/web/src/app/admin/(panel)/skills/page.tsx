import type { Metadata } from 'next';
import { SkillsListPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Стек' };

export default function Page() {
  return <SkillsListPage />;
}
