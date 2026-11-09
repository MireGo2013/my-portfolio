import type { Metadata } from 'next';
import { PageHeading } from '@/shared/ui/page-heading';
import { ProjectCard } from '@/features/site/projects/project-card';
import { Reveal } from '@/shared/ui/reveal';
import { WorkItem } from '@/features/site/work/work-item';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getWork, getProjects } from '@/shared/content/content';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/projects'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, metaDescription } = getDictionary(locale).projects;

  return pageMetadata(locale, '/projects', {
    title,
    description: metaDescription,
  });
}

export default async function ProjectsPage({
  params,
}: PageProps<'/[lang]/projects'>) {
  const locale = await resolveLocale(params);
  // Раздел «Проекты»: места работы (API /work) и фриланс (API /projects)
  const { projects: dictionary, links } = getDictionary(locale);
  const [work, projects] = await Promise.all([
    getWork(locale),
    getProjects(locale),
  ]);

  return (
    <>
      <PageHeading
        title={dictionary.title}
        description={dictionary.description}
      />
      <div className="flex flex-col gap-14">
        <div className="flex flex-col gap-12">
          {work.map((item, index) => (
            <WorkItem
              key={item.slug}
              item={item}
              labels={dictionary}
              from={index % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
        <section className="flex flex-col gap-6 border-t border-line pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {dictionary.freelance}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects
              .filter((project) => project.kind === 'FREELANCE')
              .map((project, index) => (
                <Reveal
                  key={project.slug}
                  as="li"
                  delay={index * 80}
                  className="h-full"
                >
                  <ProjectCard project={project} labels={links} />
                </Reveal>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}
