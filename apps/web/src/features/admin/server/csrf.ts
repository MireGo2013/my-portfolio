import { requestHost } from './api-forward';

/**
 * Защита от CSRF вторым слоем после SameSite. Оба заголовка ставит сам
 * браузер, и страница не может их подменить.
 *
 * 1. Sec-Fetch-Site — браузер прямо говорит, с того же ли сайта запрос.
 *    Прокси его не трогают, поэтому неважно, как переписан Host.
 * 2. Старый браузер без Sec-Fetch-Site: сравниваем Origin с адресом,
 *    на который пришёл браузер. Так работают и основной домен,
 *    и адреса предпросмотра Vercel.
 * 3. Нет обоих — это не браузер, и чужих cookie у него нет.
 */
export function isCrossSite(request: { headers: Headers }): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site !== null) {
    return site !== 'same-origin';
  }
  const origin = request.headers.get('origin');
  if (origin !== null) {
    try {
      // Только хост, без схемы: за прокси, который снимает TLS и не передаёт
      // X-Forwarded-Proto, схема у нас и у браузера разная, а сайт тот же
      return new URL(origin).host !== requestHost(request.headers);
    } catch {
      return true;
    }
  }
  return false;
}
