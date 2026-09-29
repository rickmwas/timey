ALTER TABLE "ScheduleChange" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "ScheduleChange_actorId_idempotencyKey_key"
ON "ScheduleChange"("actorId", "idempotencyKey");