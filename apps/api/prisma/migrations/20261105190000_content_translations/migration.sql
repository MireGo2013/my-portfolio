-- Тексты контента переезжают в таблицы переводов. Существующие строки
-- становятся русской версией, поэтому данные не теряются.

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ru', 'en');

-- CreateTable
CREATE TABLE "profile_translations" (
    "profile_id" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "full_name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "profile_translations_pkey" PRIMARY KEY ("profile_id","locale")
);

-- CreateTable
CREATE TABLE "experience_translations" (
    "experience_id" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "company" TEXT,
    "project" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" TEXT[],

    CONSTRAINT "experience_translations_pkey" PRIMARY KEY ("experience_id","locale")
);

-- CreateTable
CREATE TABLE "project_translations" (
    "project_id" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "project_translations_pkey" PRIMARY KEY ("project_id","locale")
);

-- CreateTable
CREATE TABLE "skill_category_translations" (
    "category_id" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skill_category_translations_pkey" PRIMARY KEY ("category_id","locale")
);

-- AddForeignKey
ALTER TABLE "profile_translations" ADD CONSTRAINT "profile_translations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "experience_translations" ADD CONSTRAINT "experience_translations_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_translations" ADD CONSTRAINT "project_translations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_category_translations" ADD CONSTRAINT "skill_category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Копируем данные до удаления колонок
INSERT INTO "profile_translations" ("profile_id", "locale", "full_name", "summary")
SELECT "id", 'ru', "full_name", "summary" FROM "profile";

INSERT INTO "experience_translations" ("experience_id", "locale", "company", "project", "summary", "highlights")
SELECT "id", 'ru', "company", "project", "summary", "highlights" FROM "experience";

INSERT INTO "project_translations" ("project_id", "locale", "name", "description")
SELECT "id", 'ru', "name", "description" FROM "projects";

INSERT INTO "skill_category_translations" ("category_id", "locale", "name")
SELECT "id", 'ru', "name" FROM "skill_categories";

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "full_name", DROP COLUMN "summary";

-- Значение по умолчанию нужно только для существующей строки: её обновит seed
ALTER TABLE "profile" ADD COLUMN "linkedin_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "profile" ALTER COLUMN "linkedin_url" DROP DEFAULT;

-- AlterTable
ALTER TABLE "experience" DROP COLUMN "company", DROP COLUMN "project", DROP COLUMN "summary", DROP COLUMN "highlights";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "name", DROP COLUMN "description";

-- AlterTable
ALTER TABLE "skill_categories" DROP COLUMN "name";
