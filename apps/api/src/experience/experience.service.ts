import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ExperienceDto } from './experience.dto.js';

/** Дата хранится в UTC с точностью до месяца: 2021-12-01 -> "2021-12". */
function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ExperienceDto[]> {
    const items = await this.prisma.experience.findMany({
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        company: true,
        project: true,
        role: true,
        summary: true,
        startDate: true,
        endDate: true,
        highlights: true,
        stack: true,
      },
    });

    return items.map((item) => ({
      ...item,
      startDate: toMonth(item.startDate),
      endDate: item.endDate && toMonth(item.endDate),
    }));
  }
}
