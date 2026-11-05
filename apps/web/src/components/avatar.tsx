import Image from 'next/image';

// Заглушка с инициалами. Чтобы поставить фото, положи файл в public и поменяй
// путь здесь. Для JPG или PNG убери unoptimized: их Next.js оптимизирует сам.
const AVATAR_SRC = '/avatar.svg';

export function Avatar({ alt }: { alt: string }) {
  return (
    <div className="size-44 shrink-0 overflow-hidden rounded-full border-2 border-accent p-1.5 sm:size-64">
      <Image
        src={AVATAR_SRC}
        alt={alt}
        width={320}
        height={320}
        unoptimized
        priority
        className="size-full rounded-full object-cover"
      />
    </div>
  );
}
