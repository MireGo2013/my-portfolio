import type { Metadata } from 'next';
import { TwoFactorSettings } from '@/components/admin/two-factor-settings';

export const metadata: Metadata = { title: 'Безопасность' };

export default function Page() {
  return <TwoFactorSettings />;
}
