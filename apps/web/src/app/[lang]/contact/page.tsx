import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';
import { PageHeading } from '@/components/page-heading';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getProfile } from '@/lib/content';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/contact'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { title, metaDescription } = getDictionary(locale).contact;

  return pageMetadata(locale, '/contact', {
    title,
    description: metaDescription,
  });
}

const linkClass =
  'underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent';

export default async function ContactPage({
  params,
}: PageProps<'/[lang]/contact'>) {
  const locale = await resolveLocale(params);
  const { title, description, form } = getDictionary(locale).contact;
  const profile = await getProfile(locale);

  return (
    <>
      <PageHeading title={title} description={description} />
      <div className="flex flex-col gap-12">
        <ContactForm dictionary={form} />
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href={`mailto:${profile.email}`} className={linkClass}>
              {profile.email}
            </a>
          </li>
          <li>
            <a href={profile.telegramUrl} className={linkClass}>
              Telegram
            </a>
          </li>
          <li>
            <a href={profile.githubUrl} className={linkClass}>
              GitHub
            </a>
          </li>
          <li>
            <a href={profile.linkedinUrl} className={linkClass}>
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
