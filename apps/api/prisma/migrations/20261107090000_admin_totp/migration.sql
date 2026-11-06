-- Второй фактор при входе: TOTP и одноразовые резервные коды

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "totp_enabled_at" TIMESTAMP(3),
ADD COLUMN     "totp_last_step" INTEGER,
ADD COLUMN     "totp_pending_secret" TEXT,
ADD COLUMN     "totp_secret" TEXT;

-- CreateTable
CREATE TABLE "admin_backup_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_backup_codes_code_hash_key" ON "admin_backup_codes"("code_hash");

-- CreateIndex
CREATE INDEX "admin_backup_codes_user_id_idx" ON "admin_backup_codes"("user_id");

-- AddForeignKey
ALTER TABLE "admin_backup_codes" ADD CONSTRAINT "admin_backup_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

