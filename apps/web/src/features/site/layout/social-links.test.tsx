// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ru } from '@/i18n/dictionaries/ru';
import { SideRails, SiteFooter, SocialList } from './social-links';

const contacts = {
  email: 'test@example.com',
  githubUrl: 'https://github.com/test',
  telegramUrl: 'https://t.me/test',
  linkedinUrl: 'https://www.linkedin.com/in/test',
};

afterEach(cleanup);

describe.each([
  ['SideRails', SideRails],
  ['SiteFooter', SiteFooter],
])('%s', (_name, Component) => {
  it('ведёт на GitHub, Telegram, LinkedIn и почту', () => {
    render(<Component contacts={contacts} dictionary={ru.social} />);

    const href = (name: string) =>
      screen.getByRole('link', { name }).getAttribute('href');

    expect(href('GitHub')).toBe(contacts.githubUrl);
    expect(href('Telegram')).toBe(contacts.telegramUrl);
    expect(href('LinkedIn')).toBe(contacts.linkedinUrl);
    expect(href(contacts.email)).toBe(`mailto:${contacts.email}`);
  });
});

describe('SocialList', () => {
  it('без emailIconClassName не показывает почту', () => {
    render(<SocialList contacts={contacts} className="" />);

    expect(screen.queryByRole('link', { name: contacts.email })).toBeNull();
  });

  it('с emailIconClassName добавляет иконку почты с классом', () => {
    render(
      <SocialList
        contacts={contacts}
        className=""
        emailIconClassName="lg:hidden"
      />,
    );

    const mail = screen.getByRole('link', { name: contacts.email });
    expect(mail.getAttribute('href')).toBe(`mailto:${contacts.email}`);
    expect(mail.closest('li')?.className).toBe('lg:hidden');
  });
});
