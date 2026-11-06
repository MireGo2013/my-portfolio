import type { Metadata } from 'next';
import { SectionPlaceholder } from '@/components/admin/section-placeholder';

export const metadata: Metadata = { title: 'Проекты' };

export default function Page() {
  return <SectionPlaceholder title="Проекты" step={5} />;
}
