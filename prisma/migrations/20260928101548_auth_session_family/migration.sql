/*
  Warnings:

  - Added the required column `familyId` to the `AuthSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuthSession" ADD COLUMN     "familyId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "AuthSession_familyId_revokedAt_idx" ON "AuthSession"("familyId", "revokedAt");
