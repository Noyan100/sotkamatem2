import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Создание нового урока
export async function POST(request: Request) {
  try {
    const { title, description, vkVideoUrl, pdfUrl } = await request.json();

    // Валидация обязательных полей
    if (!title) {
      return NextResponse.json(
        { error: "Название урока обязательно" },
        { status: 400 }
      );
    }

    if (!vkVideoUrl) {
      return NextResponse.json(
        { error: "Ссылка на видео обязательна" },
        { status: 400 }
      );
    }

    // Проверка формата ссылки VK (примерная проверка)
    if (!vkVideoUrl.includes("vk.com/video_ext.php")) {
      return NextResponse.json(
        { error: "Неверный формат ссылки VK. Пример: https://vk.com/video_ext.php?oid=-12345&id=67890&hd=2" },
        { status: 400 }
      );
    }

    // Создаем новый урок
    const newLesson = await prisma.lessonRecording.create({
      data: {
        title,
        description: description || null,
        vkVideoUrl,
        pdfUrl: pdfUrl || null,
        createdAt: new Date(),
      },
    });

    return NextResponse.json(newLesson, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании урока:", error);
    return NextResponse.json(
      { error: "Не удалось создать урок" },
      { status: 500 }
    );
  }
}

// Получение списка пользователей с доступом к уроку
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const accesses = await prisma.userLessonAccess.findMany({
      where: { recordingId: parseInt(params.id) },
      include: { user: true },
    });

    return NextResponse.json(accesses);
  } catch (error) {
    console.error('Error fetching lesson accesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson accesses' },
      { status: 500 }
    );
  }
}