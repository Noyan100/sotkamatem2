import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Обновление урока (PUT для полного обновления, PATCH для частичного)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем данные как FormData
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const vkVideoUrl = formData.get('vkVideoUrl') as string;
    const pdfFile = formData.get('pdfFile') as File | null;
    const removePdf = formData.get('removePdf') === 'true';
    const pdfUrl = formData.get('pdfUrl') as string | null;

    // Валидация
    if (!title) {
      return NextResponse.json(
        { error: "Название урока обязательно" },
        { status: 400 }
      );
    }

    // Получаем текущий урок
    const lesson = await prisma.lessonRecording.findUnique({
      where: { id: parseInt((await params).id) },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Урок не найден" },
        { status: 404 }
      );
    }

    let newPdfUrl = lesson.pdfUrl;

    // Обработка PDF файла
    if (pdfFile) {
      try {
        // Удаляем старый файл, если он есть
        if (lesson.pdfUrl) {
          const oldFilePath = path.join(process.cwd(), 'public', lesson.pdfUrl);
          await fs.unlink(oldFilePath).catch(console.error);
        }

        // Сохраняем новый файл
        const uploadDir = path.join(process.cwd(), 'public', 'lectures');
        const fileName = `lesson_${(await params).id}_${Date.now()}.pdf`;
        const filePath = path.join(uploadDir, fileName);

        // Создаем директорию, если ее нет
        await fs.mkdir(uploadDir, { recursive: true });

        // Читаем файл и сохраняем
        const fileBuffer = await pdfFile.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(fileBuffer));

        newPdfUrl = path.join('lectures', fileName);
      } catch (error) {
        console.error("Ошибка при загрузке файла:", error);
        return NextResponse.json(
          { error: "Не удалось загрузить файл" },
          { status: 500 }
        );
      }
    } else if (removePdf) {
      // Удаляем файл, если пользователь его убрал
      if (lesson.pdfUrl) {
        const filePath = path.join(process.cwd(), 'public', lesson.pdfUrl);
        await fs.unlink(filePath).catch(console.error);
      }
      newPdfUrl = null;
    }

    // Обновляем урок в базе данных
    const updatedLesson = await prisma.lessonRecording.update({
      where: { id: parseInt((await params).id) },
      data: {
        title,
        description: description || null,
        vkVideoUrl,
        pdfUrl: newPdfUrl,
      },
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("Ошибка при обновлении урока:", error);
    return NextResponse.json(
      { error: "Не удалось обновить урок" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем существование урока
    const lesson = await prisma.lessonRecording.findUnique({
      where: { id: Number((await params).id) },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      );
    }

    // Если есть PDF-файл, удаляем его
    if (lesson.pdfUrl) {
      try {
        // Преобразуем URL в путь к файлу (адаптируйте под вашу файловую структуру)
        const filePath = path.join(process.cwd(), 'public', lesson.pdfUrl);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Ошибка при удалении PDF-файла:', fileError);
        // Можно продолжить удаление урока даже если файл не удалился
      }
    }

    // Удаляем связанные записи о доступах
    await prisma.userLessonAccess.deleteMany({
      where: { recordingId: Number((await params).id) },
    });

    // Удаляем сам урок
    await prisma.lessonRecording.delete({
      where: { id: Number((await params).id) },
    });

    return NextResponse.json(
      { success: true, message: 'Урок успешно удалён' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при удалении урока:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить урок' },
      { status: 500 }
    );
  }
}