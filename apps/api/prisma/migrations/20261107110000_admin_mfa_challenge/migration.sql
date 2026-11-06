-- Шаг входа с кодом: одноразовый идентификатор и счётчик попыток

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "mfa_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mfa_challenge_id" UUID;

