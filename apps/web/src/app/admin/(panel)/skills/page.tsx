import type { Metadata } from 'next';
import { SectionPlaceholder } from '@/components/admin/section-placeholder';

export const metadata: Metadata = { title: 'Стек' };

export default function Page() {
  return <SectionPlaceholder title="Стек" step={5} />;
}
