import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MESSAGE_STATUSES,
  type MessagesQuery,
  type MessageStatus,
} from '@portfolio/shared';
import { Prisma, type ContactMessage } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  MessageCountsDto,
  MessageDto,
  MessagePageDto,
} from './admin-messages.dto.js';

function toDto(row: ContactMessage): MessageDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const notFound = () => new NotFoundException('Сообщение не найдено');

@Injectable()
export class AdminMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MessagesQuery): Promise<MessagePageDto> {
    const { status, q, from, to, sort, order, page, pageSize } = query;
    const where: Prisma.ContactMessageWhereInput = {
      status,
      createdAt:
        from || to
          ? {
              gte: from ? new Date(from) : undefined,
              lt: to ? new Date(to) : undefined,
            }
          : undefined,
      // ILIKE по трём полям. Индекса под это нет: при сотнях сообщений он не нужен
      OR: q
        ? (['name', 'email', 'message'] as const).map((field) => ({
            [field]: { contains: q, mode: 'insensitive' as const },
          }))
        : undefined,
    };

    // Второй ключ сортировки делает порядок однозначным: при одинаковых
    // именах строки не будут перескакивать между страницами
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: [{ [sort]: order }, { id: order }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      items: rows.map(toDto),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Сколько сообщений в каждом статусе: для вкладок и счётчика в меню. */
  async counts(): Promise<MessageCountsDto> {
    const groups = await this.prisma.contactMessage.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = Object.fromEntries(
      MESSAGE_STATUSES.map((status) => [status, 0]),
    ) as Record<MessageStatus, number>;
    for (const group of groups) {
      counts[group.status] = group._count._all;
    }
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { ...counts, total };
  }

  async get(id: string): Promise<MessageDto> {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) throw notFound();
    return toDto(row);
  }

  async updateStatus(id: string, status: MessageStatus): Promise<MessageDto> {
    try {
      return toDto(
        await this.prisma.contactMessage.update({
          where: { id },
          data: { status },
        }),
      );
    } catch (error) {
      // P2025: записи для update не нашлось
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw notFound();
      }
      throw error;
    }
  }
}
