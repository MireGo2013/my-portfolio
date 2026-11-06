import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import {
  AdminExperienceController,
  AdminProfileController,
  AdminProjectsController,
  AdminSkillsController,
} from './admin-content.controllers.js';
import { AdminContentService } from './admin-content.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AdminProfileController,
    AdminExperienceController,
    AdminProjectsController,
    AdminSkillsController,
  ],
  providers: [AdminContentService],
})
export class AdminContentModule {}
