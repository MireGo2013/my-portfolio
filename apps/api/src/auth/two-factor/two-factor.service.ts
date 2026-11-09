import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SecretBox } from './secret-box.js';
import { hashToken } from '../tokens.js';
import {
  base32Encode,
  generateTotpSecret,
  otpauthUrl,
  verifyTotp,
} from './totp.js';

export const BACKUP_CODE_COUNT = 10;

/** Резервный код: 10 символов base32 = 50 бит, группами ABCD-EFGH-JK. */
function generateBackupCode(): string {
  const raw = base32Encode(randomBytes(7)).slice(0, 10);
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}

/** Без дефисов, пробелов и регистра: «abcd efgh jk» — тот же код. */
function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Код случайный и одноразовый, перебор по хешу бессмыслен, поэтому
 * хватает SHA-256, как у токена обновления.
 */
function hashBackupCode(code: string): string {
  return hashToken(normalizeBackupCode(code));
}

const invalidCode = () =>
  new BadRequestException({
    message: 'Неверный код',
    errors: { code: ['codeInvalid'] },
  });

@Injectable()
export class TwoFactorService {
  private readonly box: SecretBox;
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.box = new SecretBox(config.getOrThrow<string>('JWT_SECRET'));
  }

  /** Одним запросом: включён ли фактор и сколько резервных кодов осталось. */
  async status(userId: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: userId },
      select: {
        totpEnabledAt: true,
        _count: { select: { backupCodes: { where: { usedAt: null } } } },
      },
    });
    const enabled = user.totpEnabledAt !== null;
    return {
      enabled,
      backupCodesLeft: enabled ? user._count.backupCodes : 0,
    };
  }

  /**
   * Первый шаг подключения: новый секрет ждёт подтверждения кодом.
   * Пока не подтверждён, вход работает как раньше — так нельзя запереть
   * себя, отсканировав QR не в то приложение.
   */
  async startSetup(userId: string, email: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: userId },
      select: { totpEnabledAt: true },
    });
    if (user.totpEnabledAt) {
      throw new ConflictException('Второй фактор уже включён');
    }
    const secret = generateTotpSecret();
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { totpPendingSecret: this.box.encrypt(secret) },
    });
    return { secret, otpauthUrl: otpauthUrl(secret, email) };
  }

  /**
   * Второй шаг: код из приложения доказывает, что секрет туда попал.
   * Включаем, выдаём резервные коды (показываются один раз) и завершаем
   * остальные сессии: войти без кода больше нельзя нигде.
   */
  async enable(userId: string, sessionId: string, code: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: userId },
      select: { totpPendingSecret: true, totpEnabledAt: true },
    });
    if (user.totpEnabledAt) {
      throw new ConflictException('Второй фактор уже включён');
    }
    if (!user.totpPendingSecret) {
      throw new BadRequestException('Сначала начните подключение');
    }
    const step = verifyTotp(this.box.decrypt(user.totpPendingSecret), code);
    if (step === null) throw invalidCode();

    const backupCodes = Array.from(
      { length: BACKUP_CODE_COUNT },
      generateBackupCode,
    );
    const pendingSecret = user.totpPendingSecret;
    await this.prisma.$transaction(async (tx) => {
      // Условие «ещё не включён и секрет тот же» внутри UPDATE: из двух
      // одновременных включений пройдёт одно. Иначе второе стёрло бы
      // резервные коды первого, которые тот уже показал как «единственные»
      const { count } = await tx.adminUser.updateMany({
        where: {
          id: userId,
          totpEnabledAt: null,
          totpPendingSecret: pendingSecret,
        },
        data: {
          totpSecret: pendingSecret,
          totpPendingSecret: null,
          totpEnabledAt: new Date(),
          totpLastStep: step,
        },
      });
      if (count === 0) {
        throw new ConflictException('Второй фактор уже включён');
      }
      await tx.adminBackupCode.deleteMany({ where: { userId } });
      await tx.adminBackupCode.createMany({
        data: backupCodes.map((backup) => ({
          userId,
          codeHash: hashBackupCode(backup),
        })),
      });
      await tx.adminSession.deleteMany({
        where: { userId, id: { not: sessionId } },
      });
    });
    return { backupCodes };
  }

  /** Отключение тоже требует кода: украденной сессии мало, чтобы снять защиту. */
  async disable(userId: string, code: string): Promise<void> {
    if (!(await this.verify(userId, code))) throw invalidCode();
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: userId },
        data: {
          totpSecret: null,
          totpPendingSecret: null,
          totpEnabledAt: null,
          totpLastStep: null,
        },
      }),
      this.prisma.adminBackupCode.deleteMany({ where: { userId } }),
    ]);
  }

  /**
   * Код из приложения или резервный. Оба одноразовые: шаг TOTP сдвигается
   * атомарно (тот же код второй раз не пройдёт, даже если два запроса
   * пришли одновременно), резервный код помечается использованным.
   */
  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    });
    if (!user?.totpSecret) return false;

    // Без секрета коды из приложения не проверяем вовсе. Пустой ключ
    // недопустим: HMAC с ним посчитает любой, и код подошёл бы у каждого
    const secret = this.decryptOrNull(user.totpSecret);
    const step = secret === null ? null : verifyTotp(secret, code.trim());
    if (step !== null) {
      const { count } = await this.prisma.adminUser.updateMany({
        where: {
          id: userId,
          OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
        },
        data: { totpLastStep: step },
      });
      return count === 1;
    }

    const { count } = await this.prisma.adminBackupCode.updateMany({
      where: { userId, codeHash: hashBackupCode(code), usedAt: null },
      data: { usedAt: new Date() },
    });
    return count === 1;
  }

  /**
   * Секрет не расшифровался — скорее всего, сменили JWT_SECRET. Это не повод
   * для 500: резервные коды хранятся хешами, не зависят от ключа и нужны
   * как раз для такого случая. Войти по ним и заново подключить фактор.
   */
  private decryptOrNull(box: string): string | null {
    try {
      return this.box.decrypt(box);
    } catch (error) {
      this.logger.error(
        'Секрет второго фактора не расшифровался: сменился JWT_SECRET? Войдите резервным кодом и подключите фактор заново',
        error,
      );
      return null;
    }
  }
}
