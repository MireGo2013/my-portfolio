import type { Metadata } from 'next';
import { ExperienceItem } from '@/components/experience-item';
import { PageHeading } from '@/components/page-heading';
import { getExperience } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Опыт',
  description: 'Коммерческие проекты: задачи, достижения и стек.',
};

export default async function ExperiencePage() {
  const experience = await getExperience();

  return (
    <>
      <PageHeading
        title="Опыт"
        description="Коммерческие проекты под NDA: без кода и скриншотов, зато с задачами и результатами."
      />
      <div className="flex flex-col gap-12">
        {experience.map((item) => (
          <ExperienceItem key={item.slug} item={item} />
        ))}
      </div>
    </>
  );
}
