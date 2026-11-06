import type { Metadata } from 'next';
import { MessagesView } from '@/components/admin/messages-view';

export const metadata: Metadata = { title: 'Сообщения' };

export default function MessagesPage() {
  return <MessagesView />;
}
