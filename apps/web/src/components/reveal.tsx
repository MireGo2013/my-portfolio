'use client';

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';

type RevealFrom = 'up' | 'left' | 'right';

// Модуль загрузился, значит JavaScript работает: скрипт в layout не будет
// снимать скрытие блоков (см. REVEAL_GUARD_SCRIPT)
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-reveal-ready', '');
}

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
 * только атрибут data-visible. Блок скрыт, только пока на html есть класс
 * reveal-js: его ставит и при необходимости снимает REVEAL_GUARD_SCRIPT.
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

/**
 * Выполняется в head до первой отрисовки. Прячет блоки только там, где есть
 * JavaScript, а если он не загрузился за 3 секунды (медленная сеть, блокировщик),
 * снимает скрытие: контент важнее анимации.
 */
export const REVEAL_GUARD_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('reveal-js');setTimeout(function(){if(!d.hasAttribute('data-reveal-ready'))d.classList.remove('reveal-js')},3000)})();`;
