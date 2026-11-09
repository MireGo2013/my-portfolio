import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AdminCvController } from './cv.controller.js';
import { AdminExperienceController } from './experience.controller.js';
import { AdminProfileController } from './profile.controller.js';
import { AdminProjectsController } from './projects.controller.js';
import { AdminSkillsController } from './skills.controller.js';
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
