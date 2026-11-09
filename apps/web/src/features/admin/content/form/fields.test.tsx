// @vitest-environment jsdom
import { zodResolver } from '@hookform/resolvers/zod';
import { skillCategoryInputSchema } from '@portfolio/shared';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListField, Localized, TextField } from './fields';

afterEach(cleanup);

function SkillsForm({ onValid }: { onValid: (values: unknown) => void }) {
  const form = useForm({
    resolver: zodResolver(skillCategoryInputSchema),
    defaultValues: {
      slug: 'testing',
      translations: { ru: { name: 'Тесты' }, en: { name: 'Testing' } },
      skills: ['Vitest'],
    },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void form.handleSubmit(onValid)(event)}>
        <TextField name="slug" label="Slug" />
        <Localized>
          {(_locale, t) => <TextField name={`${t}.name`} label="Название" />}
        </Localized>
        <ListField name="skills" label="Навыки" />
        <button type="submit">Сохранить</button>
      </form>
    </FormProvider>
  );
}

describe('поля формы контента', () => {
  it('список — пункт на строку, пустые строки выбрасываются при отправке', async () => {
    const onValid = vi.fn();
    const user = userEvent.setup();
    render(<SkillsForm onValid={onValid} />);

    const skills = screen.getByLabelText<HTMLTextAreaElement>('Навыки');
    expect(skills.value).toBe('Vitest');
    await user.type(skills, '{Enter}{Enter}Playwright{Enter}');
    // Пока человек печатает, пустые строки остаются на месте
    expect(skills.value).toBe('Vitest\n\nPlaywright\n');

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ skills: ['Vitest', 'Playwright'] }),
      expect.anything(),
    );
  });

  it('ошибки показывает по-русски у нужного поля и языка', async () => {
    const user = userEvent.setup();
    render(<SkillsForm onValid={vi.fn()} />);

    await user.clear(screen.getByLabelText('Slug'));
    await user.type(screen.getByLabelText('Slug'), 'Bad Slug');
    const [, en] = screen.getAllByLabelText('Название');
    await user.clear(en!);
    await user.clear(screen.getByLabelText('Навыки'));
    await user.type(screen.getByLabelText('Навыки'), 'MSW{Enter}msw');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(
      await screen.findByText(
        'Только латиница в нижнем регистре, цифры и дефисы',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Заполните поле')).toBeTruthy();
    expect(en!.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Есть повторы')).toBeTruthy();
  });
});
