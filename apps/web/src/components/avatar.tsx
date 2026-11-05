import Image from 'next/image';
import { Monogram } from './monogram';

// Пока фото нет, показываем логотип с инициалами. Чтобы поставить фото,
// положи файл в public и укажи здесь путь, например '/avatar.jpg'.
const AVATAR_SRC: string | null = null;

export function Avatar({ alt }: { alt: string }) {
  if (!AVATAR_SRC) {
    return (
      <div role="img" aria-label={alt} className="size-44 shrink-0 sm:size-64">
        <Monogram fullName={alt} className="size-full text-6xl sm:text-8xl" />
      </div>
    );
  }

  return (
    <div className="size-44 shrink-0 overflow-hidden rounded-full border-2 border-accent p-1.5 sm:size-64">
      <Image
        src={AVATAR_SRC}
        alt={alt}
        width={320}
        height={320}
        priority
        className="size-full rounded-full object-cover"
      />
    </div>
  );
}
