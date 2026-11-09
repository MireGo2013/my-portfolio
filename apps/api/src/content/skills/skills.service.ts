import { Injectable } from '@nestjs/common';
import type { Locale } from '@portfolio/shared';
import { singleTranslation } from '../../common/locale-query.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SkillCategoryDto } from './skill-category.dto.js';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locale: Locale): Promise<SkillCategoryDto[]> {
    const categories = await this.prisma.skillCategory.findMany({
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        translations: { where: { locale }, select: { name: true } },
        skills: { orderBy: { position: 'asc' }, select: { name: true } },
      },
    });

    return categories.map(({ slug, translations, skills }) => ({
      slug,
      name: singleTranslation(translations).name,
      skills: skills.map((skill) => skill.name),
    }));
  }
}
