import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestWithIp = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

/** Заголовки, которыми сервер сайта сообщает адрес посетителя. */
export const PROXY_HEADERS = {
  secret: 'x-proxy-secret',
  clientIp: 'x-client-ip',
} as const;

function header(req: RequestWithIp, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Сравнение за одинаковое время: по скорости ответа секрет не подобрать. */
function sameSecret(given: string, expected: string): boolean {
  // Хеши одной длины: timingSafeEqual требует равных буферов
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/**
 * Откуда пришёл запрос, для лимита. Три случая:
 *
 * 1. Админка ходит через сервер сайта, и для API все её посетители выглядели бы
 *    одним адресом. Сервер сайта присылает настоящий IP вместе с PROXY_SECRET,
 *    и только с верным секретом IP принимается. Иначе любой прислал бы чужой адрес.
 * 2. За прокси хостинга req.ip это адрес прокси. X-Real-IP выставляет сам прокси,
 *    поэтому чтение включается явно через TRUST_X_REAL_IP.
 * 3. Иначе req.ip.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: RequestWithIp): Promise<string> {
    return super.getTracker({ ...req, ip: this.clientIp(req) });
  }

  private clientIp(req: RequestWithIp): string | undefined {
    const proxySecret = process.env['PROXY_SECRET'];
    const givenSecret = header(req, PROXY_HEADERS.secret);
    const forwardedIp = header(req, PROXY_HEADERS.clientIp);
    if (
      proxySecret &&
      givenSecret &&
      forwardedIp &&
      isIP(forwardedIp) !== 0 &&
      sameSecret(givenSecret, proxySecret)
    ) {
      return forwardedIp;
    }

    const realIp = header(req, 'x-real-ip');
    if (process.env['TRUST_X_REAL_IP'] === 'true' && realIp) {
      return realIp;
    }
    return req.ip;
  }
}
