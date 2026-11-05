import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExperienceDto } from './experience.dto.js';
import { ExperienceService } from './experience.service.js';

@ApiTags('Контент')
@Controller('experience')
export class ExperienceController {
  constructor(private readonly experience: ExperienceService) {}

  @Get()
  @ApiOperation({ summary: 'Опыт работы в порядке показа на сайте' })
  @ApiOkResponse({ type: [ExperienceDto] })
  list(): Promise<ExperienceDto[]> {
    return this.experience.list();
  }
}
