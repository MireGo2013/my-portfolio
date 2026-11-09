import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Locale } from '@portfolio/shared';
import { ApiLocaleQuery, LocaleQuery } from '../../common/locale-query.js';
import { WorkDto } from './work.dto.js';
import { WorkService } from './work.service.js';

@ApiTags('Контент')
@Controller('work')
export class WorkController {
  constructor(private readonly work: WorkService) {}

  @Get()
  @ApiLocaleQuery()
  @ApiOperation({ summary: 'Опыт работы в порядке показа на сайте' })
  @ApiOkResponse({ type: [WorkDto] })
  list(@LocaleQuery() locale: Locale): Promise<WorkDto[]> {
    return this.work.list(locale);
  }
}
