import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProfileDto } from './profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('Контент')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Кто я и как со мной связаться' })
  @ApiOkResponse({ type: ProfileDto })
  @ApiNotFoundResponse({ description: 'База ещё не заполнена seed-скриптом' })
  get(): Promise<ProfileDto> {
    return this.profile.get();
  }
}
