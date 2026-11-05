import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONTACT_LIMITS } from '@portfolio/shared';

// Проверку выполняет Zod-схема из @portfolio/shared. Эти классы описывают
// контракт для OpenAPI, откуда фронт получает типы.

export class CreateContactMessageDto {
  @ApiProperty({
    minLength: CONTACT_LIMITS.nameMin,
    maxLength: CONTACT_LIMITS.nameMax,
    example: 'Анна',
  })
  name!: string;

  @ApiProperty({
    format: 'email',
    maxLength: CONTACT_LIMITS.emailMax,
    example: 'anna@example.com',
  })
  email!: string;

  @ApiProperty({
    minLength: CONTACT_LIMITS.messageMin,
    maxLength: CONTACT_LIMITS.messageMax,
    example: 'Здравствуйте! Хотим обсудить вакансию.',
  })
  message!: string;

  @ApiPropertyOptional({
    maxLength: CONTACT_LIMITS.honeypotMax,
    description: 'Защита от ботов: должно оставаться пустым',
  })
  website?: string;
}

export class ValidationErrorDto {
  @ApiProperty({ example: 'Ошибка валидации' })
  message!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: { email: ['emailInvalid'] },
  })
  errors!: Record<string, string[]>;
}
