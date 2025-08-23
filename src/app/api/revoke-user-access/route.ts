import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, collectionId } = await request.json();

    if (!userId || !collectionId) {
      return NextResponse.json(
        { error: 'User ID and Collection ID are required' },
        { status: 400 }
      );
    }

    await prisma.userCollectionAccess.delete({
      where: {
        userId_collectionId: {
          userId: Number(userId),
          collectionId: Number(collectionId),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}