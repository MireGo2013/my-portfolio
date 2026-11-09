import { redirect } from 'next/navigation';
import { ADMIN_START } from '@/features/admin/shell/paths';

export default function AdminHome() {
  redirect(ADMIN_START);
}
