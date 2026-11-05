'use client';

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';

type RevealFrom = 'up' | 'left' | 'right';

let observer: IntersectionObserver | undefined;

/** Один наблюдатель на все блоки страницы: это дешевле, чем по одному на каждый. */
function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Блок выше экрана тоже показываем: посетитель мог сразу прокрутить вниз
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          entry.target.setAttribute('data-visible', '');
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  return observer;
}

/**
 * Показывает блок, когда до него доскроллили. Сама анимация лежит в CSS, а здесь
 * только атрибут data-visible. Браузер сам отключает её при prefers-reduced-motion,
 * а без JavaScript контент показывает noscript-стиль из layout.
 */
export function Reveal({
  children,
  from = 'up',
  delay = 0,
  as = 'div',
  className = '',
}: {
  children: ReactNode;
  from?: RevealFrom;
  delay?: number;
  as?: 'div' | 'li';
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      element.setAttribute('data-visible', '');
      return;
    }

    const current = getObserver();
    current.observe(element);
    return () => {
      current.unobserve(element);
    };
  }, []);

  const props = {
    className: `reveal reveal-${from} ${className}`,
    style: { '--reveal-delay': `${delay}ms` } as CSSProperties,
  };

  return as === 'li' ? (
    <li ref={ref as Ref<HTMLLIElement>} {...props}>
      {children}
    </li>
  ) : (
    <div ref={ref as Ref<HTMLDivElement>} {...props}>
      {children}
    </div>
  );
}
