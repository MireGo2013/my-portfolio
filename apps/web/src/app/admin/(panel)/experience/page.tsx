import type { Metadata } from 'next';
import { SectionPlaceholder } from '@/components/admin/section-placeholder';

export const metadata: Metadata = { title: 'Опыт' };

export default function Page() {
  return <SectionPlaceholder title="Опыт" step={5} />;
}
