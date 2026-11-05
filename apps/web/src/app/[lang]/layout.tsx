import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { SideRails, SiteFooter } from '@/components/social-links';
import { LOCALES } from '@/i18n/config';
import { getDictionary, pageMetadata, resolveLocale } from '@/i18n/server';
import { getProfile } from '@/lib/content';
import '../globals.css';

const sans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin', 'cyrillic'],
});

const mono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
});

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
      className={`${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <noscript>
          <style>{'.reveal { opacity: 1; transform: none; }'}</style>
        </noscript>
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
