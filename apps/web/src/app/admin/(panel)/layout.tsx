import Link from 'next/link';
import { Suspense } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminProviders } from '@/components/admin/admin-providers';
import { LogoutButton } from '@/components/admin/logout-button';
import { requireAdmin } from '@/lib/admin/session';

/**
 * Проверка сессии читает cookie, то есть зависит от запроса. С Cache Components
 * такое должно быть внутри Suspense: оболочка страницы отдаётся сразу,
 * а содержимое догружается после ответа API.
 */
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Проверяем вход…</p>}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}

async function Panel({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <AdminProviders>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:gap-10">
        <aside className="flex flex-col gap-6 md:w-48 md:shrink-0">
          <Link href="/admin" className="font-mono text-sm text-accent">
            admin
          </Link>
          <AdminNav />
          <div className="flex flex-col items-start gap-2 text-sm text-muted md:mt-auto">
            <span className="break-all">{user.email}</span>
            <LogoutButton />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AdminProviders>
  );
}
