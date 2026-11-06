import { CV_LIMITS, LOCALES } from '@portfolio/shared';
import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { callApi } from '@/lib/admin/api-forward';
import { isCrossSite } from '@/lib/admin/csrf';
import {
  checkCvFile,
  deleteCv,
  isStorageConfigured,
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
// 4. Адрес — в API. Не вышло — удаляем загруженный файл, чтобы не осиротел
// 5. Старый файл удаляем, страницы с профилем обновляем

type RouteParams = RouteContext<'/admin/api/cv/[locale]'>;

const error = (status: number, code: string, message: string) =>
  Response.json({ code, message }, { status });

/** Ответ с новыми cookie сессии, если по дороге обновился токен. */
function withCookies(response: Response, setCookies: string[]): Response {
  for (const line of setCookies) response.headers.append('set-cookie', line);
  return response;
}

async function guard(request: NextRequest, params: RouteParams['params']) {
  const { locale } = await params;
  if (!isOneOf(LOCALES, locale)) {
    return {
      ok: false as const,
      response: error(404, 'notFound', 'Нет такого языка'),
    };
  }
  if (isCrossSite(request)) {
    return {
      ok: false as const,
      response: error(403, 'crossSite', 'Запрос с чужого сайта'),
    };
  }
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return {
      ok: false as const,
      response: error(401, 'unauthorized', 'Нужно войти'),
    };
  }
  return { ok: true as const, locale, auth };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  const checked = await guard(request, params);
  if (!checked.ok) return checked.response;
  const { locale, auth } = checked;

  if (!isStorageConfigured()) {
    return error(
      503,
      'storageNotConfigured',
      'Хранилище Vercel Blob не подключено',
    );
  }
  // Заранее, по заголовку: не читать в память заведомо огромное тело
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > CV_LIMITS.maxBytes + 64 * 1024) {
    return error(413, 'tooLarge', 'Файл больше 4 МБ');
  }

  const file = await checkCvFile((await request.formData()).get('file'));
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

  const url = await uploadCv(locale, file.file);
  const saved = await callApi(`admin/content/cv/${locale}`, {
    method: 'PUT',
    contentType: 'application/json',
    body: JSON.stringify({ url }),
    cookies: auth.cookies,
  });
  if (!saved.ok) {
    await deleteCv(url);
    return error(saved.status, 'apiFailed', 'API не сохранил адрес файла');
  }

  const { previous, ...current } = (await saved.json()) as {
    ru: string | null;
    en: string | null;
    previous: string | null;
  };
  await deleteCv(previous);
  revalidateTag(CONTENT_TAGS.cv, { expire: 0 });
  return withCookies(Response.json(current), auth.setCookies);
}

/** Вернуть на сайт резюме из сборки: адрес в API — null, файл — удалить. */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  const checked = await guard(request, params);
  if (!checked.ok) return checked.response;
  const { locale, auth } = checked;

  const removed = await callApi(`admin/content/cv/${locale}`, {
    method: 'DELETE',
    cookies: auth.cookies,
  });
  if (!removed.ok) {
    return error(removed.status, 'apiFailed', 'API не снял адрес файла');
  }
  const { previous, ...current } = (await removed.json()) as {
    ru: string | null;
    en: string | null;
    previous: string | null;
  };
  await deleteCv(previous);
  revalidateTag(CONTENT_TAGS.cv, { expire: 0 });
  return withCookies(Response.json(current), auth.setCookies);
}
