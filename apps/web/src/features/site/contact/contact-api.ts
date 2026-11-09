import createClient from 'openapi-fetch';
import type { ContactMessage } from '@portfolio/shared';
import type { paths } from '@/shared/api/schema';

export type SendResult = 'sent' | 'rate-limited' | 'failed';

/** Вызывается из браузера, поэтому при любом сбое возвращает результат, а не бросает. */
export async function sendContactMessage(
  baseUrl: string,
  body: ContactMessage,
): Promise<SendResult> {
  const client = createClient<paths>({ baseUrl });

  try {
    const { response } = await client.POST('/api/v1/contact', { body });
    if (response.ok) return 'sent';
    return response.status === 429 ? 'rate-limited' : 'failed';
  } catch {
    return 'failed';
  }
}
