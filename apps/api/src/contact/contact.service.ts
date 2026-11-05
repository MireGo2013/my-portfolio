import { Injectable } from '@nestjs/common';
import type { ContactMessage } from '@portfolio/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { TelegramService } from './telegram.service.js';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async submit({ website, ...contact }: ContactMessage): Promise<void> {
    // Honeypot заполнен: это бот. Отвечаем как обычно, но ничего не делаем
    if (website) {
      return;
    }

    await this.prisma.contactMessage.create({ data: contact });
    await this.telegram.notifyContactMessage(contact);
  }
}
