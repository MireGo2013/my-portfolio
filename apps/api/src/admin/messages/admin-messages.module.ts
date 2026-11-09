import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AdminMessagesController } from './admin-messages.controller.js';
import { AdminMessagesService } from './admin-messages.service.js';

@Module({
  // AuthModule даёт guards для @AdminOnly()
  imports: [PrismaModule, AuthModule],
  controllers: [AdminMessagesController],
  providers: [AdminMessagesService],
})
export class AdminMessagesModule {}
