'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  profileInputSchema,
  type ProfileData,
  type ProfileInput,
} from '@portfolio/shared';
import { useQuery } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import {
  contentKeys,
  fetchProfile,
  saveProfile,
  type AdminProfile,
} from '@/features/admin/content/content-api';
import {
  ListField,
  Localized,
  SaveBar,
  TextAreaField,
  TextField,
} from '@/features/admin/content/form/fields';
import { useSave } from '@/features/admin/content/form/use-save';

export function ProfileEditor() {
  const profile = useQuery({
    queryKey: contentKeys.profile(),
    queryFn: ({ signal }) => fetchProfile(signal),
  });

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Профиль</h1>
      {profile.isPending ? (
        <p className="text-muted">Загружаем…</p>
      ) : profile.isError ? (
        <p role="alert" className="text-accent">
          Не удалось загрузить профиль
        </p>
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </section>
  );
}

function ProfileForm({ profile }: { profile: AdminProfile }) {
  const form = useForm<ProfileInput, unknown, ProfileData>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: profile,
  });
  const { onSubmit, pending, status } = useSave(form, {
    save: saveProfile,
    invalidate: [contentKeys.profile()],
    // Сохранённое становится новой точкой отсчёта: форма больше не «грязная»
    onSaved: (saved) => form.reset(saved),
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="title" label="Роль" />
          <TextField name="specialization" label="Специализация" />
        </div>

        <Localized>
          {(_locale, t) => (
            <>
              <TextField name={`${t}.fullName`} label="Полное имя" />
              <TextField name={`${t}.shortName`} label="Короткое имя" />
              <TextAreaField
                name={`${t}.summary`}
                label="Кратко о себе"
                rows={5}
              />
              <ListField
                name={`${t}.about`}
                label="История на главной"
                hint="Абзац на строку"
                rows={8}
              />
            </>
          )}
        </Localized>

        <fieldset className="grid gap-4 md:grid-cols-2">
          <legend className="mb-2 text-sm text-muted">Контакты</legend>
          <TextField name="email" label="Почта" type="email" />
          <TextField name="telegramUrl" label="Telegram" type="url" />
          <TextField name="githubUrl" label="GitHub" type="url" />
          <TextField name="linkedinUrl" label="LinkedIn" type="url" />
        </fieldset>

        <SaveBar pending={pending} status={status} />
      </form>
    </FormProvider>
  );
}
