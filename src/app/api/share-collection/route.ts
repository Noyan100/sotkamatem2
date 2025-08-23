import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { groupId, collectionId } = await req.json()

    // Валидация входных данных
    if (!groupId || !collectionId) {
      return NextResponse.json(
        { error: 'groupId и collectionId обязательны' },
        { status: 400 }
      )
    }

    // Проверка существования группы
    const groupExists = await prisma.group.findUnique({
      where: { id: Number(groupId) }
    })
    if (!groupExists) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Проверка существования коллекции
    const collectionExists = await prisma.collection.findUnique({
      where: { id: Number(collectionId) }
    })
    if (!collectionExists) {
      return NextResponse.json(
        { error: 'Коллекция не найдена' },
        { status: 404 }
      )
    }

    // Получаем всех участников группы
    const groupMembers = await prisma.groupUser.findMany({
      where: { groupId: Number(groupId) },
      select: { userId: true }
    })

    if (groupMembers.length === 0) {
      return NextResponse.json(
        { error: 'В группе нет участников' },
        { status: 400 }
      )
    }

    // Создаём доступы
    const operations = groupMembers.map(member =>
      prisma.userCollectionAccess.upsert({
        where: {
          userId_collectionId: {
            userId: member.userId,
            collectionId: Number(collectionId)
          }
        },
        create: {
          userId: member.userId,
          collectionId: Number(collectionId)
        },
        update: {}
      })
    )

    const results = await prisma.$transaction(operations)

    return NextResponse.json({
      success: true,
      message: `Доступ предоставлен ${results.length} пользователям`,
      details: results
    })

  } catch (error) {
    console.error('Error in share-collection:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}