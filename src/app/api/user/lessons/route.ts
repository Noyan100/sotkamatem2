import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    // Базовые условия запроса
    const whereClause: any = {}

    // Добавляем фильтр по userId если он есть
    if (userId) {
      whereClause.accesses = { some: { userId: Number(userId) } }
    }

    // Получаем общее количество записей
    const totalCount = await prisma.lessonRecording.count({
      where: whereClause
    })

    // Получаем уроки с пагинацией
    const lessons = await prisma.lessonRecording.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({ 
      lessons,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}