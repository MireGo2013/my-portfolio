'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Клиентский компонент только ради usePathname: текущий адрес знает браузер. */
export function NavLink({ href, label }: { href: string; label: string }) {
  const isActive = usePathname() === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className="text-muted transition-colors hover:text-accent aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:underline-offset-8"
    >
      {label}
    </Link>
  );
}
