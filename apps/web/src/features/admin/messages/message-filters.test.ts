import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filtersToApiQuery,
  filtersToSearch,
  hasInvalidPeriod,
  parseMessageFilters,
} from './message-filters';

const parse = (search: string) =>
  parseMessageFilters(new URLSearchParams(search));

describe('parseMessageFilters', () => {
  it('без параметров отдаёт значения по умолчанию', () => {
    expect(parse('')).toEqual({
      q: '',
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      pageSize: 20,
    });
  });

  it('читает все фильтры из адреса', () => {
    expect(
      parse(
        'status=SPAM&q=анна&from=2026-11-01&to=2026-11-05&sort=name&order=asc&page=3&pageSize=50',
      ),
    ).toEqual({
      status: 'SPAM',
      q: 'анна',
      from: '2026-11-01',
      to: '2026-11-05',
      sort: 'name',
      order: 'asc',
      page: 3,
      pageSize: 50,
    });
  });

  it('неверные значения заменяет значениями по умолчанию', () => {
    expect(
      parse(
        'status=DELETED&from=вчера&sort=message&order=up&page=-1&pageSize=13',
      ),
    ).toEqual(DEFAULT_FILTERS);
  });
});

describe('filtersToSearch', () => {
  it('не пишет в адрес значения по умолчанию', () => {
    expect(filtersToSearch(DEFAULT_FILTERS)).toBe('');
    expect(
      filtersToSearch({ ...DEFAULT_FILTERS, status: 'NEW', page: 2 }),
    ).toBe('?status=NEW&page=2');
  });

  it('разбор и запись дают тот же адрес', () => {
    const search = '?status=READ&q=x&from=2026-01-02&sort=email&order=asc';

    expect(filtersToSearch(parse(search))).toBe(search);
  });
});

describe('filtersToApiQuery', () => {
  it('«по» включает весь последний день: граница — следующая полночь', () => {
    const query = filtersToApiQuery({
      ...DEFAULT_FILTERS,
      from: '2026-11-01',
      to: '2026-11-05',
    });

    expect(query.from).toBe(new Date(2026, 10, 1).toISOString());
    expect(query.to).toBe(new Date(2026, 10, 6).toISOString());
  });

  it('пустой поиск не отправляет', () => {
    expect(filtersToApiQuery({ ...DEFAULT_FILTERS, q: '   ' }).q).toBe(
      undefined,
    );
  });
});

it('hasInvalidPeriod замечает «с» позже «по»', () => {
  expect(
    hasInvalidPeriod({
      ...DEFAULT_FILTERS,
      from: '2026-11-05',
      to: '2026-11-01',
    }),
  ).toBe(true);
  expect(
    hasInvalidPeriod({
      ...DEFAULT_FILTERS,
      from: '2026-11-01',
      to: '2026-11-01',
    }),
  ).toBe(false);
});
