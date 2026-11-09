import { Controller, Get, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { profileInputSchema, type ProfileData } from '@portfolio/shared';
import { AdminOnly } from '../../auth/auth.decorators.js';
import { ValidationErrorDto } from '../../contact/contact.dto.js';
import { AdminProfileDto } from './admin-content.dto.js';
import { AdminContentService } from './admin-content.service.js';
import { ApiRecord, body } from './admin-content.decorators.js';

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
