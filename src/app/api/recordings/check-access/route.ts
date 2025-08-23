// app/api/recordings/check-access/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const recordingId = searchParams.get('recordingId')

  if (!userId || !recordingId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const recording = await prisma.lessonRecording.findUnique({
    where: { id: Number(recordingId) },
    include: {
      accesses: {
        where: { userId: Number(userId) }
      }
    }
  })

  if (!recording) {
    return NextResponse.json({ hasAccess: false }, { status: 200 })
  }

  const hasAccess = recording.accesses.length > 0

  return NextResponse.json({ hasAccess }, { status: 200 })
}