/** Проверяет, что строка входит в список, и сужает её тип до элемента списка. */
export function isOneOf<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return (values as readonly string[]).includes(value);
}
