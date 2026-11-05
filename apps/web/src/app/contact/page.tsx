import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';
import { PageHeading } from '@/components/page-heading';
import { getProfile } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Форма обратной связи, email, Telegram и GitHub.',
};

const linkClass =
  'underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent';

export default async function ContactPage() {
  const profile = await getProfile();

  return (
    <>
      <PageHeading
        title="Контакты"
        description="Напишите через форму или любым удобным способом."
      />
      <div className="flex flex-col gap-12">
        <ContactForm />
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
        </ul>
      </div>
    </>
  );
}
