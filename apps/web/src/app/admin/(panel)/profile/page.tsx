import type { Metadata } from 'next';
import { ProfileEditor } from '@/components/admin/profile-form';

export const metadata: Metadata = { title: 'Профиль' };

export default function Page() {
  return <ProfileEditor />;
}
