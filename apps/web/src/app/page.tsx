import type { Metadata } from 'next';
import { Hero } from '@/components/hero';
import { getProfile } from '@/lib/content';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: `${profile.fullName}, ${profile.title}`,
    description: profile.summary,
  };
}

export default async function HomePage() {
  const profile = await getProfile();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-6 py-20">
      <Hero profile={profile} />
    </main>
  );
}
