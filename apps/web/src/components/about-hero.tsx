import Link from 'next/link';
import { resumeUrl, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { Profile } from '@/lib/api/content-api';
import {
  AnimatedText,
  animatedTextDuration,
  enterDelay,
} from './animated-text';
import { Avatar } from './avatar';

const TEXT_START_MS = 450;

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

  // Абзацы появляются по очереди: каждый стартует, когда закончился предыдущий
  const durations = profile.about.map(animatedTextDuration);
  const sum = (values: number[]) =>
    values.reduce((total, value) => total + value, 0);
  const paragraphs = profile.about.map((text, index) => ({
    text,
    startDelay: TEXT_START_MS + sum(durations.slice(0, index)),
  }));
  const textEnd = TEXT_START_MS + sum(durations);

  return (
    <section className="flex flex-col-reverse items-start justify-between gap-10 lg:flex-row lg:gap-16">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="enter font-mono text-accent" style={enterDelay(0)}>
            {dictionary.greeting}
          </p>
          <h1
            className="enter text-6xl font-semibold tracking-tight sm:text-8xl"
            style={enterDelay(120)}
          >
            {profile.shortName}
          </h1>
          <p
            className="enter font-mono text-sm text-muted"
            style={enterDelay(280)}
          >
            {profile.title} · {profile.specialization}
          </p>
        </div>

        <div className="flex max-w-2xl flex-col gap-4 text-lg leading-relaxed text-pretty text-muted">
          {paragraphs.map(({ text, startDelay }) => (
            <AnimatedText key={text} text={text} startDelay={startDelay} />
          ))}
        </div>

        <div
          className="enter flex flex-wrap items-center gap-4 pt-2"
          style={enterDelay(textEnd)}
        >
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
          <Link
            href={`/${locale}/contact`}
            className="rounded-sm border border-line px-5 py-3 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {dictionary.contact}
          </Link>
        </div>
      </div>

      <div className="enter-scale" style={enterDelay(200)}>
        <Avatar alt={profile.fullName} />
      </div>
    </section>
  );
}
