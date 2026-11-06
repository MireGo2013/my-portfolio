export const ADMIN_HOME = '/admin';
export const ADMIN_LOGIN = '/admin/login';
export const ADMIN_MESSAGES = '/admin/messages';
export const ADMIN_API_BASE = '/admin/api/';

/** Через этот заголовок proxy сообщает layout адрес открытой страницы. */
export const ADMIN_PATH_HEADER = 'x-admin-path';

/** Обновление токена для серверных компонентов, которые не умеют ставить cookie. */
export const ADMIN_SESSION_REFRESH = '/admin/api/session/refresh';

/** Разделы меню. В API коммерческие проекты лежат в /experience, а открытые в /projects. */
export const ADMIN_SECTIONS = [
  { href: ADMIN_MESSAGES, label: 'Сообщения' },
  { href: '/admin/profile', label: 'Профиль' },
  { href: '/admin/projects', label: 'Проекты' },
  { href: '/admin/experience', label: 'Опыт' },
  { href: '/admin/skills', label: 'Стек' },
  { href: '/admin/cv', label: 'Резюме' },
  { href: '/admin/security', label: 'Безопасность' },
] as const;

export const ADMIN_START = ADMIN_SECTIONS[0].href;

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
}

/**
 * Куда вернуть после входа. Принимаем только страницы админки: иначе ссылка
 * /admin/login?next=https://evil.example увела бы на чужой сайт (open redirect).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return ADMIN_START;
  try {
    const base = 'http://admin.invalid';
    const url = new URL(next, base);
    if (
      url.origin === base &&
      isAdminPath(url.pathname) &&
      url.pathname !== ADMIN_LOGIN &&
      !url.pathname.startsWith(ADMIN_API_BASE)
    ) {
      return url.pathname + url.search;
    }
  } catch {
    // Некорректный адрес: просто ведём в начало админки
  }
  return ADMIN_START;
}

/**
 * Где в админке редактируется раздел API. Названия в меню идут от сайта:
 * коммерческие проекты (API /experience) — «Проекты», GitHub и фриланс
 * (API /projects) — «Опыт».
 */
export const CONTENT_PATHS = {
  experience: '/admin/projects',
  projects: '/admin/experience',
  skills: '/admin/skills',
} as const;

/** Адрес входа с возвратом на страницу next. Один на всю админку. */
export function loginPath(next?: string): string {
  return next ? `${ADMIN_LOGIN}?${new URLSearchParams({ next })}` : ADMIN_LOGIN;
}
