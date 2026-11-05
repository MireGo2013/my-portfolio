import { AboutHero } from '@/components/about-hero';
import { SkillMarquee } from '@/components/skill-marquee';
import { getDictionary, resolveLocale } from '@/i18n/server';
import { getProfile } from '@/lib/content';
import { SKILL_LOGOS } from '@/lib/skill-logos';

export default async function AboutPage({ params }: PageProps<'/[lang]'>) {
  const locale = await resolveLocale(params);
  const dictionary = getDictionary(locale).about;
  const profile = await getProfile(locale);

  return (
    <div className="flex flex-col gap-16">
      <AboutHero profile={profile} locale={locale} dictionary={dictionary} />
      <SkillMarquee logos={SKILL_LOGOS} label={dictionary.skillsLabel} />
    </div>
  );
}
