import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Locale } from '@portfolio/shared';
import { ApiLocaleQuery, LocaleQuery } from '../common/locale-query.js';
import { ProjectDto } from './project.dto.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('Контент')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiLocaleQuery()
  @ApiOperation({ summary: 'Открытые и фриланс-проекты' })
  @ApiOkResponse({ type: [ProjectDto] })
  list(@LocaleQuery() locale: Locale): Promise<ProjectDto[]> {
    return this.projects.list(locale);
  }
}
