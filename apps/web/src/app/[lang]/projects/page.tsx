import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProjectCard } from '@/components/project-card';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import type { Project } from '@/lib/api/content-api';
import { getProjects } from '@/lib/content';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/projects'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, description } = getDictionary(locale).projects;

  return pageMetadata(locale, '/projects', { title, description });
}

function ProjectSection({
  title,
  projects,
  labels,
}: {
  title: string;
  projects: Project[];
  labels: { code: string; site: string };
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} labels={labels} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProjectsPage({
  params,
}: PageProps<'/[lang]/projects'>) {
  const locale = await resolveLocale(params);
  const dictionary = getDictionary(locale).projects;
  const projects = await getProjects(locale);

  return (
    <>
      <PageHeading
        title={dictionary.title}
        description={dictionary.description}
      />
      <div className="flex flex-col gap-14">
        <ProjectSection
          title={dictionary.openSource}
          projects={projects.filter((p) => p.kind === 'OPEN_SOURCE')}
          labels={dictionary}
        />
        <ProjectSection
          title={dictionary.freelance}
          projects={projects.filter((p) => p.kind === 'FREELANCE')}
          labels={dictionary}
        />
      </div>
    </>
  );
}
