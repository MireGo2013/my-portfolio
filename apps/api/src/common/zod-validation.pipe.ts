import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Ошибки по полям. Ключ — полный путь поля через точку, как его называет
 * React Hook Form: translations.ru.summary, stack.2. Так форма покажет
 * серверную ошибку у того поля, к которому она относится.
 */
function fieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/** Проверяет тело запроса Zod-схемой и возвращает очищенные данные. */
export class ZodValidationPipe implements PipeTransform<unknown, unknown> {
  /**
   * @param field имя параметра, если проверяется одно значение, а не объект.
   *   Тогда ошибка попадёт в errors под этим именем, а не под пустым ключом.
   */
  constructor(
    private readonly schema: ZodType,
    private readonly field?: string,
  ) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const { '': formErrors, ...errors } = fieldErrors(result.error.issues);
      throw new BadRequestException({
        message: 'Ошибка валидации',
        errors: this.field
          ? { ...errors, [this.field]: formErrors ?? [] }
          : errors,
      });
    }
    return result.data;
  }
}
