  import { PrismaClient } from '@prisma/client'
  import type { NextApiRequest, NextApiResponse } from 'next'

  const prisma = new PrismaClient()

  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    // Настройка CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Обработка OPTIONS запроса
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    
  // Обработка GET запроса
  if (req.method === 'GET') {
    try {
      const userId = Number(req.query.userId); // или другой способ получения userId

      // Базовые условия запроса
      const queryOptions = {
        orderBy: {
          createdAt: 'desc'
        }
      };

      // Добавляем условие фильтрации только если userId указан и валиден
      if (userId && !isNaN(userId)) {
        queryOptions.where = {
          sharedWithUsers: {
            some: {
              userId: userId
            }
          }
        };
      }

      // Выполняем запрос
      const collections = await prisma.collection.findMany(queryOptions);

      // Если нужно получить задачи, можно сделать отдельный запрос
      const collectionsWithTasks = await Promise.all(
        collections.map(async (collection) => {
          const tasks = await prisma.collectionTask.findMany({
            where: { collectionId: collection.id },
            include: { task: true },
            orderBy: { order: 'asc' }
          })
          return { ...collection, tasks }
        })
      )

      console.log('Collections fetched:', collectionsWithTasks.length)
      return res.status(200).json(collectionsWithTasks)
      
    } catch (error: any) {
      console.error('GET Error:', error)
      return res.status(500).json({
        error: 'Database Error',
        details: process.env.NODE_ENV === 'development' 
          ? error.message 
          : undefined
      })
    }
  }

    // Обработка POST запроса
if (req.method === 'POST') {
  try {
    console.log('POST Request Body:', req.body)
    
    const { name, tasks } = req.body

    // Валидация данных
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Неверное название коллекции' })
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'Необходим массив задач' })
    }

    // Проверка существования задач
    const taskIds = tasks.map(t => t.id)
    const existingTasks = await prisma.task.findMany({
      where: { id: { in: taskIds } }
    })

    if (existingTasks.length !== taskIds.length) {
      return res.status(400).json({ error: 'Некоторые задачи не найдены' })
    }

    // Создаем коллекцию (БЕЗ поля description)
    const newCollection = await prisma.collection.create({
      data: {
        name: name.trim(),
        isPublished: false // оставляем только необходимые поля
      }
    })

    // Создаем связи между коллекцией и задачами
    await Promise.all(
      tasks.map((task, index) => 
        prisma.collectionTask.create({
          data: {
            collectionId: newCollection.id,
            taskId: task.id,
            order: index + 1
          }
        })
      )
    )

    // Получаем созданную коллекцию с задачами
    const collectionWithTasks = await prisma.collection.findUnique({
      where: { id: newCollection.id },
      include: {
        collections: {
          include: {
            task: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    console.log('Коллекция создана:', collectionWithTasks)
    return res.status(201).json(collectionWithTasks)

  } catch (error: any) {
    console.error('Ошибка POST:', error)
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : undefined
    })
  }
}}