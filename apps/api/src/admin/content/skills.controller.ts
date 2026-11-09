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
  reorderSchema,
  skillCategoryInputSchema,
  type ReorderInput,
  type SkillCategoryData,
} from '@portfolio/shared';
import { AdminOnly } from '../../auth/auth.decorators.js';
import {
  AdminSkillCategoryDto,
  AdminSkillCategoryInputDto,
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
@Controller('admin/content/skills')
@AdminOnly()
export class AdminSkillsController {
  constructor(private readonly content: AdminContentService) {}

  @Get()
  @ApiOperation({ summary: 'Группы навыков в порядке показа' })
  @ApiOkResponse({ type: [AdminSkillCategoryDto] })
  list(): Promise<AdminSkillCategoryDto[]> {
    return this.content.listSkills();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить группу в конец списка' })
  @ApiCreatedResponse({ type: AdminSkillCategoryDto })
  @ApiSaveResponses(AdminSkillCategoryInputDto)
  create(@body(skillCategoryInputSchema) input: SkillCategoryData) {
    return this.content.createSkillCategory(input);
  }

  @Put('order')
  @ApiReorder(AdminSkillCategoryDto)
  reorder(@body(reorderSchema) input: ReorderInput) {
    return this.content.reorderSkills(input.ids);
  }

  @Get(':id')
  @ApiRecord(AdminSkillCategoryDto)
  get(@id() recordId: string): Promise<AdminSkillCategoryDto> {
    return this.content.getSkillCategory(recordId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить группу и её навыки' })
  @ApiRecord(AdminSkillCategoryDto)
  @ApiSaveResponses(AdminSkillCategoryInputDto)
  update(
    @id() recordId: string,
    @body(skillCategoryInputSchema) input: SkillCategoryData,
  ) {
    return this.content.updateSkillCategory(recordId, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Удалено' })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  remove(@id() recordId: string): Promise<void> {
    return this.content.deleteSkillCategory(recordId);
  }
}
