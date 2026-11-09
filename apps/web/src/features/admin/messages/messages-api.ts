import type { MessageStatus } from '@portfolio/shared';
import type { components, paths } from '@/shared/api/schema';
import { adminClient, unwrap } from '@/features/admin/shell/admin-client';

export type Message = components['schemas']['MessageDto'];
export type MessagePage = components['schemas']['MessagePageDto'];
export type MessageCounts = components['schemas']['MessageCountsDto'];
export type MessagesApiQuery = NonNullable<
  paths['/api/v1/admin/messages']['get']['parameters']['query']
>;

/** Ключи кэша TanStack Query. Общий префикс позволяет сбросить всё разом. */
export const messageKeys = {
  all: ['admin', 'messages'] as const,
  list: (query: MessagesApiQuery) =>
    [...messageKeys.all, 'list', query] as const,
  counts: () => [...messageKeys.all, 'counts'] as const,
  item: (id: string) => [...messageKeys.all, 'item', id] as const,
};

export async function fetchMessages(
  query: MessagesApiQuery,
  signal?: AbortSignal,
): Promise<MessagePage> {
  return unwrap(
    await adminClient().GET('/api/v1/admin/messages', {
      params: { query },
      signal,
    }),
  );
}

export async function fetchMessageCounts(
  signal?: AbortSignal,
): Promise<MessageCounts> {
  return unwrap(
    await adminClient().GET('/api/v1/admin/messages/counts', { signal }),
  );
}

export async function fetchMessage(
  id: string,
  signal?: AbortSignal,
): Promise<Message> {
  return unwrap(
    await adminClient().GET('/api/v1/admin/messages/{id}', {
      params: { path: { id } },
      signal,
    }),
  );
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<Message> {
  return unwrap(
    await adminClient().PATCH('/api/v1/admin/messages/{id}', {
      params: { path: { id } },
      body: { status },
    }),
  );
}
