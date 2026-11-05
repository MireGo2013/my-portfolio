/** "2021-12" -> "12.2021". Без Date: иначе результат зависит от часового пояса. */
function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-');
  return `${monthNumber}.${year}`;
}

/** Период работы: "12.2021 — 07.2026" или "12.2021 — настоящее время". */
export function formatPeriod(
  start: string,
  end: string | null,
  presentLabel: string,
): string {
  return `${formatMonth(start)} — ${end ? formatMonth(end) : presentLabel}`;
}
