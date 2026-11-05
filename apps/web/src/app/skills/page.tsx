import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { StackList } from '@/components/stack-list';
import { getSkills } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Стек',
  description: 'Технологии, с которыми я работаю, по областям.',
};

export default async function SkillsPage() {
  const categories = await getSkills();

  return (
    <>
      <PageHeading
        title="Стек"
        description="Технологии, с которыми я работаю, по областям."
      />
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
