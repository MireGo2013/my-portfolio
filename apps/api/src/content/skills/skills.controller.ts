import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Locale } from '@portfolio/shared';
import { ApiLocaleQuery, LocaleQuery } from '../../common/locale-query.js';
import { SkillCategoryDto } from './skill-category.dto.js';
import { SkillsService } from './skills.service.js';

@ApiTags('Контент')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @ApiLocaleQuery()
  @ApiOperation({ summary: 'Стек, сгруппированный по областям' })
  @ApiOkResponse({ type: [SkillCategoryDto] })
  list(@LocaleQuery() locale: Locale): Promise<SkillCategoryDto[]> {
    return this.skills.list(locale);
  }
}
