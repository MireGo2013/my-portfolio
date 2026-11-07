import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { SITE_SECTIONS } from '@/lib/site-sections';
import { LanguageSwitcher } from './language-switcher';
import { Monogram } from './monogram';
import { NavLink } from './nav-link';

export function SiteHeader({
  name,
  locale,
  dictionary,
}: {
  name: string;
  locale: Locale;
  dictionary: Pick<Dictionary, 'nav' | 'language'>;
}) {
  const { nav, language } = dictionary;
  const items = SITE_SECTIONS.map((section) => ({
    href: `/${locale}${section.path}`,
    label: nav[section.label],
  }));

  return (
    <header className="z-20 border-b border-line bg-paper/90 backdrop-blur-sm md:sticky md:top-0">
      {/* Телефон: сетка в две строки — монограмма и языки сверху, разделы
          во всю ширину снизу. Порядок в разметке тот же, что на ПК, поэтому
          переход по Tab не меняется: место задают row-start и col-start */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[auto_auto] items-center justify-between gap-y-4 px-6 py-4 md:flex md:gap-x-8 md:py-5">
        <Link
          href={`/${locale}`}
          aria-label={name}
          className="block transition-transform hover:scale-105"
        >
          <Monogram fullName={name} className="size-11 text-sm" />
        </Link>
        <nav
          aria-label={nav.label}
          className="col-span-2 row-start-2 md:ml-auto"
        >
          <ul className="flex flex-wrap justify-between gap-x-3 gap-y-2 font-mono text-xs min-[380px]:text-[13px] md:justify-start md:gap-x-6 md:text-sm">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink {...item} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-start-2 row-start-1 justify-self-end">
          <LanguageSwitcher current={locale} label={language.label} />
        </div>
      </div>
    </header>
  );
}
