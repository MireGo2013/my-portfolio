import { resumeUrl, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Profile } from '@/lib/api/content-api';
import { Avatar } from './avatar';

export function AboutHero({
  profile,
  locale,
  dictionary,
}: {
  profile: Profile;
  locale: Locale;
  dictionary: Dictionary['about'];
}) {
  const resume = resumeUrl(locale);

  return (
    <section className="flex flex-col-reverse items-start justify-between gap-10 lg:flex-row lg:gap-16">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-accent">{dictionary.greeting}</p>
          <h1 className="text-6xl font-semibold tracking-tight sm:text-8xl">
            {profile.shortName}
          </h1>
          <p className="font-mono text-sm text-muted">
            {profile.title} · {profile.specialization}
          </p>
        </div>

        <div className="flex max-w-2xl flex-col gap-4 text-lg leading-relaxed text-pretty text-muted">
          {profile.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href={resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            {dictionary.viewResume}
          </a>
          <a
            href={resume}
            download
            aria-label={dictionary.downloadResumeLabel}
            className="rounded-sm border border-accent px-5 py-3 font-medium text-accent transition-colors hover:bg-accent hover:text-on-accent"
          >
            {dictionary.downloadResume}
          </a>
        </div>
      </div>

      <Avatar alt={profile.fullName} />
    </section>
  );
}
