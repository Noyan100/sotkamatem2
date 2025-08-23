import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    const group = await prisma.group.create({
      data: {
        name,
        description
      }
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}