// app/api/assignment/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        whiteboards: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(assignments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка загрузки заданий' },
      { status: 500 }
    )
  }
}
// app/api/assignment/route.ts (продолжение)

export async function POST(request: Request) {
  try {
    const { title, description, collectionAssignmentId } = await request.json();

    // Получаем последнее задание в коллекции
    const lastAssignment = await prisma.assignment.findFirst({
      where: {
        collectionAssignmentId: Number(collectionAssignmentId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Создаем новое задание
    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        description,
        collectionAssignmentId: Number(collectionAssignmentId),
        prevOrder: lastAssignment?.id ?? null,
        nextOrder: null,
        whiteboards: {
          create: {
            title: "Страница 1",
            data: {},
            prevOrder: null,
            nextOrder: null,
          },
        },
      },
      include: {
        whiteboards: true,
      },
    });

    // Если есть предыдущее задание, обновляем его nextOrder
    if (lastAssignment) {
      await prisma.assignment.update({
        where: { id: lastAssignment.id },
        data: { nextOrder: newAssignment.id },
      });
    }

    return NextResponse.json(newAssignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID задания не указан' },
        { status: 400 }
      );
    }

    // Сначала находим задание, чтобы получить информацию о связях
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        whiteboards: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Задание не найдено' },
        { status: 404 }
      );
    }

    // Удаляем все связанные доски
    await prisma.whiteboard.deleteMany({
      where: { assignmentId: id },
    });

    // Обновляем связи у соседних заданий
    if (assignment.prevOrder) {
      await prisma.assignment.update({
        where: { id: assignment.prevOrder },
        data: { nextOrder: assignment.nextOrder },
      });
    }

    if (assignment.nextOrder) {
      await prisma.assignment.update({
        where: { id: assignment.nextOrder },
        data: { prevOrder: assignment.prevOrder },
      });
    }

    // Удаляем само задание
    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Задание успешно удалено' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при удалении задания:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении задания' },
      { status: 500 }
    );
  }
}