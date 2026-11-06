// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchBox } from './messages-view';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function type(input: HTMLInputElement, value: string) {
  act(() => {
    // Так React узнаёт о вводе: событие input с новым значением
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('SearchBox', () => {
  it('не теряет буквы, допечатанные, пока адрес обновлялся', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBox value="" onSearch={onSearch} />);
    const input = screen.getByLabelText<HTMLInputElement>('Поиск');

    type(input, 'ab');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenLastCalledWith('ab');

    // Человек допечатал, а адрес с «ab» пришёл только сейчас
    type(input, 'abc');
    rerender(<SearchBox value="ab" onSearch={onSearch} />);
    expect(input.value).toBe('abc');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenLastCalledWith('abc');
  });

  it('следует за адресом, когда его сменили снаружи', () => {
    const { rerender } = render(<SearchBox value="анна" onSearch={vi.fn()} />);
    const input = screen.getByLabelText<HTMLInputElement>('Поиск');

    // «Назад» или «Сбросить фильтры»
    rerender(<SearchBox value="" onSearch={vi.fn()} />);

    expect(input.value).toBe('');
  });
});
