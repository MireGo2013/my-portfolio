import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

/** Проверяет тело запроса Zod-схемой и возвращает очищенные данные. */
export class ZodValidationPipe implements PipeTransform<unknown, unknown> {
  /**
   * @param field имя параметра, если проверяется одно значение, а не объект.
   *   Тогда ошибка попадёт в errors под этим именем, а не потеряется.
   */
  constructor(
    private readonly schema: ZodType,
    private readonly field?: string,
  ) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error);
      throw new BadRequestException({
        message: 'Ошибка валидации',
        errors: this.field
          ? { ...fieldErrors, [this.field]: formErrors }
          : fieldErrors,
      });
    }
    return result.data;
  }
}
