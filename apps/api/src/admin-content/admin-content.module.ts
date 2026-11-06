import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import {
  AdminCvController,
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
    AdminCvController,
  ],
  providers: [AdminContentService],
})
export class AdminContentModule {}
