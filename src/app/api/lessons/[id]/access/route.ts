// app/api/lessons/[id]/access/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accesses = await prisma.userLessonAccess.findMany({
      where: { recordingId: Number((await params).id) },
      select: { userId: true }
    })
    return NextResponse.json({ accesses })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch access' },
      { status: 500 }
    )
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userIds } = await request.json()
    const recordingId = Number((await params).id)

    // Удаляем старые доступы
    await prisma.userLessonAccess.deleteMany({
      where: { recordingId }
    })

    // Добавляем новые
    if (userIds.length > 0) {
      await prisma.userLessonAccess.createMany({
        data: userIds.map((userId: number) => ({
          userId,
          recordingId
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update access' },
      { status: 500 }
    )
  }
}