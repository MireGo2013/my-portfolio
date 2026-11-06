import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { hours, Throttle } from '@nestjs/throttler';
import { contactMessageSchema } from '@portfolio/shared';
import { ClientIpThrottlerGuard } from '../common/client-ip-throttler.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { CreateContactMessageDto, ValidationErrorDto } from './contact.dto.js';
import { ContactService } from './contact.service.js';

/** Сколько сообщений можно отправить с одного IP за час. */
export const CONTACT_RATE_LIMIT = 5;

@ApiTags('Контакты')
@Controller('contact')
@UseGuards(ClientIpThrottlerGuard)
@Throttle({ default: { ttl: hours(1), limit: CONTACT_RATE_LIMIT } })
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
