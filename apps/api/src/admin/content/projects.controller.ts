import { Controller, Delete, Get, HttpCode, Post, Put } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  projectInputSchema,
  reorderSchema,
  type ProjectData,
  type ReorderInput,
} from '@portfolio/shared';
import { AdminOnly } from '../../auth/auth.decorators.js';
import { AdminProjectDto, AdminProjectInputDto } from './admin-content.dto.js';
import { AdminContentService } from './admin-content.service.js';
import {
  ApiRecord,
  ApiReorder,
  ApiSaveResponses,
  body,
  id,
} from './admin-content.decorators.js';

@ApiTags('Админка: контент')
@Controller('admin/content/projects')
@AdminOnly()
export class AdminProjectsController {
  constructor(private readonly content: AdminContentService) {}

  @Get()
  @ApiOperation({ summary: 'Открытые проекты и фриланс в порядке показа' })
  @ApiOkResponse({ type: [AdminProjectDto] })
  list(): Promise<AdminProjectDto[]> {
    return this.content.listProjects();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить проект в конец списка' })
  @ApiCreatedResponse({ type: AdminProjectDto })
  @ApiSaveResponses(AdminProjectInputDto)
  create(@body(projectInputSchema) input: ProjectData) {
    return this.content.createProject(input);
  }

  @Put('order')
  @ApiReorder(AdminProjectDto)
  reorder(@body(reorderSchema) input: ReorderInput) {
    return this.content.reorderProjects(input.ids);
  }

  @Get(':id')
  @ApiRecord(AdminProjectDto)
  get(@id() recordId: string): Promise<AdminProjectDto> {
    return this.content.getProject(recordId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить проект' })
  @ApiRecord(AdminProjectDto)
  @ApiSaveResponses(AdminProjectInputDto)
  update(@id() recordId: string, @body(projectInputSchema) input: ProjectData) {
    return this.content.updateProject(recordId, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Удалено' })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  remove(@id() recordId: string): Promise<void> {
    return this.content.deleteProject(recordId);
  }
}
