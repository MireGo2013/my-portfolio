import 'server-only';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, LOCALES, type Locale } from './config';
import { en } from './dictionaries/en';
import { ru, type Dictionary } from './dictionaries/ru';

const dictionaries: Record<Locale, Dictionary> = { ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Язык из адреса. Неизвестное значение означает несуществующую страницу. */
export async function resolveLocale(
  params: Promise<{ lang: string }>,
): Promise<Locale> {
  const { lang } = await params;
  if (!hasLocale(lang)) {
    notFound();
  }
  return lang;
}

/** Заголовок страницы и ссылки на её версии для поисковиков. */
export function pageMetadata(
  locale: Locale,
  path: string,
  metadata: { title: string; description: string },
): Metadata {
  return {
    ...metadata,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(
        LOCALES.map((item) => [item, `/${item}${path}`]),
      ),
    },
  };
}
