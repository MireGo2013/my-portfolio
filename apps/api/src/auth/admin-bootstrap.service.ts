import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loginSchema } from '@portfolio/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { ADMIN_PASSWORD_MIN_LENGTH } from './auth.constants.js';
import { hashPassword } from './passwords.js';

/**
 * Создаёт первого администратора из ADMIN_EMAIL и ADMIN_PASSWORD, когда в базе
 * ещё нет ни одного. Дальше переменные ни на что не влияют: смена пароля в них
 * не меняет пароль в базе, и после первого запуска их можно удалить.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.prisma.adminUser.count()) > 0) {
      return;
    }

    const parsed = loginSchema.safeParse({
      email: this.config.get<string>('ADMIN_EMAIL'),
      password: this.config.get<string>('ADMIN_PASSWORD'),
    });
    // Без администратора сайт работает, просто в админку никто не войдёт.
    // Поэтому ошибка в логе, а не падение API вместе с формой контактов
    if (!parsed.success) {
      this.logger.warn(
        'Администратора нет: задайте ADMIN_EMAIL и ADMIN_PASSWORD',
      );
      return;
    }
    const { email, password } = parsed.data;
    if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
      this.logger.error(
        `ADMIN_PASSWORD короче ${ADMIN_PASSWORD_MIN_LENGTH} символов, администратор не создан`,
      );
      return;
    }

    // upsert, а не create: два экземпляра API могут стартовать одновременно
    await this.prisma.adminUser.upsert({
      where: { email },
      create: { email, passwordHash: await hashPassword(password) },
      update: {},
    });
    this.logger.log(`Создан администратор ${email}`);
  }
}
