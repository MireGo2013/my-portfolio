'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_SECTIONS } from '@/lib/admin/paths';

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Разделы админки">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {ADMIN_SECTIONS.map(({ href, label }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className="block rounded-sm px-3 py-2 text-muted transition-colors hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
