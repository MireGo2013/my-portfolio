import type { Metadata } from 'next';
import { PageHeading } from '@/shared/ui/page-heading';
import { ProjectCard } from '@/features/site/projects/project-card';
import { Reveal } from '@/shared/ui/reveal';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getProfile, getProjects } from '@/shared/content/content';
import { TEXT_LINK_CLASS } from '@/shared/utils/styles';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/experience'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, description } = getDictionary(locale).experience;

  return pageMetadata(locale, '/experience', { title, description });
}

export default async function ExperiencePage({
  params,
}: PageProps<'/[lang]/experience'>) {
  const locale = await resolveLocale(params);
  // Раздел «Опыт» показывает открытые проекты: в API это эндпоинт /projects
  const { experience: dictionary, links } = getDictionary(locale);
  const [projects, profile] = await Promise.all([
    getProjects(locale),
    getProfile(locale),
  ]);

  return (
    <>
      <PageHeading
        title={dictionary.title}
        description={dictionary.description}
      />
      <div className="flex flex-col gap-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects
            .filter((project) => project.kind === 'OPEN_SOURCE')
            .map((project, index) => (
              <Reveal
                key={project.slug}
                as="li"
                delay={(index % 2) * 120}
                className="h-full"
              >
                <ProjectCard project={project} labels={links} />
              </Reveal>
            ))}
        </ul>
        <a
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`self-start ${TEXT_LINK_CLASS}`}
        >
          {dictionary.allProjects}
        </a>
      </div>
    </>
  );
}
