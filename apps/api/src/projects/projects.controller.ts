import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectDto } from './project.dto.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('Контент')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Открытые и фриланс-проекты' })
  @ApiOkResponse({ type: [ProjectDto] })
  list(): Promise<ProjectDto[]> {
    return this.projects.list();
  }
}
