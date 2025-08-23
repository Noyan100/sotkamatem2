-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "solvedAt" TIMESTAMP(3),

    CONSTRAINT "CollectionUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTask" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,

    CONSTRAINT "CollectionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSolution" (
    "id" SERIAL NOT NULL,
    "collectionUserId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "TaskSolution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CollectionUser" ADD CONSTRAINT "CollectionUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionUser" ADD CONSTRAINT "CollectionUser_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTask" ADD CONSTRAINT "CollectionTask_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTask" ADD CONSTRAINT "CollectionTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSolution" ADD CONSTRAINT "TaskSolution_collectionUserId_fkey" FOREIGN KEY ("collectionUserId") REFERENCES "CollectionUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSolution" ADD CONSTRAINT "TaskSolution_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
