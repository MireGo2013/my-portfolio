import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProfileDto } from './profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<ProfileDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: 1 },
      select: {
        fullName: true,
        title: true,
        specialization: true,
        summary: true,
        email: true,
        telegramUrl: true,
        githubUrl: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не заполнен');
    }
    return profile;
  }
}
