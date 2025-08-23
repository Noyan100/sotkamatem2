//api/collection-assignments/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const collection = await prisma.collectionAssignment.findUnique({
      where: { id: Number((await params).id) },
      include: {
        assignments: {
          include: {
            whiteboards: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title } = await request.json();

    const updatedCollection = await prisma.collectionAssignment.update({
      where: { id: Number((await params).id) },
      data: {
        title,
      },
    });

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.collectionAssignment.delete({
      where: { id: Number((await params).id) },
    });

    return NextResponse.json(
      { message: 'Collection deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title, description } = await request.json();
    const collectionId = Number((await params).id);

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Создаем новое задание с автоматически созданной первой доской
    const newAssignment = await prisma.$transaction(async (prisma) => {
      // Сначала создаем assignment
      const assignment = await prisma.assignment.create({
        data: {
          title,
          description: description || '',
          collectionAssignmentId: collectionId
        }
      });

      // Затем создаем whiteboard с правильной структурой данных
      const whiteboard = await prisma.whiteboard.create({
        data: {
          title: 'Страница 1',
          assignmentId: assignment.id,
          data: {} // Пустой объект JSON для данных доски
        }
      });

      // Возвращаем assignment с включенными whiteboards
      return await prisma.assignment.findUnique({
        where: { id: assignment.id },
        include: {
          whiteboards: true
        }
      });
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}