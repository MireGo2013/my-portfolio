import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

/**
 * Шифрование секрета TOTP для хранения в базе: AES-256-GCM.
 *
 * Хеш, как у пароля, не подходит: секрет нужен серверу целиком, чтобы
 * считать по нему коды. А в открытом виде утечка таблицы отдала бы второй
 * фактор вместе с хешем пароля.
 *
 * Ключ выводится из JWT_SECRET через HKDF с отдельной меткой: новой переменной
 * окружения не нужно, а сам JWT_SECRET для шифрования не используется. Цена:
 * смена JWT_SECRET требует заново подключить второй фактор.
 */
export class SecretBox {
  private readonly key: Buffer;

  constructor(masterSecret: string) {
    this.key = Buffer.from(
      hkdfSync('sha256', masterSecret, '', 'portfolio-admin-totp-v1', 32),
    );
  }

  /** v1:iv:tag:шифротекст в base64url. Версия — на случай смены формата. */
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return ['v1', iv, tag, encrypted]
      .map((part) =>
        typeof part === 'string' ? part : part.toString('base64url'),
      )
      .join(':');
  }

  /** GCM проверяет и целостность: подменённый шифротекст не расшифруется. */
  decrypt(box: string): string {
    const [version, iv, tag, encrypted] = box.split(':');
    if (version !== 'v1' || !iv || !tag || !encrypted) {
      throw new Error('Неизвестный формат зашифрованного секрета');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
