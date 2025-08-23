// app/api/solutions/[solutionId]/images/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { solutionId: string } }
) {
  try {
    const solutionId = parseInt(params.solutionId)
    if (isNaN(solutionId)) {
      return NextResponse.json(
        { error: 'Invalid solution ID' },
        { status: 400 }
      )
    }

    const images = await prisma.solutionImage.findMany({
      where: { solutionId },
      select: {
        id: true,
        image: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('[SOLUTION_IMAGES_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}