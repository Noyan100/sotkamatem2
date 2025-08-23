import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, collectionId } = await request.json();

    // Валидация входных данных
    if (!userId || !collectionId) {
      return NextResponse.json(
        { error: 'Необходимо указать userId и collectionId' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем существование коллекции
    const collection = await prisma.collection.findUnique({
      where: { id: Number(collectionId) },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Коллекция не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, существует ли уже такой доступ
    const existingAccess = await prisma.userCollectionAccess.findUnique({
      where: {
        userId_collectionId: {
          userId: Number(userId),
          collectionId: Number(collectionId),
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Доступ уже предоставлен этому пользователю' },
        { status: 400 }
      );
    }

    // Создаем запись о доступе
    await prisma.userCollectionAccess.create({
      data: {
        userId: Number(userId),
        collectionId: Number(collectionId),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Доступ успешно предоставлен',
    });

  } catch (error) {
    console.error('Error granting access:', error);
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}