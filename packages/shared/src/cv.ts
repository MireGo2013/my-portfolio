import { z } from 'zod';

export const CV_LIMITS = {
  /**
   * Функции Vercel принимают тело запроса до 4,5 МБ, а файл идёт через сервер
   * сайта. PDF резюме весит меньше мегабайта, так что запас большой.
   */
  maxBytes: 4 * 1024 * 1024,
} as const;

/** Публичные файлы Vercel Blob раздаются с поддоменов этого хоста. */
export const BLOB_PUBLIC_HOST_SUFFIX = '.public.blob.vercel-storage.com';

const BLOB_CV_URL =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w./-]+\.pdf$/i;

/**
 * Ссылка на загруженное резюме. API принимает только адрес публичного
 * хранилища Blob: подсунуть ссылку на чужой сайт под видом резюме нельзя.
 */
export const cvUrlSchema = z.object({
  // https://<поддомен хранилища>.public.blob.vercel-storage.com/<путь>.pdf,
  // без параметров и якоря. Регулярное выражение, а не new URL(): у пакета
  // нет ни DOM, ни Node, и так строже — не пройдут ни логин в адресе, ни порт
  url: z.string().max(500, 'urlInvalid').regex(BLOB_CV_URL, 'urlInvalid'),
});

export type CvUrlInput = z.infer<typeof cvUrlSchema>;
