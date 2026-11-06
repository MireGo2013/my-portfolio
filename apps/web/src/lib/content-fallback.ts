import { PROJECT_KINDS, type Locale } from '@portfolio/shared';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import type {
  Experience,
  Profile,
  Project,
  SkillCategory,
} from './api/content-api';
import rawSnapshot from './content-snapshot.json';
import { isOneOf } from './guards';

/**
 * Резервный снимок контента — копия ответов API, сделанная командой
 * `pnpm content:snapshot`. Тип задан явно: если API поменяет форму ответа,
 * а снимок не обновят, сборка упадёт на проверке типов, а не на проде.
 */
type ContentSnapshot = {
  generatedAt: string;
  profile: Record<Locale, Profile>;
  experience: Record<Locale, Experience[]>;
  projects: Record<Locale, Project[]>;
  skills: Record<Locale, SkillCategory[]>;
};

/**
 * JSON при импорте теряет перечисления: kind становится просто string.
 * Сужаем только его и с проверкой, а остальные поля TypeScript сверяет
 * с типами API как есть.
 */
function narrowProjects(
  projects: (typeof rawSnapshot)['projects'][Locale],
): Project[] {
  return projects.map((project) => {
    if (!isOneOf(PROJECT_KINDS, project.kind)) {
      throw new Error(`В снимке неизвестный тип проекта: ${project.kind}`);
    }
    return { ...project, kind: project.kind };
  });
}

export const snapshot: ContentSnapshot = {
  ...rawSnapshot,
  projects: {
    ru: narrowProjects(rawSnapshot.projects.ru),
    en: narrowProjects(rawSnapshot.projects.en),
  },
};

type Section = Exclude<keyof ContentSnapshot, 'generatedAt'>;

/**
 * Данные из API, а если он не ответил при сборке — из снимка.
 *
 * Только при сборке. Во время работы сайта ошибка должна дойти до Next.js:
 * тогда он оставит в кэше последнюю удачную версию страницы, а она новее
 * снимка — снимок затёр бы правки, сделанные в админке после него.
 * При сборке кэша ещё нет, и без снимка выкладка просто упала бы.
 */
export async function withSnapshot<S extends Section>(
  section: S,
  locale: Locale,
  load: () => Promise<ContentSnapshot[S][Locale]>,
): Promise<ContentSnapshot[S][Locale]> {
  try {
    return await load();
  } catch (error) {
    if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) throw error;
    console.warn(
      `API не ответил при сборке (${section}, ${locale}): берём снимок от ${snapshot.generatedAt}.`,
      error instanceof Error ? error.message : error,
    );
    return snapshot[section][locale];
  }
}
