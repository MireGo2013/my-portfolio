import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProjectCard } from '@/components/project-card';
import type { Project } from '@/lib/api/content-api';
import { getProjects } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Проекты',
  description: 'Открытые проекты с кодом на GitHub и работы на фрилансе.',
};

function ProjectSection({
  title,
  projects,
}: {
  title: string;
  projects: Project[];
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHeading
        title="Проекты"
        description="Открытые проекты с кодом на GitHub и работы на фрилансе."
      />
      <div className="flex flex-col gap-14">
        <ProjectSection
          title="Открытые проекты"
          projects={projects.filter((p) => p.kind === 'OPEN_SOURCE')}
        />
        <ProjectSection
          title="Фриланс"
          projects={projects.filter((p) => p.kind === 'FREELANCE')}
        />
      </div>
    </>
  );
}
