import 'server-only';
import type { Locale } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import {
  createContentApi,
  type Experience,
  type Profile,
  type Project,
  type SkillCategory,
} from './api/content-api';
import { CONTENT_TAGS } from './content-tags';

function contentApi() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('Не задан API_URL');
  }
  return createContentApi(apiUrl);
}

// Результаты попадают в статический HTML страниц. Профиль кэша content описан
// в next.config.ts, а метки сбрасывает прокси админки после сохранения.
// Аргумент locale входит в ключ кэша, поэтому у каждого языка своя запись.

export async function getProfile(locale: Locale): Promise<Profile> {
  'use cache';
  cacheLife('content');
  cacheTag(CONTENT_TAGS.profile);

  return contentApi().getProfile(locale);
}

export async function getExperience(locale: Locale): Promise<Experience[]> {
  'use cache';
  cacheLife('content');
  cacheTag(CONTENT_TAGS.experience);

  return contentApi().getExperience(locale);
}

export async function getProjects(locale: Locale): Promise<Project[]> {
  'use cache';
  cacheLife('content');
  cacheTag(CONTENT_TAGS.projects);

  return contentApi().getProjects(locale);
}

export async function getSkills(locale: Locale): Promise<SkillCategory[]> {
  'use cache';
  cacheLife('content');
  cacheTag(CONTENT_TAGS.skills);

  return contentApi().getSkills(locale);
}
