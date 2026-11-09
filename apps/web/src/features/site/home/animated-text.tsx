import type { CSSProperties } from 'react';

/** Пауза между появлением соседних слов. */
const WORD_STEP_MS = 18;

export function enterDelay(ms: number): CSSProperties {
  return { '--enter-delay': `${ms}ms` } as CSSProperties;
}

/** Сколько длится появление текста: следующий блок стартует после него. */
export function animatedTextDuration(text: string): number {
  return text.split(/\s+/).length * WORD_STEP_MS;
}

/**
 * Текст появляется слово за словом. Анимация на чистом CSS: компонент серверный,
 * поэтому текст есть в HTML и виден поисковикам и без JavaScript.
 */
export function AnimatedText({
  text,
  startDelay,
}: {
  text: string;
  startDelay: number;
}) {
  const words = text.split(/\s+/);

  return (
    <p>
      {words.map((word, index) => (
        // Слова могут повторяться, поэтому в ключе есть позиция
        <span key={`${index}-${word}`}>
          <span
            className="enter-word"
            style={enterDelay(startDelay + index * WORD_STEP_MS)}
          >
            {word}
          </span>
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
