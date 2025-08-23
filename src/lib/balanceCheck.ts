// lib/balanceCheck.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function checkBalance(userId: number): Promise<{
  hasAccess: boolean;
  response?: NextResponse;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        payment: true
      }
    });
    
    if (!user) {
      return {
        hasAccess: false,
        response: NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      };
    }

    // Проверяем только баланс (без подписки)
    // Если payment null или undefined, считаем баланс отрицательным
    const hasPositiveBalance = user.payment !== null && user.payment !== undefined && user.payment >= 0;
    
    if (!hasPositiveBalance) {
      return {
        hasAccess: false,
        response: NextResponse.json(
          { 
            error: 'Insufficient balance',
            message: 'Please top up your account to continue using the service',
            currentBalance: user.payment || 0
          },
          { status: 402 }
        )
      };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error('Balance check error:', error);
    return {
      hasAccess: false,
      response: NextResponse.json(
        { error: 'Balance check failed' },
        { status: 500 }
      )
    };
  }
}