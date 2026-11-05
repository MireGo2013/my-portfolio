import Link from 'next/link';
import type { Profile } from '@/lib/api/content-api';

const secondaryLinkClass =
  'underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent';

export function Hero({ profile }: { profile: Profile }) {
  return (
    <section className="flex flex-col gap-8">
      <p className="font-mono text-sm text-muted">
        {profile.title} · {profile.specialization}
      </p>

      <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
        {profile.fullName}
      </h1>

      <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted sm:text-xl">
        {profile.summary}
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
        <Link
          href="/contact"
          className="rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          Связаться
        </Link>
        <a href={profile.telegramUrl} className={secondaryLinkClass}>
          Telegram
        </a>
        <a href={profile.githubUrl} className={secondaryLinkClass}>
          GitHub
        </a>
      </div>
    </section>
  );
}
