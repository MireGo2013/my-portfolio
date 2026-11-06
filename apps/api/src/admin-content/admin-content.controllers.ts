import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  experienceInputSchema,
  profileInputSchema,
  projectInputSchema,
  reorderSchema,
  skillCategoryInputSchema,
  type ExperienceData,
  type ProfileData,
  type ProjectData,
  type ReorderInput,
  type SkillCategoryData,
} from '@portfolio/shared';
import type { ZodType } from 'zod';
import { AdminOnly } from '../auth/auth.decorators.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ValidationErrorDto } from '../contact/contact.dto.js';
import {
  AdminExperienceDto,
  AdminExperienceInputDto,
  AdminProfileDto,
  AdminProjectDto,
  AdminProjectInputDto,
  AdminSkillCategoryDto,
  AdminSkillCategoryInputDto,
  ReorderDto,
} from './admin-content.dto.js';
import { AdminContentService } from './admin-content.service.js';

// Тип параметра — результат Zod: пустые пункты списков уже выброшены, пустые
// строки стали null. Swagger этот тип не видит (в рантайме его нет), поэтому
// схему тела называем ему явно через @ApiBody

const body = (schema: ZodType) => Body(new ZodValidationPipe(schema));
const id = () => Param('id', ParseUUIDPipe);

/** Ответы, общие для создания и сохранения записи. */
const ApiSaveResponses = (input: new () => object) =>
  applyDecorators(
    ApiBody({ type: input }),
    ApiBadRequestResponse({ type: ValidationErrorDto }),
    ApiConflictResponse({
      type: ValidationErrorDto,
      description: 'slug занят',
    }),
  );

const ApiReorder = (type: new () => object) =>
  applyDecorators(
    ApiOperation({ summary: 'Новый порядок записей раздела' }),
    ApiBody({ type: ReorderDto }),
    ApiOkResponse({ type: [type] }),
    ApiBadRequestResponse({ type: ValidationErrorDto }),
  );

const ApiRecord = (type: new () => object) =>
  applyDecorators(
    ApiOkResponse({ type }),
    ApiNotFoundResponse({ description: 'Запись не найдена' }),
  );

@ApiTags('Админка: контент')
@Controller('admin/content/profile')
@AdminOnly()
export class AdminProfileController {
  constructor(private readonly content: AdminContentService) {}

  @Get()
  @ApiOperation({ summary: 'Профиль на всех языках' })
  @ApiRecord(AdminProfileDto)
  get(): Promise<AdminProfileDto> {
    return this.content.getProfile();
  }

  @Put()
  @ApiOperation({ summary: 'Сохранить профиль' })
  @ApiOkResponse({ type: AdminProfileDto })
  @ApiBody({ type: AdminProfileDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  update(@body(profileInputSchema) input: ProfileData) {
    return this.content.updateProfile(input);
  }
}

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
