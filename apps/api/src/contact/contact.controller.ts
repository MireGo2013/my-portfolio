import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { contactMessageSchema } from '@portfolio/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { CreateContactMessageDto, ValidationErrorDto } from './contact.dto.js';
import { ClientIpThrottlerGuard } from './client-ip-throttler.guard.js';
import { ContactService } from './contact.service.js';

@ApiTags('Контакты')
@Controller('contact')
@UseGuards(ClientIpThrottlerGuard)
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Отправить сообщение через форму контактов' })
  @ApiNoContentResponse({ description: 'Сообщение принято' })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiTooManyRequestsResponse({ description: 'Превышен лимит отправок' })
  submit(
    @Body(new ZodValidationPipe(contactMessageSchema))
    body: CreateContactMessageDto,
  ): Promise<void> {
    return this.contact.submit(body);
  }
}
