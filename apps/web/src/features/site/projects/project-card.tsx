import type { Project } from '@/shared/content/content-api';
import { StackList } from '@/features/site/skills/stack-list';
import { TEXT_LINK_CLASS } from '@/shared/utils/styles';

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={TEXT_LINK_CLASS}
    >
      {label}
    </a>
  );
}

export function ProjectCard({
  project,
  labels,
}: {
  project: Project;
  labels: { code: string; site: string };
}) {
  return (
    <article className="card-tilt flex h-full flex-col gap-3 rounded-sm border border-line bg-surface p-5">
      <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
      <p className="flex-1 leading-relaxed text-pretty text-muted">
        {project.description}
      </p>
      <StackList items={project.stack} />
      <div className="flex gap-4 pt-1">
        {project.repoUrl && (
          <ExternalLink href={project.repoUrl} label={labels.code} />
        )}
        {project.liveUrl && (
          <ExternalLink href={project.liveUrl} label={labels.site} />
        )}
      </div>
    </article>
  );
}
