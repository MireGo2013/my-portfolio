import type { Metadata } from 'next';
import { MessageCard } from '@/components/admin/message-card';

export const metadata: Metadata = { title: 'Сообщение' };

// id карточка берёт из адреса через useParams: данные грузятся в браузере,
// как и весь остальной контент админки
export default function MessagePage() {
  return <MessageCard />;
}
