-- История о себе на главной и разделение опыта на обязанности и достижения,
-- как в резюме. Прежние пункты становятся достижениями, остальное заполнит seed.

-- AlterTable
ALTER TABLE "profile_translations" ADD COLUMN "short_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "profile_translations" ALTER COLUMN "short_name" DROP DEFAULT;
ALTER TABLE "profile_translations" ADD COLUMN "about" TEXT[];

-- AlterTable
ALTER TABLE "experience_translations" RENAME COLUMN "highlights" TO "achievements";
ALTER TABLE "experience_translations" ADD COLUMN "responsibilities" TEXT[];
