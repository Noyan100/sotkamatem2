/*
  Warnings:

  - You are about to drop the column `fullImage` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "fullImage",
ADD COLUMN     "videoSrc" TEXT;
