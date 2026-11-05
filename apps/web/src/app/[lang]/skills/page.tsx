import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { StackList } from '@/components/stack-list';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getSkills } from '@/lib/content';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/skills'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, description } = getDictionary(locale).skills;

  return pageMetadata(locale, '/skills', { title, description });
}

export default async function SkillsPage({
  params,
}: PageProps<'/[lang]/skills'>) {
  const locale = await resolveLocale(params);
  const { title, description } = getDictionary(locale).skills;
  const categories = await getSkills(locale);

  return (
    <>
      <PageHeading title={title} description={description} />
      <dl className="flex flex-col">
        {categories.map((category) => (
          <div
            key={category.slug}
            className="grid gap-2 border-t border-line py-5 sm:grid-cols-[14rem_1fr] sm:gap-6"
          >
            <dt className="font-semibold">{category.name}</dt>
            <dd>
              <StackList items={category.skills} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
