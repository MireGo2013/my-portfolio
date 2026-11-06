import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MESSAGE_PAGE_SIZES,
  MESSAGE_SORT_FIELDS,
  MESSAGE_STATUSES,
  MESSAGES_QUERY_LIMITS,
  SORT_ORDERS,
  type MessageSortField,
  type MessageStatus,
  type SortOrder,
} from '@portfolio/shared';

// Проверку выполняют Zod-схемы из @portfolio/shared, классы описывают контракт

const statusProperty = {
  enum: MESSAGE_STATUSES,
  enumName: 'MessageStatus',
} as const;

export class MessagesQueryDto {
  @ApiPropertyOptional({ ...statusProperty, description: 'Без него — все' })
  status?: MessageStatus;

  @ApiPropertyOptional({
    maxLength: MESSAGES_QUERY_LIMITS.searchMax,
    description: 'Поиск по имени, почте и тексту без учёта регистра',
  })
  q?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Создано не раньше этого момента (включительно)',
  })
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Создано раньше этого момента (не включительно)',
  })
  to?: string;

  @ApiPropertyOptional({ enum: MESSAGE_SORT_FIELDS, default: 'createdAt' })
  sort?: MessageSortField;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  order?: SortOrder;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ type: Number, enum: MESSAGE_PAGE_SIZES, default: 20 })
  pageSize?: number;
}

export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Анна' })
  name!: string;

  @ApiProperty({ format: 'email', example: 'anna@example.com' })
  email!: string;

  @ApiProperty({ example: 'Здравствуйте! Хотим обсудить вакансию.' })
  message!: string;

  @ApiProperty(statusProperty)
  status!: MessageStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class MessagePageDto {
  @ApiProperty({ type: [MessageDto] })
  items!: MessageDto[];

  @ApiProperty({ description: 'Сколько сообщений подходит под фильтры' })
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty({ description: 'Не меньше 1, даже если сообщений нет' })
  pageCount!: number;
}

export class MessageCountsDto {
  @ApiProperty()
  NEW!: number;

  @ApiProperty()
  READ!: number;

  @ApiProperty()
  REPLIED!: number;

  @ApiProperty()
  ARCHIVED!: number;

  @ApiProperty()
  SPAM!: number;

  @ApiProperty({ description: 'Всего, во всех статусах' })
  total!: number;
}

export class UpdateMessageStatusDto {
  @ApiProperty(statusProperty)
  status!: MessageStatus;
}
