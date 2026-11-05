import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProjectDto } from './project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<ProjectDto[]> {
    return this.prisma.project.findMany({
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        name: true,
        kind: true,
        description: true,
        stack: true,
        repoUrl: true,
        liveUrl: true,
      },
    });
  }
}
