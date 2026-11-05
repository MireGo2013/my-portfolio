import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading } from '@/components/page-heading';

export const metadata: Metadata = {
  title: 'Страница не найдена',
};

export default function NotFound() {
  return (
    <>
      <PageHeading
        title="Страница не найдена"
        description="Возможно, адрес изменился или в нём опечатка."
      />
      <Link
        href="/"
        className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
      >
        На главную
      </Link>
    </>
  );
}
