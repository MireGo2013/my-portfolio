import type { Metadata } from 'next';
import { ProfileEditor } from '@/features/admin/content/profile-form';

export const metadata: Metadata = { title: 'Профиль' };

export default function Page() {
  return <ProfileEditor />;
}
