import type { Experience } from '@/lib/api/content-api';
import { formatPeriod } from '@/lib/format-period';
import { StackList } from './stack-list';

export function ExperienceItem({
  item,
  presentLabel,
}: {
  item: Experience;
  presentLabel: string;
}) {
  return (
    <article className="flex flex-col gap-4 border-t border-line pt-8">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-sm text-muted">
          {formatPeriod(item.startDate, item.endDate, presentLabel)}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {item.project}
        </h2>
        <p className="text-accent">
          {item.company ? `${item.role}, ${item.company}` : item.role}
        </p>
      </header>

      <p className="max-w-2xl leading-relaxed text-pretty">{item.summary}</p>

      {item.highlights.length > 0 && (
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5 leading-relaxed marker:text-accent">
          {item.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}

      <StackList items={item.stack} />
    </article>
  );
}
