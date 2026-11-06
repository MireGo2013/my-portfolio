import type { Metadata } from 'next';
import { CvEditor } from '@/components/admin/cv-editor';

export const metadata: Metadata = { title: 'Резюме' };

export default function Page() {
  return <CvEditor />;
}
