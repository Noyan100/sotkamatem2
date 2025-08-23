import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ 
      where: { id: Number(id) } 
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id  = (await params).id

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { name, email, password } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, password },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof Error && error.message.includes('RecordNotFound')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await prisma.user.delete({ 
      where: { id: Number(id) } 
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('RecordNotFound')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}