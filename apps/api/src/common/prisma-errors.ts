import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

export const notFound = (message = 'Запись не найдена') =>
  new NotFoundException(message);

/**
 * Ошибки Prisma, которые означают ошибку запроса, а не сервера:
 * P2025 — записи нет, P2002 — нарушен уникальный индекс.
 * Ответ на занятый slug — в том же формате, что ошибки валидации,
 * и форма подсветит поле. Остальное пробрасывается как 500.
 */
export function mapPrismaError(
  error: unknown,
  notFoundMessage?: string,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException({
        message: 'Такой slug уже занят',
        errors: { slug: ['slugTaken'] },
      });
    }
    if (error.code === 'P2025') {
      throw notFound(notFoundMessage);
    }
  }
  throw error;
}
