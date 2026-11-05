import Link from 'next/link';
import { NavLink } from './nav-link';

const NAV_ITEMS = [
  { href: '/experience', label: 'Опыт' },
  { href: '/projects', label: 'Проекты' },
  { href: '/skills', label: 'Стек' },
  { href: '/contact', label: 'Контакты' },
];

export function SiteHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-5">
        <Link
          href="/"
          className="font-semibold transition-colors hover:text-accent"
        >
          {name}
        </Link>
        <nav aria-label="Основная навигация">
          <ul className="flex gap-6 font-mono text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink {...item} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
