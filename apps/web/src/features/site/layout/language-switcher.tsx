'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
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
  const router = useRouter();

  const switchTo = (event: MouseEvent<HTMLAnchorElement>, locale: Locale) => {
    rememberLocale(locale);
    // Новая вкладка и прочие клики с модификаторами работают как обычная ссылка
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    // Параметры адреса (например, utm-метки) и якорь не должны теряться
    event.preventDefault();
    const { search, hash } = window.location;
    router.push(`${switchLocalePath(pathname, locale)}${search}${hash}`);
  };

  return (
    <ul aria-label={label} className="flex gap-2 font-mono text-sm uppercase">
      {LOCALES.map((locale) => (
        <li key={locale}>
          <Link
            href={switchLocalePath(pathname, locale)}
            hrefLang={locale}
            aria-current={locale === current ? 'true' : undefined}
            onClick={(event) => {
              switchTo(event, locale);
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
