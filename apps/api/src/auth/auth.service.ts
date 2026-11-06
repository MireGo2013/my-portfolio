import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginCredentials } from '@portfolio/shared';
import type { AdminRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './auth.constants.js';
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
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash },
    });
    const now = Date.now();
    if (!session || session.expiresAt.getTime() <= now) {
      throw invalidSession();
    }

    const nextToken = generateRefreshToken();
    // Условие на старый хеш делает замену атомарной: из двух одновременных
    // запросов с одним токеном обновит сессию только первый
    const { count } = await this.prisma.adminSession.updateMany({
      where: { id: session.id, tokenHash },
      data: {
        tokenHash: hashToken(nextToken),
        expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
        lastUsedAt: new Date(now),
      },
    });
    if (count === 0) {
      throw invalidSession();
    }

    return {
      accessToken: await this.signAccessToken(session.userId, session.id),
      refreshToken: nextToken,
    };
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
      ...(tokens.refreshToken
        ? [{ tokenHash: hashToken(tokens.refreshToken) }]
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
