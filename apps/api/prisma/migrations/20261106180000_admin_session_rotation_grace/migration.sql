-- Льготное окно ротации токена обновления: параллельные запросы вкладки
-- со старым токеном не должны завершать сессию

-- AlterTable
ALTER TABLE "admin_sessions" ADD COLUMN     "previous_token_hash" TEXT,
ADD COLUMN     "rotated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_previous_token_hash_key" ON "admin_sessions"("previous_token_hash");

