import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  messagesQuerySchema,
  updateMessageStatusSchema,
  type MessagesQuery,
} from '@portfolio/shared';
import { AdminOnly } from '../auth/auth.decorators.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ValidationErrorDto } from '../contact/contact.dto.js';
import {
  MessageCountsDto,
  MessageDto,
  MessagePageDto,
  MessagesQueryDto,
  UpdateMessageStatusDto,
} from './admin-messages.dto.js';
import { AdminMessagesService } from './admin-messages.service.js';

@ApiTags('Админка: сообщения')
@Controller('admin/messages')
@AdminOnly()
export class AdminMessagesController {
  constructor(private readonly messages: AdminMessagesService) {}

  @Get()
  @ApiOperation({
    summary: 'Сообщения с фильтрами, поиском, сортировкой и пагинацией',
  })
  @ApiOkResponse({ type: MessagePageDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  list(
    // Тип для Swagger, значение после Zod: строки уже приведены к числам
    @Query(new ZodValidationPipe(messagesQuerySchema)) query: MessagesQueryDto,
  ): Promise<MessagePageDto> {
    return this.messages.list(query as MessagesQuery);
  }

  // Объявлен раньше :id, иначе Express принял бы «counts» за id
  @Get('counts')
  @ApiOperation({ summary: 'Сколько сообщений в каждом статусе' })
  @ApiOkResponse({ type: MessageCountsDto })
  counts(): Promise<MessageCountsDto> {
    return this.messages.counts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Одно сообщение' })
  @ApiOkResponse({ type: MessageDto })
  @ApiNotFoundResponse({ description: 'Сообщение не найдено' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<MessageDto> {
    return this.messages.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Сменить статус сообщения' })
  @ApiOkResponse({ type: MessageDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiNotFoundResponse({ description: 'Сообщение не найдено' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateMessageStatusSchema))
    body: UpdateMessageStatusDto,
  ): Promise<MessageDto> {
    return this.messages.updateStatus(id, body.status);
  }
}
