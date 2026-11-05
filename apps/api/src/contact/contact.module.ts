import { Module } from '@nestjs/common';
import { hours, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';
import { TelegramService } from './telegram.service.js';

/** Сколько сообщений можно отправить с одного IP за час. */
export const CONTACT_RATE_LIMIT = 5;

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: hours(1), limit: CONTACT_RATE_LIMIT }]),
  ],
  controllers: [ContactController],
  providers: [ContactService, TelegramService],
})
export class ContactModule {}
