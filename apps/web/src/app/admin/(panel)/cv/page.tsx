import type { Metadata } from 'next';
import { SectionPlaceholder } from '@/components/admin/section-placeholder';

export const metadata: Metadata = { title: 'Резюме' };

export default function Page() {
  return <SectionPlaceholder title="Резюме" step={7} />;
}
