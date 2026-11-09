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
  workInputSchema,
  reorderSchema,
  type WorkData,
  type ReorderInput,
} from '@portfolio/shared';
import { AdminOnly } from '../../auth/auth.decorators.js';
import { AdminWorkDto, AdminWorkInputDto } from './admin-content.dto.js';
import { AdminContentService } from './admin-content.service.js';
import {
  ApiRecord,
  ApiReorder,
  ApiSaveResponses,
  body,
  id,
} from './admin-content.decorators.js';

@ApiTags('Админка: контент')
@Controller('admin/content/work')
@AdminOnly()
export class AdminWorkController {
  constructor(private readonly content: AdminContentService) {}

  @Get()
  @ApiOperation({ summary: 'Коммерческие проекты в порядке показа' })
  @ApiOkResponse({ type: [AdminWorkDto] })
  list(): Promise<AdminWorkDto[]> {
    return this.content.listWork();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить проект в конец списка' })
  @ApiCreatedResponse({ type: AdminWorkDto })
  @ApiSaveResponses(AdminWorkInputDto)
  create(@body(workInputSchema) input: WorkData) {
    return this.content.createWork(input);
  }

  // Раньше :id, иначе «order» приняли бы за id
  @Put('order')
  @ApiReorder(AdminWorkDto)
  reorder(@body(reorderSchema) input: ReorderInput) {
    return this.content.reorderWork(input.ids);
  }

  @Get(':id')
  @ApiRecord(AdminWorkDto)
  get(@id() recordId: string): Promise<AdminWorkDto> {
    return this.content.getWork(recordId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Сохранить проект' })
  @ApiRecord(AdminWorkDto)
  @ApiSaveResponses(AdminWorkInputDto)
  update(@id() recordId: string, @body(workInputSchema) input: WorkData) {
    return this.content.updateWork(recordId, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Удалено' })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  remove(@id() recordId: string): Promise<void> {
    return this.content.deleteWork(recordId);
  }
}
