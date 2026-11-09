import { AboutHero } from '@/features/site/home/about-hero';
import { enterDelay } from '@/features/site/home/animated-text';
import { SkillMarquee } from '@/features/site/skills/skill-marquee';
import { getDictionary, resolveLocale } from '@/i18n/server';
import { getProfile } from '@/shared/content/content';
import { SKILL_LOGOS } from '@/features/site/skills/skill-logos';

export default async function AboutPage({ params }: PageProps<'/[lang]'>) {
  const locale = await resolveLocale(params);
  const dictionary = getDictionary(locale).about;
  const profile = await getProfile(locale);

  return (
    <div className="flex flex-col gap-16">
      <AboutHero profile={profile} locale={locale} dictionary={dictionary} />
      <div className="enter" style={enterDelay(1800)}>
        <SkillMarquee logos={SKILL_LOGOS} label={dictionary.skillsLabel} />
      </div>
    </div>
  );
}
