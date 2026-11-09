import type { Metadata } from 'next';
import { SkillCategoryEditPage } from '@/features/admin/content/section-pages';

export const metadata: Metadata = { title: 'Новая группа' };

export default function Page() {
  return <SkillCategoryEditPage />;
}
