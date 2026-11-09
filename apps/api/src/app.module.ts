import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { AdminContentModule } from './admin/content/admin-content.module.js';
import { AdminMessagesModule } from './admin/messages/admin-messages.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ContactModule } from './contact/contact.module.js';
import { ExperienceModule } from './content/experience/experience.module.js';
import { HealthModule } from './health/health.module.js';
import { ProfileModule } from './content/profile/profile.module.js';
import { ProjectsModule } from './content/projects/projects.module.js';
import { SkillsModule } from './content/skills/skills.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Лимит по умолчанию для эндпоинтов с ClientIpThrottlerGuard. Форма контактов
    // и вход задают свои лимиты через @Throttle, и счётчики у них раздельные
    ThrottlerModule.forRoot([{ ttl: minutes(1), limit: 60 }]),
    HealthModule,
    ProfileModule,
    ExperienceModule,
    ProjectsModule,
    SkillsModule,
    ContactModule,
    AuthModule,
    AdminMessagesModule,
    AdminContentModule,
  ],
})
export class AppModule {}
