import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProjectCard } from '@/components/project-card';
import { WorkItem } from '@/components/work-item';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getExperience, getProjects } from '@/lib/content';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/work'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, metaDescription } = getDictionary(locale).work;

  return pageMetadata(locale, '/work', {
    title,
    description: metaDescription,
  });
}

export default async function WorkPage({ params }: PageProps<'/[lang]/work'>) {
  const locale = await resolveLocale(params);
  const { work, experience: projectLabels } = getDictionary(locale);
  const [experience, projects] = await Promise.all([
    getExperience(locale),
    getProjects(locale),
  ]);

  return (
    <>
      <PageHeading title={work.title} description={work.description} />
      <div className="flex flex-col gap-14">
        <div className="flex flex-col gap-12">
          {experience.map((item) => (
            <WorkItem key={item.slug} item={item} labels={work} />
          ))}
        </div>
        <section className="flex flex-col gap-6 border-t border-line pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {work.freelance}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects
              .filter((project) => project.kind === 'FREELANCE')
              .map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} labels={projectLabels} />
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}
