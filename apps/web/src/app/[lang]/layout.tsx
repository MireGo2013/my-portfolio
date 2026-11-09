import type { Metadata } from 'next';
import { REVEAL_GUARD_SCRIPT } from '@/shared/ui/reveal';
import { SiteHeader } from '@/features/site/layout/site-header';
import { SideRails, SiteFooter } from '@/features/site/layout/social-links';
import { LOCALES } from '@/i18n/config';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getProfile } from '@/shared/content/content';
import { FONT_CLASSES } from '../fonts';
import '../globals.css';

// На Vercel адрес подставляется сам. Нужен для абсолютных ссылок в метаданных
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const profile = await getProfile(locale);

  const defaultTitle = `${profile.fullName}, ${profile.title}`;

  return {
    ...pageMetadata(locale, '', {
      title: defaultTitle,
      description: profile.summary,
    }),
    metadataBase: new URL(siteUrl),
    // Шаблон идёт после pageMetadata: иначе его заменила бы строка title,
    // и подстраницы потеряли бы имя в заголовке вкладки
    title: {
      default: defaultTitle,
      template: `%s | ${profile.fullName}`,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const locale = await resolveLocale(params);
  const dictionary = getDictionary(locale);
  const profile = await getProfile(locale);

  return (
    <html
      lang={locale}
      className={FONT_CLASSES}
      // Скрипт ниже меняет классы html до гидратации, это ожидаемо
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_GUARD_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader
          name={profile.fullName}
          locale={locale}
          dictionary={dictionary}
        />
        <SideRails contacts={profile} dictionary={dictionary.social} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
          {children}
        </main>
        <SiteFooter contacts={profile} dictionary={dictionary.social} />
      </body>
    </html>
  );
}
