// app/api/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        payment: true
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    
    const newUser = await prisma.user.create({
      data: { 
        name,
        email,
        password,
        role: 'USER' // Устанавливаем роль по умолчанию
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}