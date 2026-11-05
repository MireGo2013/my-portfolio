import { Hero } from '@/components/hero';
import { getDictionary, resolveLocale } from '@/i18n/server';
import { getProfile } from '@/lib/content';

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const locale = await resolveLocale(params);
  const profile = await getProfile(locale);

  return (
    <div className="flex min-h-[65dvh] items-center">
      <Hero
        profile={profile}
        locale={locale}
        dictionary={getDictionary(locale).hero}
      />
    </div>
  );
}
