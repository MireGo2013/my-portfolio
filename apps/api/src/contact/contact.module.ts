import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';
import { TelegramService } from './telegram.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ContactController],
  providers: [ContactService, TelegramService],
})
export class ContactModule {}
