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
  experienceInputSchema,
  reorderSchema,
  type ExperienceData,
  type ReorderInput,
} from '@portfolio/shared';
import { AdminOnly } from '../../auth/auth.decorators.js';
import {
  AdminExperienceDto,
  AdminExperienceInputDto,
} from './admin-content.dto.js';
import { AdminContentService } from './admin-content.service.js';
import {
  ApiRecord,
  ApiReorder,
  ApiSaveResponses,
  body,
  id,
} from './admin-content.decorators.js';

@ApiTags('Админка: контент')
@Controller('admin/content/experience')
@AdminOnly()
export class AdminExperienceController {
  constructor(private readonly content: AdminContentService) {}

  @Get()
  @ApiOperation({ summary: 'Коммерческие проекты в порядке показа' })
  @ApiOkResponse({ type: [AdminExperienceDto] })
  list(): Promise<AdminExperienceDto[]> {
    return this.content.listExperience();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить проект в конец списка' })
  @ApiCreatedResponse({ type: AdminExperienceDto })
  @ApiSaveResponses(AdminExperienceInputDto)
  create(@body(experienceInputSchema) input: ExperienceData) {
    return this.content.createExperience(input);
  }

  // Раньше :id, иначе «order» приняли бы за id
  @Put('order')
  @ApiReorder(AdminExperienceDto)
  reorder(@body(reorderSchema) input: ReorderInput) {
    return this.content.reorderExperience(input.ids);
  }

  @Get(':id')
  @ApiRecord(AdminExperienceDto)
  get(@id() recordId: string): Promise<AdminExperienceDto> {
    return this.content.getExperience(recordId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить проект' })
  @ApiRecord(AdminExperienceDto)
  @ApiSaveResponses(AdminExperienceInputDto)
  update(
    @id() recordId: string,
    @body(experienceInputSchema) input: ExperienceData,
  ) {
    return this.content.updateExperience(recordId, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Удалено' })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  remove(@id() recordId: string): Promise<void> {
    return this.content.deleteExperience(recordId);
  }
}
