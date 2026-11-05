import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading } from '@/components/page-heading';
import { getDictionary, resolveLocale } from '@/i18n/server';
import { TEXT_LINK_CLASS } from '@/lib/styles';

// Обычная страница, поэтому сервер присылает её с готовой разметкой. Статус 404
// ставит proxy, который показывает её вместо несуществующего адреса

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/page-not-found'>): Promise<Metadata> {
  const locale = await resolveLocale(params);

  return {
    title: getDictionary(locale).notFound.title,
    // Не наследуем canonical и hreflang главной и не попадаем в поиск
    alternates: {},
    robots: { index: false },
  };
}

export default async function NotFoundPage({
  params,
}: PageProps<'/[lang]/page-not-found'>) {
  const locale = await resolveLocale(params);
  const { title, description, home } = getDictionary(locale).notFound;

  return (
    <>
      <PageHeading title={title} description={description} />
      <Link href={`/${locale}`} className={TEXT_LINK_CLASS}>
        {home}
      </Link>
    </>
  );
}
