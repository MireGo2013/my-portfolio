import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Ограничение Telegram Bot API на длину текста сообщения. */
const TELEGRAM_TEXT_LIMIT = 4096;
const REQUEST_TIMEOUT_MS = 5000;

export interface ContactNotification {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string | undefined;
  private readonly chatId: string | undefined;

  constructor(config: ConfigService) {
    this.token = config.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = config.get<string>('TELEGRAM_CHAT_ID');
  }

  /**
   * Сообщение уже в базе, поэтому сбой уведомления не должен ломать ответ
   * пользователю: метод никогда не бросает ошибку, а только пишет в лог.
   */
  async notifyContactMessage(contact: ContactNotification): Promise<void> {
    if (!this.token || !this.chatId) {
      this.logger.warn('Telegram не настроен: уведомление пропущено');
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Без parse_mode: текст пользователя не должен разбираться как разметка
          body: JSON.stringify({
            chat_id: this.chatId,
            text: this.formatText(contact),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

      if (!response.ok) {
        this.logger.error(`Telegram ответил ${response.status}`);
      }
    } catch (error) {
      // Только имя ошибки: адрес запроса содержит токен, его нельзя писать в лог
      const reason = error instanceof Error ? error.name : 'неизвестная ошибка';
      this.logger.error(`Не удалось отправить уведомление: ${reason}`);
    }
  }

  private formatText({ name, email, message }: ContactNotification): string {
    const text = `Новое сообщение с сайта\n\nОт: ${name}\nEmail: ${email}\n\n${message}`;
    return text.length > TELEGRAM_TEXT_LIMIT
      ? `${text.slice(0, TELEGRAM_TEXT_LIMIT - 1)}…`
      : text;
  }
}
