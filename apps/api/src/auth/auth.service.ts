import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginCredentials } from '@portfolio/shared';
import type { AdminRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_GRACE_MS,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants.js';
import { verifyPassword } from './passwords.js';
import { generateRefreshToken, hashToken } from './tokens.js';

/** Что лежит в токене доступа. */
type AccessTokenPayload = {
  /** id пользователя */
  sub: string;
  /** id сессии: по нему выход завершает и уже выданные токены доступа */
  sid: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/** Без refreshToken — обновился только токен доступа, cookie обновления не трогаем. */
export type RefreshResult = {
  accessToken: string;
  refreshToken?: string;
};

/** Пользователь, который прошёл проверку сессии. */
export type AuthUser = {
  id: string;
  email: string;
  role: AdminRole;
  sessionId: string;
};

const invalidCredentials = () =>
  new UnauthorizedException('Неверная почта или пароль');
const invalidSession = () =>
  new UnauthorizedException('Сессия недействительна');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, password }: LoginCredentials): Promise<AuthTokens> {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    // Одинаковый ответ и для чужой почты, и для неверного пароля
    if (!(await verifyPassword(user?.passwordHash, password)) || !user) {
      throw invalidCredentials();
    }

    const now = Date.now();
    const refreshToken = generateRefreshToken();
    const [, session] = await this.prisma.$transaction([
      // Заодно убираем истёкшие сессии, чтобы таблица не росла
      this.prisma.adminSession.deleteMany({
        where: { userId: user.id, expiresAt: { lte: new Date(now) } },
      }),
      this.prisma.adminSession.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(refreshToken),
          expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
        },
      }),
    ]);

    return {
      accessToken: await this.signAccessToken(user.id, session.id),
      refreshToken,
    };
  }

  /**
   * Выдаёт новую пару токенов, а старый токен обновления перестаёт работать
   * (rotation). Повторно предъявленный старый токен получит 401.
   */
  /**
   * Выдаёт новую пару токенов, а старый токен обновления заменяется (rotation).
   *
   * Гонка: вкладка вернулась через полчаса, и три запроса одновременно пришли
   * обновлять токен с одним и тем же T. Первый заменил T на T2. Остальные
   * со старым T не должны завершать сессию: в течение REFRESH_GRACE_MS
   * они получают новый токен доступа, а cookie обновления не трогают —
   * её уже поставил первый ответ.
   */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    const tokenHash = hashToken(refreshToken);
    const now = Date.now();
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash },
    });

    if (session && session.expiresAt.getTime() > now) {
      const nextToken = generateRefreshToken();
      // Условие на старый хеш делает замену атомарной: из двух одновременных
      // запросов с одним токеном обновит сессию только первый
      const { count } = await this.prisma.adminSession.updateMany({
        where: { id: session.id, tokenHash },
        data: {
          tokenHash: hashToken(nextToken),
          previousTokenHash: tokenHash,
          rotatedAt: new Date(now),
          expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
          lastUsedAt: new Date(now),
        },
      });
      if (count === 1) {
        return {
          accessToken: await this.signAccessToken(session.userId, session.id),
          refreshToken: nextToken,
        };
      }
      // count === 0: соседний запрос заменил токен между find и update.
      // Тогда этот токен уже «предыдущий» — проверим льготное окно ниже
    }

    const rotated = await this.prisma.adminSession.findUnique({
      where: { previousTokenHash: tokenHash },
    });
    if (
      rotated?.rotatedAt &&
      now - rotated.rotatedAt.getTime() <= REFRESH_GRACE_MS &&
      rotated.expiresAt.getTime() > now
    ) {
      return {
        accessToken: await this.signAccessToken(rotated.userId, rotated.id),
      };
    }

    throw invalidSession();
  }

  /** Удаляет сессию. Подходит любой из токенов, отсутствие обоих не ошибка. */
  async logout(tokens: {
    accessToken?: string;
    refreshToken?: string;
  }): Promise<void> {
    const sessionId = tokens.accessToken
      ? (await this.readAccessToken(tokens.accessToken))?.sid
      : undefined;
    const or = [
      ...(sessionId ? [{ id: sessionId }] : []),
      // Браузер мог ещё не получить новый токен после ротации
      ...(tokens.refreshToken
        ? [
            { tokenHash: hashToken(tokens.refreshToken) },
            { previousTokenHash: hashToken(tokens.refreshToken) },
          ]
        : []),
    ];
    if (or.length > 0) {
      await this.prisma.adminSession.deleteMany({ where: { OR: or } });
    }
  }

  /**
   * Проверяет токен доступа и что его сессия ещё есть в базе.
   * Запрос в базу делает выход мгновенным, а не через 15 минут.
   */
  async authenticate(accessToken: string): Promise<AuthUser> {
    const payload = await this.readAccessToken(accessToken);
    if (!payload) {
      throw invalidSession();
    }
    const session = await this.prisma.adminSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw invalidSession();
    }
    const { id, email, role } = session.user;
    return { id, email, role, sessionId: session.id };
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, sid: sessionId };
    return this.jwt.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
    });
  }

  /** Подпись и срок проверяет библиотека. Плохой токен даёт undefined. */
  private async readAccessToken(
    token: string,
  ): Promise<AccessTokenPayload | undefined> {
    try {
      const payload =
        await this.jwt.verifyAsync<Partial<AccessTokenPayload>>(token);
      return typeof payload.sub === 'string' && typeof payload.sid === 'string'
        ? { sub: payload.sub, sid: payload.sid }
        : undefined;
    } catch {
      return undefined;
    }
  }
}
