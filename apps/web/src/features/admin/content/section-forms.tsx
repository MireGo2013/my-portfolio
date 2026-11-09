'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  workInputSchema,
  PROJECT_KINDS,
  projectInputSchema,
  skillCategoryInputSchema,
  type WorkData,
  type WorkInput,
  type ProjectData,
  type ProjectInput,
  type SkillCategoryData,
  type SkillCategoryInput,
} from '@portfolio/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId } from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { INPUT_CLASS } from '@/shared/ui/form-field';
import {
  contentKeys,
  sections,
  type AdminWork,
  type AdminProject,
  type AdminSkillCategory,
  type ListSection,
} from '@/features/admin/content/content-api';
import { CONTENT_PATHS } from '@/features/admin/shell/paths';
import {
  ListField,
  Localized,
  SaveBar,
  TextAreaField,
  TextField,
} from '@/features/admin/content/form/fields';
import { useSave } from '@/features/admin/content/form/use-save';

/** id из ответа не входит в тело запроса: форма хранит только поля записи. */
function withoutId<T extends { id: string }>({ id, ...rest }: T) {
  return rest;
}

/** Отметка в адресе: запись только что создана, покажи «Сохранено». */
const CREATED_PARAM = 'created';

/**
 * Создание и правка устроены одинаково: новая запись после сохранения
 * открывается по своему адресу, существующая остаётся на месте.
 *
 * На новом адресе форма собирается заново и забывает, что сохранение прошло.
 * Поэтому передаём это через ?created=1, а саму запись кладём в кэш заранее:
 * страница откроется сразу, без загрузки.
 */
function useSectionSave<
  S extends ListSection,
  TInput extends FieldValues,
  TOutput,
>(
  section: S,
  id: string | undefined,
  form: UseFormReturn<TInput, unknown, TOutput>,
  toValues: (record: never) => TInput,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const justCreated = useSearchParams().get(CREATED_PARAM) === '1';

  // Отметка нужна один раз: после перезагрузки «Сохранено» было бы неправдой
  useEffect(() => {
    if (justCreated) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [justCreated]);

  const api = sections[section] as unknown as {
    create: (body: TOutput) => Promise<{ id: string }>;
    update: (id: string, body: TOutput) => Promise<{ id: string }>;
  };
  return useSave(form, {
    save: (values) => (id ? api.update(id, values) : api.create(values)),
    invalidate: [
      contentKeys.list(section),
      ...(id ? [contentKeys.item(section, id)] : []),
    ],
    initialStatus: justCreated ? 'saved' : null,
    onSaved: (saved) => {
      if (id) {
        form.reset(toValues(saved as never));
        return;
      }
      queryClient.setQueryData(contentKeys.item(section, saved.id), saved);
      router.replace(
        `${CONTENT_PATHS[section]}/${saved.id}?${CREATED_PARAM}=1`,
      );
    },
  });
}

/** Пустая строка в поле месяца — «по настоящее время». */
const monthOrNull = { setValueAs: (value: unknown) => value || null };

function SlugField() {
  return (
    <TextField
      name="slug"
      label="Адрес (slug)"
      hint="Латиница, цифры и дефисы: scooter-admin-crm"
    />
  );
}

// ---------- Коммерческие проекты (API /work) ----------

const EMPTY_WORK_TEXT = {
  company: null,
  project: '',
  summary: '',
  responsibilities: [],
  achievements: [],
};

const workValues = (record: AdminWork): WorkInput => withoutId(record);

export function WorkForm({ record }: { record?: AdminWork }) {
  const form = useForm<WorkInput, unknown, WorkData>({
    resolver: zodResolver(workInputSchema),
    defaultValues: record
      ? workValues(record)
      : {
          slug: '',
          role: '',
          startDate: '',
          endDate: null,
          stack: [],
          translations: {
            ru: EMPTY_WORK_TEXT,
            en: EMPTY_WORK_TEXT,
          },
        },
  });
  const { onSubmit, pending, status } = useSectionSave(
    'work',
    record?.id,
    form,
    workValues,
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SlugField />
          <TextField name="role" label="Роль" />
          <TextField
            name="startDate"
            label="Начало"
            type="month"
            placeholder="ГГГГ-ММ"
          />
          <TextField
            name="endDate"
            label="Конец"
            type="month"
            placeholder="ГГГГ-ММ"
            hint="Пусто — работа продолжается"
            options={monthOrNull}
          />
        </div>
        <ListField name="stack" label="Стек" rows={6} />

        <Localized>
          {(_locale, t) => (
            <>
              <TextField
                name={`${t}.company`}
                label="Компания"
                hint="Можно оставить пустой"
              />
              <TextField name={`${t}.project`} label="Проект" />
              <TextAreaField name={`${t}.summary`} label="Описание" />
              <ListField
                name={`${t}.responsibilities`}
                label="Обязанности"
                rows={6}
              />
              <ListField
                name={`${t}.achievements`}
                label="Достижения"
                rows={6}
              />
            </>
          )}
        </Localized>

        <SaveBar pending={pending} status={status} />
      </form>
    </FormProvider>
  );
}

// ---------- Открытые проекты и фриланс (API /projects) ----------

const KIND_LABELS: Record<(typeof PROJECT_KINDS)[number], string> = {
  OPEN_SOURCE: 'Открытый проект',
  FREELANCE: 'Фриланс',
};

const projectValues = (record: AdminProject): ProjectInput => withoutId(record);

function KindField() {
  const id = useId();
  const { register } = useFormContext();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Тип
      </label>
      <select id={id} {...register('kind')} className={INPUT_CLASS}>
        {PROJECT_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {KIND_LABELS[kind]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProjectForm({ record }: { record?: AdminProject }) {
  const form = useForm<ProjectInput, unknown, ProjectData>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: record
      ? projectValues(record)
      : {
          slug: '',
          kind: 'OPEN_SOURCE',
          stack: [],
          repoUrl: null,
          liveUrl: null,
          translations: {
            ru: { name: '', description: '' },
            en: { name: '', description: '' },
          },
        },
  });
  const { onSubmit, pending, status } = useSectionSave(
    'projects',
    record?.id,
    form,
    projectValues,
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SlugField />
          <KindField />
          <TextField
            name="repoUrl"
            label="Код"
            type="url"
            hint="Можно оставить пустым"
          />
          <TextField
            name="liveUrl"
            label="Сайт"
            type="url"
            hint="Можно оставить пустым"
          />
        </div>
        <ListField name="stack" label="Стек" rows={5} />

        <Localized>
          {(_locale, t) => (
            <>
              <TextField name={`${t}.name`} label="Название" />
              <TextAreaField name={`${t}.description`} label="Описание" />
            </>
          )}
        </Localized>

        <SaveBar pending={pending} status={status} />
      </form>
    </FormProvider>
  );
}

// ---------- Стек ----------

const skillCategoryValues = (record: AdminSkillCategory): SkillCategoryInput =>
  withoutId(record);

export function SkillCategoryForm({ record }: { record?: AdminSkillCategory }) {
  const form = useForm<SkillCategoryInput, unknown, SkillCategoryData>({
    resolver: zodResolver(skillCategoryInputSchema),
    defaultValues: record
      ? skillCategoryValues(record)
      : {
          slug: '',
          translations: { ru: { name: '' }, en: { name: '' } },
          skills: [],
        },
  });
  const { onSubmit, pending, status } = useSectionSave(
    'skills',
    record?.id,
    form,
    skillCategoryValues,
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="max-w-md">
          <SlugField />
        </div>
        <Localized>
          {(_locale, t) => (
            <TextField name={`${t}.name`} label="Название группы" />
          )}
        </Localized>
        <ListField
          name="skills"
          label="Навыки"
          hint="По одному на строку, в порядке показа на сайте"
          rows={10}
        />
        <SaveBar pending={pending} status={status} />
      </form>
    </FormProvider>
  );
}
