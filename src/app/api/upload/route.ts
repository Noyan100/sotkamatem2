import { NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Файл не получен' }, { status: 400 });
  }

  // Проверяем тип файла
  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Поддерживаются только PDF файлы' },
      { status: 400 }
    );
  }

  // Создаем уникальное имя файла
  const fileExtension = file.name.split('.').pop();
  const uniqueName = `${uuidv4()}.${fileExtension}`;
  const relativePath = `lectures/${uniqueName}`;
  const absolutePath = path.join(process.cwd(), 'public', relativePath);

  try {
    // Создаем директорию, если ее нет
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    // Конвертируем File в Buffer и сохраняем
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    return NextResponse.json({ url: relativePath });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении файла' },
      { status: 500 }
    );
  }
}