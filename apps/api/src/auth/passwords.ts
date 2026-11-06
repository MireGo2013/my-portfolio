import { hash, verify } from 'argon2';

/** Argon2id с параметрами библиотеки по умолчанию: соль генерируется сама. */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

// Хеш случайной строки. Проверка с ним идёт, когда пользователя нет:
// иначе ответ без хеширования приходил бы быстрее и выдавал, какие адреса есть в базе
let dummyHash: Promise<string> | undefined;

/** Сравнивает пароль с хешем. Без хеша тратит то же время и возвращает false. */
export async function verifyPassword(
  passwordHash: string | undefined,
  password: string,
): Promise<boolean> {
  if (passwordHash === undefined) {
    dummyHash ??= hash(crypto.randomUUID());
    await verify(await dummyHash, password);
    return false;
  }
  return verify(passwordHash, password);
}
