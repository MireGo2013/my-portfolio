import { CV_LIMITS, LOCALES, type Locale } from '@portfolio/shared';
import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { callApi, type AdminCookies } from '@/lib/admin/api-forward';
import { isCrossSite } from '@/lib/admin/csrf';
import {
  checkCvFile,
  deleteCv,
  isStorageConfigured,
  StorageUnavailable,
  uploadCv,
} from '@/lib/admin/cv-storage';
import { authorizeAdmin } from '@/lib/admin/route-auth';
import { CONTENT_TAGS } from '@/lib/content-tags';
import { isOneOf } from '@/lib/guards';

// Загрузка резюме. Файл кладёт в Vercel Blob сервер сайта: ключи от
// хранилища есть только у него. API хранит лишь адрес файла
//
// 1. CSRF и права — до всего остального
// 2. Проверка файла: размер и первые байты PDF
// 3. put() в Blob под новым именем
// 4. Адрес — в API. Точно не сохранил — удаляем загруженный файл
// 5. Сбрасываем кэш страниц с профилем, и только потом удаляем старый файл

type RouteParams = RouteContext<'/admin/api/cv/[locale]'>;
type CvState = { ru: string | null; en: string | null };
type CvChange = CvState & { previous: string | null };

const error = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status });

const storageOff = () =>
  error(503, 'storageNotConfigured', 'Хранилище Vercel Blob не подключено');

/**
 * Общая обёртка: проверки и права до работы, а новые cookie сессии —
 * в любом ответе, в том числе с ошибкой. Если по дороге обновился токен,
 * а браузер не получит новую cookie, после льготного окна его прежний
 * токен обновления перестанет работать.
 */
async function withAdmin(
  request: NextRequest,
  params: RouteParams['params'],
  work: (locale: Locale, cookies: AdminCookies) => Promise<Response>,
): Promise<Response> {
  const { locale } = await params;
  if (!isOneOf(LOCALES, locale)) {
    return error(404, 'notFound', 'Нет такого языка');
  }
  if (isCrossSite(request)) {
    return error(403, 'crossSite', 'Запрос с чужого сайта');
  }
  const auth = await authorizeAdmin(request);
  const response = auth.ok
    ? await work(locale, auth.cookies).catch((reason: unknown) => {
        console.error('Ошибка при работе с резюме', reason);
        return error(500, 'failed', 'Не удалось обработать файл');
      })
    : auth.status === 401
      ? error(401, 'unauthorized', 'Нужно войти')
      : error(502, 'failed', 'API недоступен');
  for (const line of auth.setCookies) {
    response.headers.append('set-cookie', line);
  }
  return response;
}

/** Адрес сменился: обновляем страницы, потом убираем старый файл. */
async function finish(change: CvChange): Promise<Response> {
  const { previous, ...current } = change;
  // Сначала кэш: иначе страница, собранная до сброса, ещё вела бы на
  // удалённый файл. Открытые вкладки со старой ссылкой это не спасёт,
  // но после обновления они получат новый файл
  revalidateTag(CONTENT_TAGS.cv, { expire: 0 });
  await deleteCv(previous);
  return Response.json(current);
}

/**
 * API ответил ошибкой или не ответил: сохранил он адрес или нет?
 * 4xx — точно нет. В остальных случаях спрашиваем. Не удалось узнать —
 * файл не трогаем: лишний файл в хранилище лучше битой ссылки на сайте.
 */
async function isSaved(
  status: number | null,
  locale: Locale,
  url: string,
  cookies: AdminCookies,
): Promise<boolean | null> {
  if (status !== null && status >= 400 && status < 500) return false;
  try {
    const check = await callApi('admin/content/cv', {
      method: 'GET',
      cookies,
    });
    if (!check.ok) return null;
    return ((await check.json()) as CvState)[locale] === url;
  } catch {
    return null;
  }
}

export function POST(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, params, async (locale, cookies) => {
    if (!isStorageConfigured()) return storageOff();

    // Без длины тела не начинаем: браузер её всегда присылает, а читать
    // в память поток неизвестного размера незачем
    const length = request.headers.get('content-length');
    if (length === null) {
      return error(411, 'lengthRequired', 'Нужен заголовок Content-Length');
    }
    if (Number(length) > CV_LIMITS.maxBytes + 64 * 1024) {
      return error(413, 'tooLarge', 'Файл больше 4 МБ');
    }

    const form = await request.formData().catch(() => null);
    const file = await checkCvFile(form?.get('file') ?? null);
    if (!file.ok) {
      const messages = {
        missing: 'Выберите файл',
        tooLarge: 'Файл больше 4 МБ',
        notPdf: 'Нужен файл PDF',
      };
      return error(
        file.error === 'tooLarge' ? 413 : 400,
        file.error,
        messages[file.error],
      );
    }

    let url: string;
    try {
      url = await uploadCv(locale, file.file);
    } catch (reason) {
      if (reason instanceof StorageUnavailable) {
        // Ключи есть, а хранилище отказало: чаще всего на Vercel выключена
        // OIDC Federation, и токен не приходит с запросом. Причину — в лог
        console.error('Vercel Blob отказал в доступе:', reason.message);
        return error(
          503,
          'storageAccessDenied',
          'Хранилище Vercel Blob отказало в доступе',
        );
      }
      throw reason;
    }

    let saved: Response | null = null;
    try {
      saved = await callApi(`admin/content/cv/${locale}`, {
        method: 'PUT',
        contentType: 'application/json',
        body: JSON.stringify({ url }),
        cookies,
      });
      if (saved.ok) return await finish((await saved.json()) as CvChange);
    } catch (reason) {
      console.error('API не ответил на сохранение резюме', reason);
    }

    const status = saved?.status ?? null;
    if ((await isSaved(status, locale, url, cookies)) === false) {
      await deleteCv(url);
    }
    return error(status ?? 502, 'apiFailed', 'API не сохранил адрес файла');
  });
}

/** Вернуть на сайт резюме из сборки: адрес в API — null, файл — удалить. */
export function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, params, async (locale, cookies) => {
    const removed = await callApi(`admin/content/cv/${locale}`, {
      method: 'DELETE',
      cookies,
    });
    if (!removed.ok) {
      return error(removed.status, 'apiFailed', 'API не снял адрес файла');
    }
    return finish((await removed.json()) as CvChange);
  });
}
