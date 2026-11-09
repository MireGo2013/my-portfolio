import type { MessageStatus } from '@portfolio/shared';

export const STATUS_LABELS: Record<MessageStatus, string> = {
  NEW: 'Новое',
  READ: 'Прочитано',
  REPLIED: 'Отвечено',
  ARCHIVED: 'Архив',
  SPAM: 'Спам',
};

/** Подписи вкладок во множественном числе. */
export const STATUS_TAB_LABELS: Record<MessageStatus, string> = {
  NEW: 'Новые',
  READ: 'Прочитанные',
  REPLIED: 'Отвеченные',
  ARCHIVED: 'Архив',
  SPAM: 'Спам',
};

const dateTime = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Дата и время по часам браузера автора. */
export function formatMessageDate(iso: string): string {
  return dateTime.format(new Date(iso));
}
