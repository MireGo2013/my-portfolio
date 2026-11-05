import { Injectable } from '@nestjs/common';
import type { Locale } from '@portfolio/shared';
import { singleTranslation } from '../common/locale-query.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProjectDto } from './project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locale: Locale): Promise<ProjectDto[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        kind: true,
        stack: true,
        repoUrl: true,
        liveUrl: true,
        translations: {
          where: { locale },
          select: { name: true, description: true },
        },
      },
    });

    return projects.map(({ translations, ...project }) => ({
      ...project,
      ...singleTranslation(translations),
    }));
  }
}
