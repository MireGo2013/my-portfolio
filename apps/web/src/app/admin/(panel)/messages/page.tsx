import type { Metadata } from 'next';
import { SectionPlaceholder } from '@/components/admin/section-placeholder';

export const metadata: Metadata = { title: 'Сообщения' };

export default function Page() {
  return <SectionPlaceholder title="Сообщения" step={4} />;
}
