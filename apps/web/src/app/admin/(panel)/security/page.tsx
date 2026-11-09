import type { Metadata } from 'next';
import { TwoFactorSettings } from '@/features/admin/security/two-factor-settings';

export const metadata: Metadata = { title: 'Безопасность' };

export default function Page() {
  return <TwoFactorSettings />;
}
