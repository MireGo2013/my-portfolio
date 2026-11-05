import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SkillCategoryDto } from './skill-category.dto.js';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<SkillCategoryDto[]> {
    const categories = await this.prisma.skillCategory.findMany({
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        name: true,
        skills: { orderBy: { position: 'asc' }, select: { name: true } },
      },
    });

    return categories.map((category) => ({
      ...category,
      skills: category.skills.map((skill) => skill.name),
    }));
  }
}
