import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthDto } from './health.dto.js';

@ApiTags('Служебное')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка работы API и связи с базой' })
  @ApiOkResponse({ type: HealthDto })
  @ApiServiceUnavailableResponse({ description: 'База данных недоступна' })
  async check(): Promise<HealthDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('База данных недоступна', error);
      throw new ServiceUnavailableException('База данных недоступна');
    }
    return { status: 'ok', database: 'up' };
  }
}
