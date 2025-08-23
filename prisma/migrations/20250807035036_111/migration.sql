/*
  Warnings:

  - The primary key for the `CollectionTask` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `CollectionTask` table. All the data in the column will be lost.
  - You are about to drop the column `answer` on the `TaskSolution` table. All the data in the column will be lost.
  - You are about to drop the column `collectionUserId` on the `TaskSolution` table. All the data in the column will be lost.
  - You are about to drop the `CollectionUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userAnswer` to the `TaskSolution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userSolutionId` to the `TaskSolution` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CollectionUser" DROP CONSTRAINT "CollectionUser_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionUser" DROP CONSTRAINT "CollectionUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskSolution" DROP CONSTRAINT "TaskSolution_collectionUserId_fkey";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CollectionTask" DROP CONSTRAINT "CollectionTask_pkey",
DROP COLUMN "id",
ADD COLUMN     "order" INTEGER,
ADD CONSTRAINT "CollectionTask_pkey" PRIMARY KEY ("collectionId", "taskId");

-- AlterTable
ALTER TABLE "TaskSolution" DROP COLUMN "answer",
DROP COLUMN "collectionUserId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "timeSpent" INTEGER,
ADD COLUMN     "userAnswer" TEXT NOT NULL,
ADD COLUMN     "userSolutionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "CollectionUser";

-- CreateTable
CREATE TABLE "UserSolution" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Whiteboard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "nextOrder" TEXT,
    "prevOrder" TEXT,
    "data" JSONB NOT NULL,
    "assignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Whiteboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "nextOrder" TEXT,
    "prevOrder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collectionAssignmentId" INTEGER NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionAssignment" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "collectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "UserSolution" ADD CONSTRAINT "UserSolution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSolution" ADD CONSTRAINT "UserSolution_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSolution" ADD CONSTRAINT "TaskSolution_userSolutionId_fkey" FOREIGN KEY ("userSolutionId") REFERENCES "UserSolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Whiteboard" ADD CONSTRAINT "Whiteboard_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_collectionAssignmentId_fkey" FOREIGN KEY ("collectionAssignmentId") REFERENCES "CollectionAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAssignment" ADD CONSTRAINT "CollectionAssignment_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
