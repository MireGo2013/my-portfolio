import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ru';
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
  const items = [
    { href: `/${locale}`, label: nav.about },
    { href: `/${locale}/work`, label: nav.work },
    { href: `/${locale}/experience`, label: nav.experience },
    { href: `/${locale}/skills`, label: nav.skills },
    { href: `/${locale}/contact`, label: nav.contact },
  ];

  return (
    <header className="z-20 border-b border-line bg-paper/90 backdrop-blur-sm md:sticky md:top-0">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-5">
        <Link
          href={`/${locale}`}
          aria-label={name}
          className="block transition-transform hover:scale-105"
        >
          <Monogram fullName={name} className="size-11 text-sm" />
        </Link>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <nav aria-label={nav.label}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} />
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher current={locale} label={language.label} />
        </div>
      </div>
    </header>
  );
}
