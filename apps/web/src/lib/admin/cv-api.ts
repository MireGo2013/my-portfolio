import type { Locale } from '@portfolio/shared';
import type { components } from '../api/schema';
import { adminClient, ApiError, unwrap } from './admin-client';
import { contentKeys } from './content-api';

export type AdminCv = components['schemas']['AdminCvDto'];

export const cvKey = () => [...contentKeys.all, 'cv'] as const;

/** Коды ошибок загрузки из маршрута /admin/api/cv/[locale]. */
export type CvUploadError =
  | 'missing'
  | 'tooLarge'
  | 'notPdf'
  | 'storageNotConfigured'
  | 'storageAccessDenied'
  | 'failed';

export class CvUploadFailed extends ApiError {
  constructor(
    status: number,
    readonly code: CvUploadError,
  ) {
    super(status);
  }
}

export async function fetchCv(signal?: AbortSignal): Promise<AdminCv> {
  return unwrap(
    await adminClient().GET('/api/v1/admin/content/cv', { signal }),
  );
}

const KNOWN: CvUploadError[] = [
  'missing',
  'tooLarge',
  'notPdf',
  'storageNotConfigured',
  'storageAccessDenied',
];

async function cvRequest(locale: Locale, init: RequestInit): Promise<AdminCv> {
  // Не через openapi-fetch: этот маршрут живёт в самом сайте, а не в API
  const response = await fetch(
    `${window.location.origin}/admin/api/cv/${locale}`,
    init,
  );
  if (response.ok) return (await response.json()) as AdminCv;
  const body = (await response.json().catch(() => ({}))) as { code?: string };
  const code = KNOWN.find((known) => known === body.code) ?? 'failed';
  throw new CvUploadFailed(response.status, code);
}

export function uploadCvFile(locale: Locale, file: File): Promise<AdminCv> {
  const form = new FormData();
  form.set('file', file);
  return cvRequest(locale, { method: 'POST', body: form });
}

export function removeCvFile(locale: Locale): Promise<AdminCv> {
  return cvRequest(locale, { method: 'DELETE' });
}
