import { describe, expect, it } from 'vitest';
import { SecretBox } from './secret-box.js';

describe('SecretBox', () => {
  const box = new SecretBox('a'.repeat(48));

  it('расшифровывает то, что зашифровал, а шифротекст каждый раз новый', () => {
    const first = box.encrypt('JBSWY3DPEHPK3PXP');
    const second = box.encrypt('JBSWY3DPEHPK3PXP');

    expect(first).not.toBe(second); // новый IV на каждое шифрование
    expect(first).not.toContain('JBSWY3DPEHPK3PXP');
    expect(box.decrypt(first)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('подменённый шифротекст не расшифровывается', () => {
    const [version, iv, tag, data = ''] = box.encrypt('secret').split(':');
    const flipped = (data[0] === 'A' ? 'B' : 'A') + data.slice(1);

    expect(() => box.decrypt([version, iv, tag, flipped].join(':'))).toThrow();
  });

  it('с другим главным секретом не расшифровывается', () => {
    const other = new SecretBox('b'.repeat(48));

    expect(() => other.decrypt(box.encrypt('secret'))).toThrow();
  });
});
