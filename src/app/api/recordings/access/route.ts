// app/api/recordings/access/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Добавить доступ
export async function POST(request: Request) {
  const { userId, recordingId } = await request.json()

  try {
    const access = await prisma.userLessonAccess.create({
      data: {
        userId: Number(userId),
        recordingId: Number(recordingId)
      }
    })
    return NextResponse.json(access)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 })
  }
}

// Удалить доступ
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const recordingId = searchParams.get('recordingId')

  try {
    await prisma.userLessonAccess.delete({
      where: {
        userId_recordingId: {
          userId: Number(userId),
          recordingId: Number(recordingId)
        }
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }
}