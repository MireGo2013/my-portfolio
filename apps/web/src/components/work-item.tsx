import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Experience } from '@/lib/api/content-api';
import { formatPeriod } from '@/lib/format-period';
import { StackList } from './stack-list';

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-semibold">{title}</h3>
      <ul className="flex max-w-3xl list-disc flex-col gap-2 pl-5 leading-relaxed text-pretty text-muted marker:text-accent">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function WorkItem({
  item,
  labels,
}: {
  item: Experience;
  labels: Pick<
    Dictionary['work'],
    'present' | 'responsibilities' | 'achievements' | 'stack'
  >;
}) {
  return (
    <article className="flex flex-col gap-6 border-t border-line pt-8">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-sm text-muted">
          {formatPeriod(item.startDate, item.endDate, labels.present)}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          {item.project}
        </h2>
        <p className="text-accent">
          {item.company ? `${item.role}, ${item.company}` : item.role}
        </p>
      </header>

      <p className="max-w-3xl leading-relaxed text-pretty">{item.summary}</p>

      <BulletSection
        title={labels.responsibilities}
        items={item.responsibilities}
      />
      <BulletSection title={labels.achievements} items={item.achievements} />

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold">{labels.stack}</h3>
        <StackList items={item.stack} />
      </section>
    </article>
  );
}
