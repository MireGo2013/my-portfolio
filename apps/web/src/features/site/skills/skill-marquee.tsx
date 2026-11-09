import { skillDocsUrl } from '@/features/site/skills/skill-docs';
import type { SkillLogo } from '@/features/site/skills/skill-logos';

function LogoContent({ logo }: { logo: SkillLogo }) {
  return (
    <>
      {logo.path ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-9 fill-current"
        >
          <path d={logo.path} />
        </svg>
      ) : (
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-sm border border-current font-mono text-sm"
        >
          {logo.name.slice(0, 2)}
        </span>
      )}
      <span className="text-center font-mono text-xs">{logo.name}</span>
    </>
  );
}

function LogoList({
  logos,
  hidden = false,
}: {
  logos: SkillLogo[];
  hidden?: boolean;
}) {
  const itemClass =
    'flex w-24 flex-col items-center gap-3 text-muted transition-colors hover:text-accent';

  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`marquee-list flex shrink-0 items-start gap-10 pr-10 ${hidden ? 'marquee-copy' : ''}`}
    >
      {logos.map((logo) => {
        const docs = skillDocsUrl(logo.name);

        return (
          <li key={logo.name}>
            {docs ? (
              <a
                href={docs}
                target="_blank"
                rel="noopener noreferrer"
                // Копия нужна только для глаз: Tab не должен заходить в неё
                tabIndex={hidden ? -1 : undefined}
                className={itemClass}
              >
                <LogoContent logo={logo} />
              </a>
            ) : (
              <div className={itemClass}>
                <LogoContent logo={logo} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Бегущая лента на чистом CSS: компонент серверный и не добавляет JavaScript.
 * Второй список нужен для бесшовного цикла, поэтому он скрыт от скринридеров.
 */
export function SkillMarquee({
  logos,
  label,
}: {
  logos: SkillLogo[];
  label: string;
}) {
  return (
    <section aria-label={label} className="marquee overflow-hidden py-2">
      <div className="marquee-track flex w-max">
        <LogoList logos={logos} />
        <LogoList logos={logos} hidden />
      </div>
    </section>
  );
}
