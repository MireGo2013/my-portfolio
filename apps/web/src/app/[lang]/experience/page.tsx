import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProjectCard } from '@/components/project-card';
import { Reveal } from '@/components/reveal';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getProfile, getProjects } from '@/lib/content';

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
  const dictionary = getDictionary(locale).experience;
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
                <ProjectCard project={project} labels={dictionary} />
              </Reveal>
            ))}
        </ul>
        <a
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
        >
          {dictionary.allProjects}
        </a>
      </div>
    </>
  );
}
