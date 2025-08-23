import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { payment } = await request.json();
    const userId = Number(params.id);


    // Валидация userId
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID. Must be a number.' },
        { status: 400 }
      );
    }

    // Валидация payment
    if (typeof payment !== 'number') {
      return NextResponse.json(
        { error: 'Payment must be a number.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { payment },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    );
  }
}