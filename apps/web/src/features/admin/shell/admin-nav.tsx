'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  fetchMessageCounts,
  messageKeys,
} from '@/features/admin/messages/messages-api';
import { ADMIN_MESSAGES, ADMIN_SECTIONS } from '@/features/admin/shell/paths';

export function AdminNav() {
  const pathname = usePathname();
  const counts = useQuery({
    queryKey: messageKeys.counts(),
    queryFn: ({ signal }) => fetchMessageCounts(signal),
    // Новые сообщения приходят сами, пока админка открыта
    refetchInterval: 60_000,
  });
  const newCount = counts.data?.NEW ?? 0;

  return (
    <nav aria-label="Разделы админки">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {ADMIN_SECTIONS.map(({ href, label }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === ADMIN_MESSAGES && newCount > 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className="flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-muted transition-colors hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink"
              >
                {label}
                {badge && (
                  <span
                    className="rounded-full bg-accent px-2 text-xs leading-5 font-medium text-on-accent"
                    aria-label={`новых: ${newCount}`}
                  >
                    {newCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
