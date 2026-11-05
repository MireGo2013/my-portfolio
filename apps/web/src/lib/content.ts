import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { createContentApi, type Profile } from './api/content-api';

function contentApi() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('Не задан API_URL');
  }
  return createContentApi(apiUrl);
}

/** Результат попадает в статический HTML страницы, обновление описано в next.config.ts. */
export async function getProfile(): Promise<Profile> {
  'use cache';
  cacheLife('content');
  cacheTag('profile'); // для точечного обновления из админки в v2

  return contentApi().getProfile();
}
