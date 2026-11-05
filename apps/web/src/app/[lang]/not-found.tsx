import type { Metadata } from 'next';
import Link from 'next/link';
import { lang } from 'next/root-params';
import { PageHeading } from '@/components/page-heading';
import { FALLBACK_LOCALE, hasLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/server';

// not-found не получает params, поэтому язык читаем через root-params
async function notFoundLocale() {
  const value = await lang();
  return hasLocale(value) ? value : FALLBACK_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await notFoundLocale();
  return { title: getDictionary(locale).notFound.title };
}

export default async function NotFound() {
  const locale = await notFoundLocale();
  const { title, description, home } = getDictionary(locale).notFound;

  return (
    <>
      <PageHeading title={title} description={description} />
      <Link
        href={`/${locale}`}
        className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
      >
        {home}
      </Link>
    </>
  );
}
