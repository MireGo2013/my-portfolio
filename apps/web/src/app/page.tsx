import { Hero } from '@/components/hero';
import { getProfile } from '@/lib/content';

export default async function HomePage() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-[65dvh] items-center">
      <Hero profile={profile} />
    </div>
  );
}
