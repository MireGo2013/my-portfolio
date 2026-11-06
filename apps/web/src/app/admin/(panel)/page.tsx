import { redirect } from 'next/navigation';
import { ADMIN_START } from '@/lib/admin/paths';

export default function AdminHome() {
  redirect(ADMIN_START);
}
