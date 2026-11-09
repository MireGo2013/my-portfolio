import { applyDecorators, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import type { ZodType } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { ValidationErrorDto } from '../../contact/contact.dto.js';
import { ReorderDto } from './admin-content.dto.js';

// Тип параметра — результат Zod: пустые пункты списков уже выброшены, пустые
// строки стали null. Swagger этот тип не видит (в рантайме его нет), поэтому
// схему тела называем ему явно через @ApiBody

export const body = (schema: ZodType) => Body(new ZodValidationPipe(schema));
export const id = () => Param('id', ParseUUIDPipe);

/** Ответы, общие для создания и сохранения записи. */
export const ApiSaveResponses = (input: new () => object) =>
  applyDecorators(
    ApiBody({ type: input }),
    ApiBadRequestResponse({ type: ValidationErrorDto }),
    ApiConflictResponse({
      type: ValidationErrorDto,
      description: 'slug занят',
    }),
  );

export const ApiReorder = (type: new () => object) =>
  applyDecorators(
    ApiOperation({ summary: 'Новый порядок записей раздела' }),
    ApiBody({ type: ReorderDto }),
    ApiOkResponse({ type: [type] }),
    ApiBadRequestResponse({ type: ValidationErrorDto }),
  );

export const ApiRecord = (type: new () => object) =>
  applyDecorators(
    ApiOkResponse({ type }),
    ApiNotFoundResponse({ description: 'Запись не найдена' }),
  );
