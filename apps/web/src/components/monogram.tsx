/** "Владислав Соболь" -> "ВС", "Vladislav Sobol" -> "VS". */
export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/** Логотип сайта: инициалы в медном круге. Размер шрифта задаёт className. */
export function Monogram({
  fullName,
  className = '',
}: {
  fullName: string;
  className?: string;
}) {
  return (
    <span
      className={`flex aspect-square items-center justify-center rounded-full border-2 border-accent bg-surface font-mono text-accent ${className}`}
    >
      {initials(fullName)}
    </span>
  );
}
