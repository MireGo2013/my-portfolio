import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Locale } from '@portfolio/shared';
import { ApiLocaleQuery, LocaleQuery } from '../common/locale-query.js';
import { ExperienceDto } from './experience.dto.js';
import { ExperienceService } from './experience.service.js';

@ApiTags('Контент')
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experience: ExperienceService) {}

  @Get()
  @ApiLocaleQuery()
  @ApiOperation({ summary: 'Опыт работы в порядке показа на сайте' })
  @ApiOkResponse({ type: [ExperienceDto] })
  list(@LocaleQuery() locale: Locale): Promise<ExperienceDto[]> {
    return this.experience.list(locale);
  }
}
