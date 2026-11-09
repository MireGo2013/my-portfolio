import type { Metadata } from 'next';
import { MessagesView } from '@/features/admin/messages/messages-view';

export const metadata: Metadata = { title: 'Сообщения' };

export default function MessagesPage() {
  return <MessagesView />;
}
