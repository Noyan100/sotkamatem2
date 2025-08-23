// app/api/solutions/user/[userId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    const whereClause = {
      userId: Number(userId),
      ...(collectionId && { collectionId: Number(collectionId) }),
    };

    const solutions = await prisma.userSolution.findMany({
      where: whereClause,
      include: {
        taskSolutions: {
          include: {
            task: {
              select: {
                id: true,
                number: true,
                text: true,
                answer: true,
              },
            },
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(solutions);
  } catch (error) {
    console.error('Error fetching user solutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user solutions' },
      { status: 500 }
    );
  }
}