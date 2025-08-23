import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: {  params: Promise<{ id: string }>  }
) {
  try {
    const taskId = parseInt((await params).id);
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID - must be a number" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
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