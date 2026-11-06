import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

// Общие для сайта и админки: у них разные корневые layout, а шрифты одни

const sans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin', 'cyrillic'],
});

const mono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
});

/** Классы для <html>: подключают CSS-переменные шрифтов. */
export const FONT_CLASSES = `${sans.variable} ${mono.variable} antialiased`;
