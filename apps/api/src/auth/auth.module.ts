import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminAuthGuard } from './admin-auth.guard.js';
import { AdminBootstrapService } from './admin-bootstrap.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SameOriginGuard } from './same-origin.guard.js';
import { TwoFactorController } from './two-factor.controller.js';
import { TwoFactorService } from './two-factor.service.js';

/** Короче этого секрет подписи можно подобрать перебором. */
const JWT_SECRET_MIN_LENGTH = 32;

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        if (secret.length < JWT_SECRET_MIN_LENGTH) {
          throw new Error(
            `JWT_SECRET должен быть не короче ${JWT_SECRET_MIN_LENGTH} символов`,
          );
        }
        // Алгоритм зафиксирован и при проверке: токен с другим alg не пройдёт
        return {
          secret,
          signOptions: { algorithm: 'HS256' },
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [
    AuthService,
    AdminAuthGuard,
    SameOriginGuard,
    AdminBootstrapService,
    TwoFactorService,
  ],
  // Другие модули админки закрывают свои эндпоинты через @AdminOnly()
  exports: [AuthService, AdminAuthGuard, SameOriginGuard],
})
export class AuthModule {}
