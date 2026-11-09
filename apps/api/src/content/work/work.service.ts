import { Injectable } from '@nestjs/common';
import type { Locale } from '@portfolio/shared';
import { singleTranslation } from '../../common/locale-query.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { WorkDto } from './work.dto.js';

/** Дата хранится в UTC с точностью до месяца: 2021-12-01 -> "2021-12". */
function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locale: Locale): Promise<WorkDto[]> {
    const items = await this.prisma.work.findMany({
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        role: true,
        startDate: true,
        endDate: true,
        stack: true,
        translations: {
          where: { locale },
          select: {
            company: true,
            project: true,
            summary: true,
            responsibilities: true,
            achievements: true,
          },
        },
      },
    });

    return items.map(({ translations, ...item }) => ({
      ...item,
      ...singleTranslation(translations),
      startDate: toMonth(item.startDate),
      endDate: item.endDate && toMonth(item.endDate),
    }));
  }
}
