import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { WorkController } from './work.controller.js';
import { WorkService } from './work.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [WorkController],
  providers: [WorkService],
})
export class WorkModule {}
