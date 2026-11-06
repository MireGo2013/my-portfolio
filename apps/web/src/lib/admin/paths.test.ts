import { describe, expect, it } from 'vitest';
import { ADMIN_START, isAdminPath, safeNextPath } from './paths';

describe('safeNextPath', () => {
  it.each([
    ['/admin/profile', '/admin/profile'],
    ['/admin/messages?status=NEW', '/admin/messages?status=NEW'],
  ])('пропускает страницу админки %s', (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });

  it.each([
    null,
    '',
    'https://evil.example.com/admin',
    '//evil.example.com/admin',
    '/\\evil.example.com',
    '/ru/contact',
    '/administrator',
    '/admin/login',
    '/admin/api/v1/auth/me',
    'javascript:alert(1)',
  ])('не пускает %s и ведёт в начало админки', (next) => {
    expect(safeNextPath(next)).toBe(ADMIN_START);
  });
});

describe('isAdminPath', () => {
  it('отличает /admin от похожих адресов', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/cv')).toBe(true);
    expect(isAdminPath('/administrator')).toBe(false);
    expect(isAdminPath('/ru/admin')).toBe(false);
  });
});
