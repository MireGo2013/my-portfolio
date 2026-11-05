import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
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

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${profile.fullName}, ${profile.title}`,
      template: `%s | ${profile.fullName}`,
    },
    ...pageMetadata(locale, '', {
      title: `${profile.fullName}, ${profile.title}`,
      description: profile.summary,
    }),
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const locale = await resolveLocale(params);
  const profile = await getProfile(locale);

  return (
    <html
      lang={locale}
      className={`${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <SiteHeader
          name={profile.fullName}
          locale={locale}
          dictionary={getDictionary(locale)}
        />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
