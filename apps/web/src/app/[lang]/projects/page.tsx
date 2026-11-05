import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProjectCard } from '@/components/project-card';
import { Reveal } from '@/components/reveal';
import { WorkItem } from '@/components/work-item';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getExperience, getProjects } from '@/lib/content';

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
  // Раздел «Проекты» показывает коммерческий опыт: в API это эндпоинт /experience
  const { projects: work, links } = getDictionary(locale);
  const [experience, projects] = await Promise.all([
    getExperience(locale),
    getProjects(locale),
  ]);

  return (
    <>
      <PageHeading title={work.title} description={work.description} />
      <div className="flex flex-col gap-14">
        <div className="flex flex-col gap-12">
          {experience.map((item, index) => (
            <WorkItem
              key={item.slug}
              item={item}
              labels={work}
              from={index % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
        <section className="flex flex-col gap-6 border-t border-line pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {work.freelance}
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
