import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SkillsController } from './skills.controller.js';
import { SkillsService } from './skills.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
