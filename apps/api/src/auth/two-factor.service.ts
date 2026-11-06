import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretBox } from './secret-box.js';
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
  return createHash('sha256').update(normalizeBackupCode(code)).digest('hex');
}

const invalidCode = () =>
  new BadRequestException({
    message: 'Неверный код',
    errors: { code: ['codeInvalid'] },
  });

@Injectable()
export class TwoFactorService {
  private readonly box: SecretBox;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.box = new SecretBox(config.getOrThrow<string>('JWT_SECRET'));
  }

  async status(userId: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: userId },
      select: { totpEnabledAt: true },
    });
    const backupCodesLeft = await this.prisma.adminBackupCode.count({
      where: { userId, usedAt: null },
    });
    return {
      enabled: user.totpEnabledAt !== null,
      backupCodesLeft: user.totpEnabledAt ? backupCodesLeft : 0,
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
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: userId },
        data: {
          totpSecret: user.totpPendingSecret,
          totpPendingSecret: null,
          totpEnabledAt: new Date(),
          totpLastStep: step,
        },
      }),
      this.prisma.adminBackupCode.deleteMany({ where: { userId } }),
      this.prisma.adminBackupCode.createMany({
        data: backupCodes.map((backup) => ({
          userId,
          codeHash: hashBackupCode(backup),
        })),
      }),
      this.prisma.adminSession.deleteMany({
        where: { userId, id: { not: sessionId } },
      }),
    ]);
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

  async isEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { totpEnabledAt: true },
    });
    return Boolean(user?.totpEnabledAt);
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

    const step = verifyTotp(this.box.decrypt(user.totpSecret), code.trim());
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
}
