import type { Project } from '@/lib/api/content-api';
import { StackList } from './stack-list';

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
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
