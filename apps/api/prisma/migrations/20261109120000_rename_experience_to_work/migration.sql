-- Места работы: experience -> work. Только переименования, данные не трогаются.
-- Писать вручную: prisma migrate dev на переименование модели генерирует
-- DROP TABLE + CREATE TABLE, и контент пропал бы.

ALTER TABLE "experience" RENAME TO "work";
ALTER TABLE "work" RENAME CONSTRAINT "experience_pkey" TO "work_pkey";
ALTER INDEX "experience_slug_key" RENAME TO "work_slug_key";

ALTER TABLE "experience_translations" RENAME TO "work_translations";
ALTER TABLE "work_translations" RENAME COLUMN "experience_id" TO "work_id";
ALTER TABLE "work_translations" RENAME CONSTRAINT "experience_translations_pkey" TO "work_translations_pkey";
ALTER TABLE "work_translations" RENAME CONSTRAINT "experience_translations_experience_id_fkey" TO "work_translations_work_id_fkey";

-- С PostgreSQL 18 у NOT NULL тоже есть имена (experience_role_not_null и т. п.),
-- и переименование таблицы их не меняет. В версиях до 18 таких ограничений нет,
-- поэтому не перечисляем их, а проходим циклом: на старом Postgres он ничего не найдёт.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conrelid::regclass AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'n'
      AND conrelid IN ('"work"'::regclass, '"work_translations"'::regclass)
      AND conname LIKE 'experience%'
  LOOP
    EXECUTE format(
      'ALTER TABLE %s RENAME CONSTRAINT %I TO %I',
      c.tbl,
      c.conname,
      replace(replace(c.conname, 'experience_translations_experience_id', 'work_translations_work_id'), 'experience', 'work')
    );
  END LOOP;
END $$;
