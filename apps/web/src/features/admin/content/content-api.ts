import type {
  WorkData,
  ProfileData,
  ProjectData,
  SkillCategoryData,
} from '@portfolio/shared';
import type { components } from '@/shared/api/schema';
import {
  adminClient,
  unwrap,
  unwrapEmpty,
} from '@/features/admin/shell/admin-client';

export type AdminProfile = components['schemas']['AdminProfileDto'];
export type AdminWork = components['schemas']['AdminWorkDto'];
export type AdminProject = components['schemas']['AdminProjectDto'];
export type AdminSkillCategory = components['schemas']['AdminSkillCategoryDto'];

export const contentKeys = {
  all: ['admin', 'content'] as const,
  profile: () => [...contentKeys.all, 'profile'] as const,
  list: (section: ListSection) =>
    [...contentKeys.all, section, 'list'] as const,
  item: (section: ListSection, id: string) =>
    [...contentKeys.all, section, 'item', id] as const,
};

// ---------- Профиль ----------

export async function fetchProfile(signal?: AbortSignal) {
  return unwrap(
    await adminClient().GET('/api/v1/admin/content/profile', { signal }),
  );
}

export async function saveProfile(body: ProfileData) {
  return unwrap(
    await adminClient().PUT('/api/v1/admin/content/profile', { body }),
  );
}

// ---------- Разделы со списком записей ----------

/**
 * Одинаковый набор операций для трёх разделов. Пути разные, поэтому каждая
 * операция расписана явно: так openapi-fetch проверяет и путь, и тело.
 */
export const sections = {
  work: {
    list: async (signal?: AbortSignal): Promise<AdminWork[]> =>
      unwrap(await adminClient().GET('/api/v1/admin/content/work', { signal })),
    get: async (id: string, signal?: AbortSignal): Promise<AdminWork> =>
      unwrap(
        await adminClient().GET('/api/v1/admin/content/work/{id}', {
          params: { path: { id } },
          signal,
        }),
      ),
    create: async (body: WorkData): Promise<AdminWork> =>
      unwrap(await adminClient().POST('/api/v1/admin/content/work', { body })),
    update: async (id: string, body: WorkData): Promise<AdminWork> =>
      unwrap(
        await adminClient().PUT('/api/v1/admin/content/work/{id}', {
          params: { path: { id } },
          body,
        }),
      ),
    remove: async (id: string): Promise<void> =>
      unwrapEmpty(
        await adminClient().DELETE('/api/v1/admin/content/work/{id}', {
          params: { path: { id } },
        }),
      ),
    reorder: async (ids: string[]): Promise<AdminWork[]> =>
      unwrap(
        await adminClient().PUT('/api/v1/admin/content/work/order', {
          body: { ids },
        }),
      ),
  },
  projects: {
    list: async (signal?: AbortSignal): Promise<AdminProject[]> =>
      unwrap(
        await adminClient().GET('/api/v1/admin/content/projects', { signal }),
      ),
    get: async (id: string, signal?: AbortSignal): Promise<AdminProject> =>
      unwrap(
        await adminClient().GET('/api/v1/admin/content/projects/{id}', {
          params: { path: { id } },
          signal,
        }),
      ),
    create: async (body: ProjectData): Promise<AdminProject> =>
      unwrap(
        await adminClient().POST('/api/v1/admin/content/projects', { body }),
      ),
    update: async (id: string, body: ProjectData): Promise<AdminProject> =>
      unwrap(
        await adminClient().PUT('/api/v1/admin/content/projects/{id}', {
          params: { path: { id } },
          body,
        }),
      ),
    remove: async (id: string): Promise<void> =>
      unwrapEmpty(
        await adminClient().DELETE('/api/v1/admin/content/projects/{id}', {
          params: { path: { id } },
        }),
      ),
    reorder: async (ids: string[]): Promise<AdminProject[]> =>
      unwrap(
        await adminClient().PUT('/api/v1/admin/content/projects/order', {
          body: { ids },
        }),
      ),
  },
  skills: {
    list: async (signal?: AbortSignal): Promise<AdminSkillCategory[]> =>
      unwrap(
        await adminClient().GET('/api/v1/admin/content/skills', { signal }),
      ),
    get: async (
      id: string,
      signal?: AbortSignal,
    ): Promise<AdminSkillCategory> =>
      unwrap(
        await adminClient().GET('/api/v1/admin/content/skills/{id}', {
          params: { path: { id } },
          signal,
        }),
      ),
    create: async (body: SkillCategoryData): Promise<AdminSkillCategory> =>
      unwrap(
        await adminClient().POST('/api/v1/admin/content/skills', { body }),
      ),
    update: async (
      id: string,
      body: SkillCategoryData,
    ): Promise<AdminSkillCategory> =>
      unwrap(
        await adminClient().PUT('/api/v1/admin/content/skills/{id}', {
          params: { path: { id } },
          body,
        }),
      ),
    remove: async (id: string): Promise<void> =>
      unwrapEmpty(
        await adminClient().DELETE('/api/v1/admin/content/skills/{id}', {
          params: { path: { id } },
        }),
      ),
    reorder: async (ids: string[]): Promise<AdminSkillCategory[]> =>
      unwrap(
        await adminClient().PUT('/api/v1/admin/content/skills/order', {
          body: { ids },
        }),
      ),
  },
};

export type ListSection = keyof typeof sections;
