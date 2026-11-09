import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginCredentials } from '@portfolio/shared';
import type { AdminRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ACCESS_TOKEN_TTL_MS,
  MFA_MAX_ATTEMPTS,
  MFA_TOKEN_TTL_MS,
  REFRESH_GRACE_MS,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants.js';
import { verifyPassword } from './passwords.js';
import { generateRefreshToken, hashToken } from './tokens.js';
import { TwoFactorService } from './two-factor/two-factor.service.js';

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

export type LoginResult =
  { kind: 'session'; tokens: AuthTokens } | { kind: 'mfa'; mfaToken: string };

/** Токен шага с кодом: пароль уже проверен, сессии ещё нет. */
type MfaTokenPayload = { sub: string; purpose: 'mfa'; cid: string };

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
/** Шаг с кодом истёк, использован или исчерпал попытки: только начать заново. */
const mfaExpired = () =>
  new UnauthorizedException({
    message: 'Начните вход заново',
    code: 'mfaExpired',
  });
const invalidSession = () =>
  new UnauthorizedException('Сессия недействительна');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  /**
   * Пароль верный. Без второго фактора — сразу сессия. Со вторым фактором —
   * только короткий токен шага с кодом: сессии ещё нет, и с одним паролем
   * в админку не попасть.
   */
  async login({ email, password }: LoginCredentials): Promise<LoginResult> {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    // Одинаковый ответ и для чужой почты, и для неверного пароля
    if (!(await verifyPassword(user?.passwordHash, password)) || !user) {
      throw invalidCredentials();
    }

    if (user.totpEnabledAt) {
      // Новый шаг с кодом отменяет прежний: в базе лежит только его id,
      // и у шага свой счётчик попыток, независимо от IP
      const challengeId = randomUUID();
      await this.prisma.adminUser.update({
        where: { id: user.id },
        data: { mfaChallengeId: challengeId, mfaAttempts: 0 },
      });
      const payload: MfaTokenPayload = {
        sub: user.id,
        purpose: 'mfa',
        cid: challengeId,
      };
      return {
        kind: 'mfa',
        mfaToken: await this.jwt.signAsync(payload, {
          expiresIn: MFA_TOKEN_TTL_MS / 1000,
        }),
      };
    }
    return { kind: 'session', tokens: await this.createSession(user.id) };
  }

  /** Второй шаг входа: токен шага с кодом плюс код из приложения или резервный. */
  async completeMfa(mfaToken: string, code: string): Promise<AuthTokens> {
    const payload = await this.jwt
      .verifyAsync<Partial<MfaTokenPayload>>(mfaToken)
      .catch(() => undefined);
    // purpose отличает этот токен от токена доступа: подсунуть один вместо
    // другого нельзя, у токена доступа нет purpose, а у этого — sid
    if (
      payload?.purpose !== 'mfa' ||
      typeof payload.sub !== 'string' ||
      typeof payload.cid !== 'string'
    ) {
      throw mfaExpired();
    }
    const { sub: userId, cid } = payload;

    // Попытка засчитывается до проверки кода и атомарно: смена IP не даёт
    // новых попыток, а параллельные запросы не проскочат мимо счётчика
    const { count } = await this.prisma.adminUser.updateMany({
      where: {
        id: userId,
        mfaChallengeId: cid,
        mfaAttempts: { lt: MFA_MAX_ATTEMPTS },
      },
      data: { mfaAttempts: { increment: 1 } },
    });
    if (count === 0) throw mfaExpired();

    if (!(await this.twoFactor.verify(userId, code))) {
      throw new UnauthorizedException({
        message: 'Неверный код',
        code: 'codeInvalid',
      });
    }

    // Шаг одноразовый: перехваченная cookie admin_mfa после входа бесполезна
    const used = await this.prisma.adminUser.updateMany({
      where: { id: userId, mfaChallengeId: cid },
      data: { mfaChallengeId: null, mfaAttempts: 0 },
    });
    if (used.count === 0) throw mfaExpired();
    return this.createSession(userId);
  }

  private async createSession(userId: string): Promise<AuthTokens> {
    const now = Date.now();
    const refreshToken = generateRefreshToken();
    const [, session] = await this.prisma.$transaction([
      // Заодно убираем истёкшие сессии, чтобы таблица не росла
      this.prisma.adminSession.deleteMany({
        where: { userId, expiresAt: { lte: new Date(now) } },
      }),
      this.prisma.adminSession.create({
        data: {
          userId,
          tokenHash: hashToken(refreshToken),
          expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
        },
      }),
    ]);

    return {
      accessToken: await this.signAccessToken(userId, session.id),
      refreshToken,
    };
  }

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
