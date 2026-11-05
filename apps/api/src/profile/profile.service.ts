import { Injectable, NotFoundException } from '@nestjs/common';
import type { Locale } from '@portfolio/shared';
import { singleTranslation } from '../common/locale-query.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProfileDto } from './profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(locale: Locale): Promise<ProfileDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: 1 },
      select: {
        title: true,
        specialization: true,
        email: true,
        telegramUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        translations: {
          where: { locale },
          select: {
            fullName: true,
            shortName: true,
            summary: true,
            about: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не заполнен');
    }

    const { translations, ...shared } = profile;
    return { ...shared, ...singleTranslation(translations) };
  }
}
