import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestWithIp = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

/**
 * За прокси хостинга req.ip это адрес прокси, и лимит стал бы общим на всех.
 * Заголовку можно верить, только если его выставляет сам прокси, поэтому
 * чтение включается явно. Без прокси клиент подделал бы его и обошёл лимит.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: RequestWithIp): Promise<string> {
    const realIp = req.headers['x-real-ip'];
    const useHeader =
      process.env['TRUST_X_REAL_IP'] === 'true' &&
      typeof realIp === 'string' &&
      realIp !== '';
    return super.getTracker(useHeader ? { ...req, ip: realIp } : req);
  }
}
