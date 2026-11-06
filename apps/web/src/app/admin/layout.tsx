import type { Metadata } from 'next';
import { FONT_CLASSES } from '../fonts';
import '../globals.css';

// Отдельный корневой layout: у админки нет шапки сайта, языков и контента из API.
// Переход между /admin и /ru перезагружает страницу целиком, это нормально

export const metadata: Metadata = {
  title: { default: 'Админка', template: '%s | Админка' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html lang="ru" className={FONT_CLASSES}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
