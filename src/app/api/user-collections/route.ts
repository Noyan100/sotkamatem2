import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const userCollections = await prisma.userCollectionAccess.findMany({
      where: { userId: Number(userId) },
      select: {
        collection: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(
      userCollections.map(uc => uc.collection)
    );
  } catch (error) {
    console.error('Error fetching user collections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}