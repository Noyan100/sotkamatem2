import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || Array.isArray(id)) {
    return NextResponse.json(
      { error: 'Invalid collection ID' },
      { status: 400 }
    );
  }

  try {
    const numericCollectionId = parseInt(id);
    if (isNaN(numericCollectionId)) {
      return NextResponse.json(
        { error: 'Collection ID must be a number' },
        { status: 400 }
      );
    }

    // Получаем все задания для этой коллекции
    const assignments = await prisma.assignment.findMany({
      where: {
        collectionAssignment: {
          collectionId: numericCollectionId,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        whiteboards: {
          select: {
            id: true,
            title: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!assignments || assignments.length === 0) {
      return NextResponse.json(
        { error: 'No assignments found for this collection' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}