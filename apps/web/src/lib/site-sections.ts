import { isOneOf } from './guards';

/**
 * Разделы сайта в порядке меню. По этому списку строится меню в шапке, а proxy
 * отличает существующие адреса от несуществующих: новый раздел добавляем сюда.
 */
export const SITE_SECTIONS = [
  { path: '', label: 'about' },
  { path: '/projects', label: 'projects' },
  { path: '/skills', label: 'skills' },
  { path: '/experience', label: 'experience' },
  { path: '/contact', label: 'contact' },
] as const;

const SITE_PATHS = SITE_SECTIONS.map((section) => section.path);

/** Адрес без языка: '' (главная), '/skills' и так далее. */
export function isSitePath(path: string): boolean {
  return isOneOf(SITE_PATHS, path);
}

/** Страница 404. Proxy показывает её на любой несуществующий адрес. */
export const NOT_FOUND_PATH = '/page-not-found';
