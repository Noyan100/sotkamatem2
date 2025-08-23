import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Преобразуем строковый ID в число
    const collectionId = parseInt((await params).id);
    
    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID - must be a number" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        collections: {
          include: {
            task: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Коллекция не найдена" },
        { status: 404 }
      );
    }

    // Преобразуем данные к ожидаемому формату
    const responseData = {
      ...collection,
      tasks: collection.collections.map(ct => ({
        id: `${ct.collectionId}-${ct.taskId}`, // Создаём составной ID
        taskId: ct.taskId,
        order: ct.order,
        task: ct.task
      }))
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { 
        error: "Database error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const collectionId = parseInt((await params).id);
    const fs = require('fs');
    const path = require('path');

    // Start a transaction to ensure atomicity
    const deletedCollection = await prisma.$transaction(async (prisma) => {
      // 1. First handle all UserSolution related data with files
      const userSolutions = await prisma.userSolution.findMany({
        where: { collectionId },
        include: {
          images: true,
          taskSolutions: {
            include: {
              SolutionImage: true
            }
          }
        }
      });

      // Delete files from disk
      for (const solution of userSolutions) {
        // Delete UserSolution images
        for (const image of solution.images) {
          if (image.image) {
            const filePath = path.join(process.cwd(), 'public', image.image);
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (err) {
              console.error(`Error deleting file ${filePath}:`, err);
            }
          }
        }

        // Delete TaskSolution images
        for (const taskSolution of solution.taskSolutions) {
          for (const image of taskSolution.SolutionImage) {
            if (image.image) {
              const filePath = path.join(process.cwd(), 'public', image.image);
              try {
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
              } catch (err) {
                console.error(`Error deleting file ${filePath}:`, err);
              }
            }
          }
        }
      }

      // 2. Delete database records in proper order (from most dependent to least)

      // First delete SolutionImages
      await prisma.solutionImage.deleteMany({
        where: {
          OR: [
            { solution: { collectionId } },
            { taskSolution: { userSolution: { collectionId } } }
          ]
        }
      });

      // Delete TaskSolutions
      await prisma.taskSolution.deleteMany({
        where: {
          userSolution: {
            collectionId: collectionId,
          },
        },
      });

      // Delete UserSolutions
      await prisma.userSolution.deleteMany({
        where: {
          collectionId: collectionId,
        },
      });

      // Delete CollectionAccess records
      await prisma.userCollectionAccess.deleteMany({
        where: {
          collectionId: collectionId,
        },
      });

      // Delete Whiteboards related to assignments
      await prisma.whiteboard.deleteMany({
        where: {
          assignment: {
            collectionAssignment: {
              collectionId: collectionId,
            },
          },
        },
      });

      // Delete Assignments
      await prisma.assignment.deleteMany({
        where: {
          collectionAssignment: {
            collectionId: collectionId,
          },
        },
      });

      // Delete CollectionAssignments
      await prisma.collectionAssignment.deleteMany({
        where: {
          collectionId: collectionId,
        },
      });

      // Delete CollectionTasks
      await prisma.collectionTask.deleteMany({
        where: {
          collectionId: collectionId,
        },
      });

      // Finally delete the collection
      return await prisma.collection.delete({
        where: {
          id: collectionId,
        },
      });
    });

    return NextResponse.json(deletedCollection);
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete collection",
        message: error.message,
        details: error.meta // This might contain info about the constraint violation
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}