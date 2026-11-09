import 'server-only';
import { BLOB_PUBLIC_HOST_SUFFIX, CV_LIMITS } from '@portfolio/shared';
import {
  BlobAccessError,
  BlobError,
  BlobStoreNotFoundError,
  del,
  put,
} from '@vercel/blob';

// Работа с хранилищем Vercel Blob. Ключи доступа есть только у сервера сайта:
// на Vercel это OIDC (BLOB_STORE_ID добавляет платформа при подключении
// хранилища, токен приходит с запросом), вне Vercel — BLOB_READ_WRITE_TOKEN

/**
 * Подключено ли хранилище. Без него сайт отдаёт PDF из сборки.
 *
 * Смотрим только на BLOB_STORE_ID (его ставит Vercel при подключении) или
 * BLOB_READ_WRITE_TOKEN. Токен OIDC на Vercel приходит в заголовке запроса,
 * а не в переменной окружения: SDK найдёт его сам. Если доступа всё же нет,
 * put() бросит BlobError, и загрузка ответит тем же «не подключено».
 */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}

/** Хранилище отказало в доступе: ключей нет или они не подходят. */
export class StorageUnavailable extends Error {}

export type CvFileError = 'missing' | 'tooLarge' | 'notPdf';

/**
 * Проверяет файл до загрузки. Тип из браузера подделать легко, поэтому
 * смотрим ещё и на первые байты: любой PDF начинается с «%PDF-».
 */
export async function checkCvFile(
  file: FormDataEntryValue | null,
): Promise<{ ok: true; file: File } | { ok: false; error: CvFileError }> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'missing' };
  }
  if (file.size > CV_LIMITS.maxBytes) {
    return { ok: false, error: 'tooLarge' };
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const signature = String.fromCharCode(...head);
  if (file.type !== 'application/pdf' || signature !== '%PDF-') {
    return { ok: false, error: 'notPdf' };
  }
  return { ok: true, file };
}

/**
 * Кладёт PDF в хранилище под новым именем. Новое имя при каждой загрузке
 * (addRandomSuffix), а не перезапись того же файла: CDN хранилища кэширует
 * файлы, и посетители ещё долго получали бы старое резюме.
 */
export async function uploadCv(locale: string, file: File): Promise<string> {
  try {
    const { url } = await put(
      `cv/CV_Sobol_Software_Engineer_${locale.toUpperCase()}.pdf`,
      file,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'application/pdf',
      },
    );
    return url;
  } catch (error) {
    // Нет ключей (базовый BlobError «No blob credentials»), ключ не подходит
    // или хранилище удалено — это «не подключено». Остальное, например
    // временная недоступность сервиса, — обычная ошибка сервера
    if (
      error instanceof BlobAccessError ||
      error instanceof BlobStoreNotFoundError ||
      (error instanceof BlobError && error.constructor === BlobError)
    ) {
      throw new StorageUnavailable(error.message);
    }
    throw error;
  }
}

/**
 * Удаляет файл, если он лежит в хранилище Blob. Ошибку не бросает: файл,
 * который не удалось удалить, только занимает место, а новое резюме уже
 * на сайте.
 */
export async function deleteCv(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (new URL(url).hostname.endsWith(BLOB_PUBLIC_HOST_SUFFIX)) {
      await del(url);
    }
  } catch (error) {
    console.error('Не удалось удалить старое резюме из хранилища', error);
  }
}
