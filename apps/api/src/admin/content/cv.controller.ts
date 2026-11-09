import { Controller, Delete, Get, Param, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  cvUrlSchema,
  LOCALES,
  type CvUrlInput,
  type Locale,
} from '@portfolio/shared';
import { z } from 'zod';
import { AdminOnly } from '../../auth/auth.decorators.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { ValidationErrorDto } from '../../contact/contact.dto.js';
import { AdminCvDto, SetCvDto } from './admin-content.dto.js';
import { AdminContentService } from './admin-content.service.js';
import { body } from './admin-content.decorators.js';

const localeParam = () =>
  Param('locale', new ZodValidationPipe(z.enum(LOCALES), 'locale'));

/** Сам файл живёт в Vercel Blob, сюда сайт сообщает его адрес. */
class AdminCvResultDto extends AdminCvDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Прежний адрес: сайт удалит старый файл из хранилища',
  })
  previous!: string | null;
}

@ApiTags('Админка: контент')
@Controller('admin/content/cv')
@AdminOnly()
export class AdminCvController {
  constructor(private readonly content: AdminContentService) {}

  @Get()
  @ApiOperation({ summary: 'Адреса загруженных резюме на каждом языке' })
  @ApiOkResponse({ type: AdminCvDto })
  get(): Promise<AdminCvDto> {
    return this.content.getCv();
  }

  @Put(':locale')
  @ApiOperation({ summary: 'Запомнить адрес загруженного резюме' })
  @ApiParam({ name: 'locale', enum: LOCALES })
  @ApiBody({ type: SetCvDto })
  @ApiOkResponse({ type: AdminCvResultDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  set(@localeParam() locale: Locale, @body(cvUrlSchema) input: CvUrlInput) {
    return this.content.setCv(locale, input.url);
  }

  @Delete(':locale')
  @ApiOperation({ summary: 'Вернуть резюме из сборки сайта' })
  @ApiParam({ name: 'locale', enum: LOCALES })
  @ApiOkResponse({ type: AdminCvResultDto })
  remove(@localeParam() locale: Locale) {
    return this.content.setCv(locale, null);
  }
}
