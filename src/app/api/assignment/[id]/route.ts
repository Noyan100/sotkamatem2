//api/assignment/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  nextOrder?: string | null;
  prevOrder?: string | null;
  whiteboards?: any[];
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // Await params здесь!
    const assignmentId = id;

    // Получаем текущее задание
    const currentAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        title: true,
        description: true,
        nextOrder: true,
        prevOrder: true,
        whiteboards: true,
      },
    });

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Получаем предыдущее задание (если есть)
    const prevAssignment = currentAssignment.prevOrder
      ? await prisma.assignment.findUnique({
          where: { id: currentAssignment.prevOrder },
          select: { id: true, title: true },
        })
      : null;

    // Получаем следующее задание (если есть)
    const nextAssignment = currentAssignment.nextOrder
      ? await prisma.assignment.findUnique({
          where: { id: currentAssignment.nextOrder },
          select: { id: true, title: true },
        })
      : null;

    const response: Assignment & {
      next?: { id: string; title: string };
      prev?: { id: string; title: string };
    } = {
      ...currentAssignment,
      ...(nextAssignment && { next: nextAssignment }),
      ...(prevAssignment && { prev: prevAssignment }),
    };

    return new NextResponse(JSON.stringify(response), {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const { title, description } = await request.json();

    // Проверяем, существует ли задание
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Обновляем задание
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title || existingAssignment.title,
        description: description !== undefined ? description : existingAssignment.description,
      },
      select: {
        id: true,
        title: true,
        description: true,
        nextOrder: true,
        prevOrder: true,
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}