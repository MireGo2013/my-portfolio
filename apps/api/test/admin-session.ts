import type { INestApplication } from '@nestjs/common';
import { ADMIN_COOKIES, API_PREFIX } from '@portfolio/shared';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { hashPassword } from '../src/auth/passwords.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const PASSWORD = 'admin-session-e2e-password';

/**
 * Создаёт администратора и входит под ним. Возвращает заголовок Cookie
 * и функцию, которая удаляет пользователя (сессии уйдут каскадом).
 */
export async function createAdminSession(
  app: INestApplication<App>,
  email: string,
): Promise<{ cookie: string; cleanup: () => Promise<void> }> {
  const prisma = app.get(PrismaService);
  await prisma.adminUser.deleteMany({ where: { email } });
  await prisma.adminUser.create({
    data: { email, passwordHash: await hashPassword(PASSWORD) },
  });

  const login = await request(app.getHttpServer())
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password: PASSWORD })
    .expect(204);
  const access = (login.headers['set-cookie'] as unknown as string[])
    .map((line) => line.split(';')[0] ?? '')
    .find((pair) => pair.startsWith(`${ADMIN_COOKIES.access}=`));

  return {
    cookie: access ?? '',
    cleanup: async () => {
      await prisma.adminUser.deleteMany({ where: { email } });
    },
  };
}
