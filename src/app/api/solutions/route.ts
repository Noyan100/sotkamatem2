import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const solutions = await prisma.userSolution.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        taskSolutions: true,
      },
    });

    return NextResponse.json(solutions);
  } catch (error) {
    console.error("Error fetching solutions:", error);
    return NextResponse.json(
      { error: "Failed to fetch solutions" },
      { status: 500 }
    );
  }
}