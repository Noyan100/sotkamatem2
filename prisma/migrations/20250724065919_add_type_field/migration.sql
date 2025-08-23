/*
  Warnings:

  - Added the required column `answer` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solution` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "answer" TEXT NOT NULL,
ADD COLUMN     "solution" TEXT NOT NULL,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "fullImage" DROP NOT NULL;
