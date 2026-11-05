'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LOCALE_COOKIE,
  LOCALES,
  switchLocalePath,
  type Locale,
} from '@/i18n/config';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

/** Клиентский компонент ради usePathname: переключение остаётся на той же странице. */
export function LanguageSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <ul aria-label={label} className="flex gap-2 font-mono text-sm uppercase">
      {LOCALES.map((locale) => (
        <li key={locale}>
          <Link
            href={switchLocalePath(pathname, locale)}
            hrefLang={locale}
            aria-current={locale === current ? 'true' : undefined}
            onClick={() => {
              rememberLocale(locale);
            }}
            className="text-muted transition-colors hover:text-accent aria-[current=true]:text-accent"
          >
            {locale}
          </Link>
        </li>
      ))}
    </ul>
  );
}
