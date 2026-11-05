import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Experience } from '@/lib/api/content-api';
import { formatPeriod } from '@/lib/format-period';
import { Reveal } from './reveal';
import { StackList } from './stack-list';

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <Reveal>
        <h3 className="font-semibold">{title}</h3>
      </Reveal>
      <ul className="flex max-w-3xl list-disc flex-col gap-2 pl-5 leading-relaxed text-pretty text-muted marker:text-accent">
        {items.map((item) => (
          // Каждый пункт появляется снизу, когда до него доскроллили
          <Reveal key={item} as="li">
            {item}
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function WorkItem({
  item,
  labels,
  from = 'left',
}: {
  item: Experience;
  labels: Pick<
    Dictionary['projects'],
    'present' | 'responsibilities' | 'achievements' | 'stack'
  >;
  /** С какой стороны проект выезжает на экран. */
  from?: 'left' | 'right';
}) {
  return (
    <article className="flex flex-col gap-6 border-t border-line pt-8">
      <Reveal from={from}>
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
      </Reveal>

      <Reveal delay={150}>
        <p className="max-w-3xl leading-relaxed text-pretty">{item.summary}</p>
      </Reveal>

      <BulletSection
        title={labels.responsibilities}
        items={item.responsibilities}
      />
      <BulletSection title={labels.achievements} items={item.achievements} />

      <Reveal>
        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">{labels.stack}</h3>
          <StackList items={item.stack} />
        </section>
      </Reveal>
    </article>
  );
}
