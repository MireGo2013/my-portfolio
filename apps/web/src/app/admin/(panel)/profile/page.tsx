import type { Metadata } from 'next';
import { SectionPlaceholder } from '@/components/admin/section-placeholder';

export const metadata: Metadata = { title: 'Профиль' };

export default function Page() {
  return <SectionPlaceholder title="Профиль" step={5} />;
}
