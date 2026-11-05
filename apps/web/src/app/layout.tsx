import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { getProfile } from '@/lib/content';
import './globals.css';

const sans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin', 'cyrillic'],
});

const mono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  return {
    title: {
      default: `${profile.fullName}, ${profile.title}`,
      template: `%s | ${profile.fullName}`,
    },
    description: profile.summary,
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const profile = await getProfile();

  return (
    <html lang="ru" className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader name={profile.fullName} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
