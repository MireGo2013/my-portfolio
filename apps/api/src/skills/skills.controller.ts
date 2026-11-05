import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkillCategoryDto } from './skill-category.dto.js';
import { SkillsService } from './skills.service.js';

@ApiTags('Контент')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Стек, сгруппированный по областям' })
  @ApiOkResponse({ type: [SkillCategoryDto] })
  list(): Promise<SkillCategoryDto[]> {
    return this.skills.list();
  }
}
