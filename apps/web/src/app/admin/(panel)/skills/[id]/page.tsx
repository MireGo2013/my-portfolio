import type { Metadata } from 'next';
import { SkillCategoryEditPage } from '@/components/admin/section-pages';

export const metadata: Metadata = { title: 'Группа навыков' };

export default function Page() {
  return <SkillCategoryEditPage />;
}
