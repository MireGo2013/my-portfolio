import { siGithub, siTelegram } from 'simple-icons';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Profile } from '@/lib/api/content-api';

type Contacts = Pick<
  Profile,
  'email' | 'githubUrl' | 'telegramUrl' | 'linkedinUrl'
>;

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
      <path d={path} />
    </svg>
  );
}

// Логотипа LinkedIn в наборе Simple Icons нет, поэтому простая буквенная иконка
function LinkedInIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 items-center justify-center rounded-[3px] border border-current font-mono text-[11px] leading-none font-semibold"
    >
      in
    </span>
  );
}

function SocialList({
  contacts,
  className,
}: {
  contacts: Contacts;
  className: string;
}) {
  const linkClass = 'block text-muted transition-colors hover:text-accent';

  return (
    <ul className={className}>
      <li>
        <a href={contacts.githubUrl} aria-label="GitHub" className={linkClass}>
          <BrandIcon path={siGithub.path} />
        </a>
      </li>
      <li>
        <a
          href={contacts.telegramUrl}
          aria-label="Telegram"
          className={linkClass}
        >
          <BrandIcon path={siTelegram.path} />
        </a>
      </li>
      <li>
        <a
          href={contacts.linkedinUrl}
          aria-label="LinkedIn"
          className={linkClass}
        >
          <LinkedInIcon />
        </a>
      </li>
    </ul>
  );
}

/** Закреплённые по бокам ссылки. Только на широких экранах, где есть свободные поля. */
export function SideRails({
  contacts,
  dictionary,
}: {
  contacts: Contacts;
  dictionary: Dictionary['social'];
}) {
  return (
    <>
      <nav
        aria-label={dictionary.label}
        className="rail-enter fixed bottom-0 left-8 z-10 hidden flex-col items-center gap-6 xl:flex"
      >
        <SocialList
          contacts={contacts}
          className="flex flex-col items-center gap-5"
        />
        <span aria-hidden="true" className="h-24 w-px bg-line" />
      </nav>
      <div className="rail-enter fixed right-8 bottom-0 z-10 hidden flex-col items-center gap-6 xl:flex">
        <a
          href={`mailto:${contacts.email}`}
          className="font-mono text-xs tracking-widest text-muted transition-colors [writing-mode:vertical-rl] hover:text-accent"
        >
          {contacts.email}
        </a>
        <span aria-hidden="true" className="h-24 w-px bg-line" />
      </div>
    </>
  );
}

/** Те же ссылки внизу страницы для экранов, где боковых полей нет. */
export function SiteFooter({
  contacts,
  dictionary,
}: {
  contacts: Contacts;
  dictionary: Dictionary['social'];
}) {
  return (
    <footer className="border-t border-line xl:hidden">
      <nav
        aria-label={dictionary.label}
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-6"
      >
        <SocialList contacts={contacts} className="flex items-center gap-5" />
        <a
          href={`mailto:${contacts.email}`}
          className="font-mono text-sm text-muted transition-colors hover:text-accent"
        >
          {contacts.email}
        </a>
      </nav>
    </footer>
  );
}
