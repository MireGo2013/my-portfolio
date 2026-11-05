import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import {
  createContentApi,
  type Experience,
  type Profile,
  type Project,
  type SkillCategory,
} from './api/content-api';

function contentApi() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('Не задан API_URL');
  }
  return createContentApi(apiUrl);
}

// Результаты попадают в статический HTML страниц. Профиль кэша content описан
// в next.config.ts, а теги нужны для точечного обновления из админки в v2.

export async function getProfile(): Promise<Profile> {
  'use cache';
  cacheLife('content');
  cacheTag('profile');

  return contentApi().getProfile();
}

export async function getExperience(): Promise<Experience[]> {
  'use cache';
  cacheLife('content');
  cacheTag('experience');

  return contentApi().getExperience();
}

export async function getProjects(): Promise<Project[]> {
  'use cache';
  cacheLife('content');
  cacheTag('projects');

  return contentApi().getProjects();
}

export async function getSkills(): Promise<SkillCategory[]> {
  'use cache';
  cacheLife('content');
  cacheTag('skills');

  return contentApi().getSkills();
}
