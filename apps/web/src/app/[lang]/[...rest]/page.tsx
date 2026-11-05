import { notFound } from 'next/navigation';
import { LOCALES } from '@/i18n/config';

// Любой неизвестный адрес под /ru или /en показывает not-found этого языка
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang, rest: ['not-found'] }));
}

export default function CatchAllPage() {
  notFound();
}
