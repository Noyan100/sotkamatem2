  import { NextResponse } from 'next/server';
  import { getServerSession } from 'next-auth';
  import { authOptions } from '@/pages/api/auth/[...nextauth]';
  import prisma from '@/lib/prisma';
  import fs from 'fs';
  import path from 'path';


  export async function GET(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Требуется авторизация' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      const collectionId = parseInt(params.id);
      if (isNaN(collectionId)) {
        return NextResponse.json(
          { error: 'Неверный ID подборки' },
          { status: 400 }
        );
      }

      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          collections: {
            include: { task: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!collection) {
        return NextResponse.json(
          { error: 'Подборка не найдена' },
          { status: 404 }
        );
      }

      const transformed = {
        ...collection,
        tasks: collection.collections.map(ct => ({
          ...ct.task,
          order: ct.order // Добавляем порядок задачи в подборке
        })),
      };

      return NextResponse.json(transformed);
      
    } catch (error) {
      console.error('[COLLECTION_GET]', error);
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }
  }

  export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    // Валидация ID подборки
    const collectionId = parseInt(params.id);
    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: 'Неверный ID подборки' },
        { status: 400 }
      );
    }

    // Проверка существования подборки
    const collectionExists = await prisma.collection.findUnique({
      where: { id: collectionId }
    });
    if (!collectionExists) {
      return NextResponse.json(
        { error: 'Подборка не найдена' },
        { status: 404 }
      );
    }

    // Парсинг тела запроса
    const requestData = await request.json();
    
    // Базовая валидация
    if (!requestData || typeof requestData !== 'object') {
      return NextResponse.json(
        { error: 'Неверный формат данных' },
        { status: 400 }
      );
    }

    // Изменяем структуру принимаемых данных
    const { solutions, userEmail } = requestData;

    // Проверка пользователя
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Создаем директорию для сохранения изображений
    const solutionsDir = path.join(process.cwd(), 'public', 'userSolutions', user.id.toString(), collectionId.toString());
    if (!fs.existsSync(solutionsDir)) {
      fs.mkdirSync(solutionsDir, { recursive: true });
    }

    const userSolution = await prisma.userSolution.create({
      data: {
        userId: user.id,
        collectionId,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    // Сохранение ответов на задачи и изображений
    const taskSolutions = await Promise.all(
      solutions.map(async (solution: {
        taskId: number;
        answer: string;
        images: string[];
      }) => {
        const { taskId, answer, images = [] } = solution;

        const task = await prisma.task.findUnique({
          where: { id: taskId },
        });

        if (!task) {
          throw new Error(`Задача с ID ${taskId} не найдена`);
        }

        // Создаем запись о решении задачи
        const taskSolution = await prisma.taskSolution.create({
          data: {
            userSolutionId: userSolution.id,
            taskId: taskId,
            userAnswer: String(answer),
            isCorrect: task.answer === String(answer),
            solvedAt: new Date(),
          },
        });

        // Обрабатываем все изображения для этой задачи
        await Promise.all(
          images.map(async (imageData, index) => {
            if (imageData.startsWith('data:image')) {
              const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              const fileName = `task_${taskId}_${Date.now()}_${index}.png`;
              const filePath = path.join(solutionsDir, fileName);
              fs.writeFileSync(filePath, buffer);
              
              await prisma.solutionImage.create({
                data: {
                  image: `/userSolutions/${user.id}/${collectionId}/${fileName}`,
                  solutionId: userSolution.id, // Связь с UserSolution
                  taskSolutionId: taskSolution.id, // Связь с TaskSolution
                },
              });
            } else if (typeof imageData === 'string') {
              await prisma.solutionImage.create({
                data: {
                  image: imageData,
                  solutionId: userSolution.id, // Связь с UserSolution
                  taskSolutionId: taskSolution.id, // Связь с TaskSolution
                },
              });
            }
          })
        );

        return taskSolution;
      })
    );

    return NextResponse.json({
      success: true,
      userSolutionId: userSolution.id,
      tasksSolved: taskSolutions.length,
    });

  } catch (error) {
    console.error('[COLLECTION_SUBMIT_ERROR]', error);
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

  // Добавляем обработку OPTIONS для CORS
  export async function OPTIONS() {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }