import { skillDocsUrl } from '@/features/site/skills/skill-docs';

export function StackList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
      {items.map((item) => {
        const docs = skillDocsUrl(item);

        return (
          <li key={item}>
            {docs ? (
              <a
                href={docs}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-accent hover:underline hover:underline-offset-4 focus-visible:text-accent"
              >
                {item}
              </a>
            ) : (
              item
            )}
          </li>
        );
      })}
    </ul>
  );
}
