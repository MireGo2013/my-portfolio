import type { Metadata } from 'next';
import { ExperienceItem } from '@/components/experience-item';
import { PageHeading } from '@/components/page-heading';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getExperience } from '@/lib/content';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/experience'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, metaDescription } = getDictionary(locale).experience;

  return pageMetadata(locale, '/experience', {
    title,
    description: metaDescription,
  });
}

export default async function ExperiencePage({
  params,
}: PageProps<'/[lang]/experience'>) {
  const locale = await resolveLocale(params);
  const dictionary = getDictionary(locale).experience;
  const experience = await getExperience(locale);

  return (
    <>
      <PageHeading
        title={dictionary.title}
        description={dictionary.description}
      />
      <div className="flex flex-col gap-12">
        {experience.map((item) => (
          <ExperienceItem
            key={item.slug}
            item={item}
            presentLabel={dictionary.present}
          />
        ))}
      </div>
    </>
  );
}
