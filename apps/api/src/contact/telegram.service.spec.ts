import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramService } from './telegram.service.js';

const TOKEN = 'secret-token';
const contact = {
  name: 'Анна',
  email: 'anna@example.com',
  message: 'Здравствуйте!',
};

function createService(env: Record<string, string>): TelegramService {
  return new TelegramService({
    get: (key: string) => env[key],
  } as unknown as ConfigService);
}

const configured = () =>
  createService({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: '42' });

function sentBody(fetchMock: ReturnType<typeof vi.fn>): {
  chat_id: string;
  text: string;
  parse_mode?: string;
} {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return JSON.parse(init.body as string);
}

describe('TelegramService', () => {
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorLog = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('отправляет обычный текст без разметки', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    await configured().notifyContactMessage(contact);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
    );
    const body = sentBody(fetchMock);
    expect(body.chat_id).toBe('42');
    expect(body.text).toContain('Анна');
    expect(body.text).toContain('anna@example.com');
    expect(body.text).toContain('Здравствуйте!');
    expect(body.parse_mode).toBeUndefined();
  });

  it('укладывает длинное сообщение в лимит Telegram', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    await configured().notifyContactMessage({
      ...contact,
      message: 'а'.repeat(5000),
    });

    expect(sentBody(fetchMock).text).toHaveLength(4096);
  });

  it('пропускает отправку, если бот не настроен', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await createService({}).notifyContactMessage(contact);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('не падает, когда Telegram отвечает ошибкой', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 403 })),
    );

    await expect(
      configured().notifyContactMessage(contact),
    ).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalledWith('Telegram ответил 403');
  });

  it('не падает при сбое сети и не пишет токен в лог', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(new TypeError(`failed: bot${TOKEN}/sendMessage`)),
    );

    await expect(
      configured().notifyContactMessage(contact),
    ).resolves.toBeUndefined();
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(TOKEN);
  });
});
